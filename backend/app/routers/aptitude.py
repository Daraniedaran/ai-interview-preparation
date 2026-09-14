from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy.sql.expression import func as sql_func
from app.database.connection import get_db
from app.core.dependencies import get_current_user, get_current_admin
from app.models.user import User
from app.models.aptitude_test import AptitudeTest, TestAttempt, TestQuestion
from app.models.question import Question, QuestionCategory, Difficulty
from app.models.leaderboard import Leaderboard
from app.models.student_profile import StudentProfile
from typing import List, Optional
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/aptitude", tags=["Aptitude"])


@router.get("/categories")
async def get_categories(current_user: User = Depends(get_current_user)):
    """Get all aptitude categories with descriptions."""
    return [
        {
            "id": "quantitative",
            "name": "Quantitative Aptitude",
            "description": "Number systems, algebra, geometry, arithmetic",
            "icon": "📊",
            "color": "#2563EB",
        },
        {
            "id": "logical",
            "name": "Logical Reasoning",
            "description": "Patterns, puzzles, syllogisms, seating arrangements",
            "icon": "🧩",
            "color": "#7C3AED",
        },
        {
            "id": "verbal",
            "name": "Verbal Ability",
            "description": "Grammar, vocabulary, reading comprehension",
            "icon": "📝",
            "color": "#059669",
        },
        {
            "id": "data_interpretation",
            "name": "Data Interpretation",
            "description": "Charts, graphs, tables, data analysis",
            "icon": "📈",
            "color": "#D97706",
        },
        {
            "id": "general",
            "name": "General Aptitude",
            "description": "Mixed topics from all aptitude areas",
            "icon": "🎯",
            "color": "#DC2626",
        },
    ]


