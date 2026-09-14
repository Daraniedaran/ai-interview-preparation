from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.mock_interview import MockInterview, InterviewResponse, InterviewStatus
from app.models.leaderboard import Leaderboard
from app.models.student_profile import StudentProfile
from app.schemas.interview import (
    StartInterviewRequest, SubmitAnswerRequest,
    MockInterviewResponse, NextQuestionResponse
)
from app.utils.ai_client import (
    generate_interview_question, evaluate_interview_answer, generate_interview_summary
)
from app.utils.pdf_utils import generate_interview_report_pdf
from typing import List
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/interviews", tags=["Mock Interviews"])


@router.post("/start", response_model=dict, status_code=201)
async def start_interview(
    data: StartInterviewRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Start a new AI mock interview session."""
    interview = MockInterview(
        user_id=current_user.id,
        company_id=data.company_id,
        interview_type=data.interview_type,
        target_role=data.target_role or "Software Engineer",
        difficulty=data.difficulty,
        status=InterviewStatus.IN_PROGRESS,
        total_questions=data.num_questions,
        answered_questions=0,
    )
    db.add(interview)
    db.commit()
    db.refresh(interview)

    # Generate first question
    company_name = None
    if data.company_id:
        from app.models.company import Company
        company = db.query(Company).filter(Company.id == data.company_id).first()
        if company:
            company_name = company.name

    first_question = await generate_interview_question(
        interview_type=data.interview_type.value,
        target_role=data.target_role or "Software Engineer",
        company_name=company_name,
        difficulty=data.difficulty,
        question_number=1,
        previous_questions=[],
    )

    # Persist the current question so the session can be resumed after a refresh
    interview.current_question = 0
    interview.current_question_text = first_question
    db.commit()

    return {
        "interview_id": interview.id,
        "question_number": 1,
        "question_text": first_question,
        "total_questions": data.num_questions,
        "interview_type": data.interview_type.value,
        "target_role": data.target_role,
    }


@router.post("/answer")
async def submit_answer(
    data: SubmitAnswerRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Submit an answer and get AI feedback. Returns next question or completion signal."""
    interview = db.query(MockInterview).filter(
        MockInterview.id == data.interview_id,
        MockInterview.user_id == current_user.id,
    ).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    if interview.status == InterviewStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Interview already completed")
    # Validate sequencing: prevent replay/skip/duplicate submissions
    expected_q = (interview.answered_questions or 0) + 1
    if data.question_number != expected_q:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid question_number. Expected {expected_q}, got {data.question_number}",
        )
    if interview.current_question_text and data.question_text != interview.current_question_text:
        # Allow if resuming with stale fallback only when no current text was set
        raise HTTPException(status_code=400, detail="question_text does not match current interview question")

    # Evaluate the answer
    evaluation = await evaluate_interview_answer(
        question=data.question_text,
        answer=data.student_answer,
        interview_type=interview.interview_type.value,
        target_role=interview.target_role or "Software Engineer",
    )

    # Save response
    response = InterviewResponse(
        interview_id=interview.id,
        question_number=data.question_number,
        question_text=data.question_text,
        student_answer=data.student_answer,
        voice_transcript=data.voice_transcript,
        ai_feedback=evaluation.get("ai_feedback"),
        score=evaluation.get("score"),
        ideal_answer=evaluation.get("ideal_answer"),
        keywords_used=evaluation.get("keywords_used", []),
        keywords_missed=evaluation.get("keywords_missed", []),
    )
    db.add(response)
    interview.answered_questions = data.question_number
    db.flush()

    # Check if interview is complete
    is_last = data.question_number >= interview.total_questions

    if is_last:
        # Generate summary
        all_responses = db.query(InterviewResponse).filter(
            InterviewResponse.interview_id == interview.id
        ).all()

        responses_data = [
            {
                "question": r.question_text,
                "answer": r.student_answer or "",
                "score": r.score,
            }
            for r in all_responses
        ]

        summary = await generate_interview_summary(
            interview_type=interview.interview_type.value,
            target_role=interview.target_role or "Software Engineer",
            responses=responses_data,
        )

        interview.status = InterviewStatus.COMPLETED
        interview.current_question = data.question_number
        interview.current_question_text = None
        interview.overall_score = summary.get("overall_score")
        interview.confidence_score = summary.get("confidence_score")
        interview.communication_score = summary.get("communication_score")
        interview.technical_score = summary.get("technical_score")
        interview.professionalism_score = summary.get("professionalism_score")
        interview.grammar_score = summary.get("grammar_score")
        interview.completeness_score = summary.get("completeness_score")
        interview.ai_summary = summary.get("ai_summary")
        interview.suggestions = summary.get("suggestions", [])
        interview.strengths = summary.get("strengths", [])
        interview.areas_to_improve = summary.get("areas_to_improve", [])
        interview.completed_at = datetime.now(timezone.utc)
        try:
            started = interview.started_at
            ended = interview.completed_at
            # SQLite server_default func.now() is naive; normalize to aware before subtracting
            if started is not None and started.tzinfo is None:
                started = started.replace(tzinfo=timezone.utc)
            if ended is not None and ended.tzinfo is None:
                ended = ended.replace(tzinfo=timezone.utc)
            interview.duration_minutes = int((ended - started).total_seconds() / 60) if started else 0
        except Exception:
            interview.duration_minutes = 0

        # Update student profile
        profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
        if profile and interview.overall_score:
            profile.interview_score = round((profile.interview_score + interview.overall_score) / 2, 1)
            profile.total_points += int(interview.overall_score / 10) * 20

        # Update leaderboard
        lb = db.query(Leaderboard).filter(Leaderboard.user_id == current_user.id).first()
        if lb and interview.overall_score:
            points_earned = int(interview.overall_score / 10) * 20
            lb.total_points += points_earned
            lb.weekly_points += points_earned
            lb.monthly_points += points_earned
            lb.interviews_completed += 1

        db.commit()

        return {
            "is_complete": True,
            "feedback": evaluation.get("ai_feedback"),
            "score": evaluation.get("score"),
            "interview_id": interview.id,
            "overall_score": interview.overall_score,
        }

    # Generate next question
    all_questions = db.query(InterviewResponse).filter(
        InterviewResponse.interview_id == interview.id
    ).all()
    previous_questions = [r.question_text for r in all_questions]

    company_name = None
    if interview.company_id:
        from app.models.company import Company
        company = db.query(Company).filter(Company.id == interview.company_id).first()
        if company:
            company_name = company.name

    next_question = await generate_interview_question(
        interview_type=interview.interview_type.value,
        target_role=interview.target_role or "Software Engineer",
        company_name=company_name,
        difficulty=interview.difficulty or "medium",
        question_number=data.question_number + 1,
        previous_questions=previous_questions,
    )

    interview.current_question = data.question_number
    interview.current_question_text = next_question
    db.commit()

    return {
        "is_complete": False,
        "feedback": evaluation.get("ai_feedback"),
        "score": evaluation.get("score"),
        "next_question_number": data.question_number + 1,
        "next_question": next_question,
        "total_questions": interview.total_questions,
    }