@router.get("/tests")
async def list_tests(
    category: Optional[QuestionCategory] = None,
    difficulty: Optional[Difficulty] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List available aptitude tests."""
    query = db.query(AptitudeTest).filter(AptitudeTest.is_active == True)
    if category:
        query = query.filter(AptitudeTest.category == category)
    if difficulty:
        query = query.filter(AptitudeTest.difficulty == difficulty)
    tests = query.all()

    result = []
    for t in tests:
        attempt_count = db.query(TestAttempt).filter(
            TestAttempt.test_id == t.id,
            TestAttempt.user_id == current_user.id,
        ).count()
        result.append({
            "id": t.id,
            "title": t.title,
            "description": t.description,
            "category": t.category.value,
            "difficulty": t.difficulty.value,
            "duration_minutes": t.duration_minutes,
            "total_questions": t.total_questions,
            "total_marks": t.total_marks,
            "negative_marking": t.negative_marking,
            "attempt_count": attempt_count,
        })
    return result


@router.post("/tests/{test_id}/start")
async def start_test(
    test_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Start an aptitude test — returns randomized questions."""
    test = db.query(AptitudeTest).filter(AptitudeTest.id == test_id, AptitudeTest.is_active == True).first()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")

    # Get random questions for this test's category and difficulty
    questions = (
        db.query(Question)
        .filter(
            Question.is_active == True,
            Question.category == test.category,
            Question.difficulty == test.difficulty,
        )
        .order_by(sql_func.random())
        .limit(test.total_questions)
        .all()
    )

    if len(questions) < test.total_questions:
        # Fallback: get questions from same category only
        questions = (
            db.query(Question)
            .filter(Question.is_active == True, Question.category == test.category)
            .order_by(sql_func.random())
            .limit(test.total_questions)
            .all()
        )

    # Create test attempt
    attempt = TestAttempt(
        user_id=current_user.id,
        test_id=test_id,
        total_marks=test.total_marks,
        is_completed=False,
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)

    return {
        "attempt_id": attempt.id,
        "test_id": test_id,
        "duration_minutes": test.duration_minutes,
        "negative_marking": test.negative_marking,
        "negative_marks_per_wrong": test.negative_marks_per_wrong,
        "questions": [
            {
                "id": q.id,
                "title": q.title,
                "content": q.content,
                "options": q.options,
                "marks": q.marks,
                "time_limit_seconds": q.time_limit_seconds,
            }
            for q in questions
        ],
    }


@router.post("/attempts/{attempt_id}/submit")
async def submit_test(
    attempt_id: int,
    payload: dict,  # accepts {question_id: answer} OR {"answers": {...}, "time_taken_seconds": N}
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Submit a completed test and calculate score."""
    attempt = db.query(TestAttempt).filter(
        TestAttempt.id == attempt_id,
        TestAttempt.user_id == current_user.id,
    ).first()
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
    if attempt.is_completed:
        raise HTTPException(status_code=400, detail="Test already submitted")

    test = db.query(AptitudeTest).filter(AptitudeTest.id == attempt.test_id).first()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found for this attempt")
    # Support both raw answers dict and wrapped {"answers": {...}, "time_taken_seconds": N}
    if isinstance(payload, dict) and "answers" in payload and isinstance(payload["answers"], dict):
        answers = payload["answers"]
        time_taken = payload.get("time_taken_seconds", 0)
    else:
        answers = payload
        time_taken = payload.get("time_taken_seconds", 0) if isinstance(payload, dict) else 0
        # If time_taken was sent as a sibling key inside a raw dict, drop it from answers
        if isinstance(answers, dict) and "time_taken_seconds" in answers:
            answers = {k: v for k, v in answers.items() if k != "time_taken_seconds"}
    try:
        attempt.time_taken_seconds = int(time_taken or 0)
    except (TypeError, ValueError):
        attempt.time_taken_seconds = 0
    # Normalize question ids to ints (Postgres is strict, clients send string keys)
    raw_ids = list(answers.keys()) if isinstance(answers, dict) else []
    question_ids: list[int] = []
    for k in raw_ids:
        try:
            question_ids.append(int(str(k).strip()))
        except (TypeError, ValueError):
            continue
    if isinstance(answers, dict) and question_ids and len(question_ids) != len(raw_ids):
        # Drop non-numeric keys from answers to keep grading consistent
        answers = {k: v for k, v in answers.items() if str(k).strip().lstrip("-").isdigit()}
    questions = db.query(Question).filter(Question.id.in_(question_ids)).all() if question_ids else []
    q_map = {str(q.id): q for q in questions}

    score = 0.0
    correct = 0
    wrong = 0
    unattempted = 0

    for q_id, selected in answers.items():
        q = q_map.get(str(q_id))
        if not q or not selected:
            unattempted += 1
            continue
        if str(selected).strip().lower() == str(q.correct_answer).strip().lower():
            score += q.marks
            correct += 1
        else:
            wrong += 1
            if test.negative_marking:
                score -= test.negative_marks_per_wrong

    score = max(0, score)  # No negative total

    attempt.score = score
    attempt.correct_answers = correct
    attempt.wrong_answers = wrong
    attempt.unattempted = unattempted
    attempt.answers = answers
    attempt.is_completed = True
    attempt.completed_at = datetime.now(timezone.utc)

    # Calculate percentile (simple approach)
    total_attempts = db.query(TestAttempt).filter(
        TestAttempt.test_id == attempt.test_id,
        TestAttempt.is_completed == True,
    ).count()
    lower_scores = db.query(TestAttempt).filter(
        TestAttempt.test_id == attempt.test_id,
        TestAttempt.is_completed == True,
        TestAttempt.score < score,
    ).count()
    attempt.percentile = round((lower_scores / max(total_attempts, 1)) * 100, 1)

    # Update student profile aptitude score
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if profile:
        total_marks_val = test.total_marks or 0
        percentage = (score / total_marks_val * 100) if total_marks_val > 0 else 0
        profile.aptitude_score = round(((profile.aptitude_score or 0) + percentage) / 2, 1)
        profile.total_points = (profile.total_points or 0) + correct * 5

    # Update leaderboard
    lb = db.query(Leaderboard).filter(Leaderboard.user_id == current_user.id).first()
    if lb:
        lb.total_points = (lb.total_points or 0) + correct * 5
        lb.weekly_points = (lb.weekly_points or 0) + correct * 5
        lb.monthly_points = (lb.monthly_points or 0) + correct * 5
        lb.questions_solved = (lb.questions_solved or 0) + correct
        lb.tests_taken = (lb.tests_taken or 0) + 1

    db.commit()

    total_marks_out = test.total_marks or 0
    return {
        "attempt_id": attempt_id,
        "score": score,
        "total_marks": total_marks_out,
        "correct_answers": correct,
        "wrong_answers": wrong,
        "unattempted": unattempted,
        "percentile": attempt.percentile,
        "percentage": round((score / total_marks_out * 100) if total_marks_out > 0 else 0, 1),
    }


@router.get("/attempts/me")
async def get_my_attempts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all test attempts for current user."""
    attempts = (
        db.query(TestAttempt)
        .filter(TestAttempt.user_id == current_user.id, TestAttempt.is_completed == True)
        .order_by(TestAttempt.completed_at.desc())
        .all()
    )
    return [
        {
            "id": a.id,
            "test_id": a.test_id,
            "score": a.score,
            "total_marks": a.total_marks,
            "correct_answers": a.correct_answers,
            "wrong_answers": a.wrong_answers,
            "percentile": a.percentile,
            "completed_at": a.completed_at.isoformat() if a.completed_at else None,
        }
        for a in attempts
    ]


@router.post("/tests", status_code=201)
async def create_test(
    data: dict,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Admin: Create a new aptitude test."""
    try:
        category = QuestionCategory(data["category"])
    except (KeyError, ValueError):
        raise HTTPException(status_code=422, detail=f"Invalid category: {data.get('category')}")
    try:
        difficulty = Difficulty(data["difficulty"])
    except (KeyError, ValueError):
        raise HTTPException(status_code=422, detail=f"Invalid difficulty: {data.get('difficulty')}")
    if not data.get("title"):
        raise HTTPException(status_code=422, detail="title is required")
    test = AptitudeTest(
        title=data["title"],
        description=data.get("description"),
        category=category,
        difficulty=difficulty,
        duration_minutes=data.get("duration_minutes", 30),
        total_questions=data.get("total_questions", 20),
        total_marks=data.get("total_marks", 20.0),
        negative_marking=data.get("negative_marking", False),
        negative_marks_per_wrong=data.get("negative_marks_per_wrong", 0.25),
        created_by=admin.id,
    )
    db.add(test)
    db.commit()
    db.refresh(test)
    return {"id": test.id, "title": test.title}