@router.get("/me")
async def get_my_interviews(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all mock interviews for current user."""
    interviews = (
        db.query(MockInterview)
        .filter(MockInterview.user_id == current_user.id)
        .order_by(MockInterview.started_at.desc())
        .all()
    )
    return [
        {
            "id": i.id,
            "interview_type": i.interview_type.value,
            "target_role": i.target_role,
            "status": i.status.value,
            "total_questions": i.total_questions,
            "overall_score": i.overall_score,
            "started_at": i.started_at.isoformat(),
            "completed_at": i.completed_at.isoformat() if i.completed_at else None,
        }
        for i in interviews
    ]


@router.get("/{interview_id}", response_model=dict)
async def get_interview_detail(
    interview_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get full interview report with all responses."""
    interview = db.query(MockInterview).filter(
        MockInterview.id == interview_id,
        MockInterview.user_id == current_user.id,
    ).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")

    responses = db.query(InterviewResponse).filter(
        InterviewResponse.interview_id == interview_id
    ).order_by(InterviewResponse.question_number).all()

    return {
        "id": interview.id,
        "interview_type": interview.interview_type.value,
        "target_role": interview.target_role,
        "difficulty": interview.difficulty,
        "status": interview.status.value,
        "total_questions": interview.total_questions,
        "answered_questions": interview.answered_questions,
        "current_question": interview.current_question,
        "current_question_text": interview.current_question_text,
        "overall_score": interview.overall_score,
        "confidence_score": interview.confidence_score,
        "communication_score": interview.communication_score,
        "technical_score": interview.technical_score,
        "professionalism_score": interview.professionalism_score,
        "grammar_score": interview.grammar_score,
        "completeness_score": interview.completeness_score,
        "ai_summary": interview.ai_summary,
        "suggestions": interview.suggestions,
        "strengths": interview.strengths,
        "areas_to_improve": interview.areas_to_improve,
        "duration_minutes": interview.duration_minutes,
        "started_at": interview.started_at.isoformat(),
        "completed_at": interview.completed_at.isoformat() if interview.completed_at else None,
        "responses": [
            {
                "question_number": r.question_number,
                "question_text": r.question_text,
                "student_answer": r.student_answer,
                "ai_feedback": r.ai_feedback,
                "score": r.score,
                "ideal_answer": r.ideal_answer,
                "keywords_used": r.keywords_used,
                "keywords_missed": r.keywords_missed,
            }
            for r in responses
        ],
    }


@router.get("/{interview_id}/download-report")
async def download_interview_report(
    interview_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Download interview report as PDF."""
    interview = db.query(MockInterview).filter(
        MockInterview.id == interview_id,
        MockInterview.user_id == current_user.id,
        MockInterview.status == InterviewStatus.COMPLETED,
    ).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Completed interview not found")

    pdf_bytes = generate_interview_report_pdf(
        {
            "overall_score": interview.overall_score or 0,
            "confidence_score": interview.confidence_score or 0,
            "communication_score": interview.communication_score or 0,
            "technical_score": interview.technical_score or 0,
            "professionalism_score": interview.professionalism_score or 0,
            "grammar_score": interview.grammar_score or 0,
            "completeness_score": interview.completeness_score or 0,
            "ai_summary": interview.ai_summary or "",
            "suggestions": interview.suggestions or [],
            "strengths": interview.strengths or [],
            "areas_to_improve": interview.areas_to_improve or [],
        },
        current_user.full_name,
    )

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="interview_report_{interview_id}.pdf"'},
    )
