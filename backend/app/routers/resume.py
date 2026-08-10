import io
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks
from fastapi.responses import Response
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.student_profile import StudentProfile
from app.models.resume_review import ResumeReview
from app.utils.ai_client import analyze_resume
from app.utils.file_upload import upload_resume
from app.utils.pdf_utils import extract_text_from_pdf, generate_resume_feedback_pdf
from typing import List
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/resume", tags=["Resume"])

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


@router.post("/upload", status_code=201)
async def upload_and_review_resume(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Upload a resume PDF and trigger AI review."""
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")

    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File size must be under 10MB")

    # Extract text
    extracted_text = extract_text_from_pdf(file_bytes)
    if not extracted_text or len(extracted_text.strip()) < 50:
        raise HTTPException(status_code=400, detail="Could not extract text from PDF. Ensure it's not scanned/image-only.")

    # Upload to Cloudinary
    resume_url = await upload_resume(file_bytes, file.filename, current_user.id)

    # Update profile resume URL
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if profile and resume_url:
        profile.resume_url = resume_url
        profile.resume_filename = file.filename

    # Create review record
    review = ResumeReview(
        user_id=current_user.id,
        original_filename=file.filename,
        resume_url=resume_url,
        extracted_text=extracted_text,
        is_processed=False,
    )
    db.add(review)
    db.commit()
    db.refresh(review)

    # Perform AI analysis (in-request for simplicity, can move to Celery)
    analysis = await analyze_resume(extracted_text)

    # Update review with AI results
    review.resume_score = analysis.get("resume_score")
    review.ats_score = analysis.get("ats_score")
    review.strengths = analysis.get("strengths", [])
    review.weaknesses = analysis.get("weaknesses", [])
    review.missing_skills = analysis.get("missing_skills", [])
    review.grammar_suggestions = analysis.get("grammar_suggestions", [])
    review.improvements = analysis.get("improvements", [])
    review.keyword_analysis = analysis.get("keyword_analysis", {})
    review.section_scores = analysis.get("section_scores", {})
    review.ai_feedback = analysis.get("ai_feedback")
    review.is_processed = True

    # Update student profile scores
    if profile and review.resume_score:
        profile.resume_score = review.resume_score

    db.commit()
    db.refresh(review)

    return {
        "review_id": review.id,
        "resume_score": review.resume_score,
        "ats_score": review.ats_score,
        "strengths": review.strengths,
        "weaknesses": review.weaknesses,
        "missing_skills": review.missing_skills,
        "improvements": review.improvements,
        "grammar_suggestions": review.grammar_suggestions,
        "keyword_analysis": review.keyword_analysis,
        "section_scores": review.section_scores,
        "ai_feedback": review.ai_feedback,
        "resume_url": review.resume_url,
    }


@router.get("/reviews", response_model=List[dict])
async def get_my_reviews(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all resume reviews for the current user."""
    reviews = (
        db.query(ResumeReview)
        .filter(ResumeReview.user_id == current_user.id)
        .order_by(ResumeReview.created_at.desc())
        .all()
    )
    return [
        {
            "id": r.id,
            "original_filename": r.original_filename,
            "resume_score": r.resume_score,
            "ats_score": r.ats_score,
            "is_processed": r.is_processed,
            "created_at": r.created_at.isoformat(),
        }
        for r in reviews
    ]


@router.get("/reviews/{review_id}")
async def get_review_detail(
    review_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get full details of a specific resume review."""
    review = db.query(ResumeReview).filter(
        ResumeReview.id == review_id,
        ResumeReview.user_id == current_user.id,
    ).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    return {
        "id": review.id,
        "original_filename": review.original_filename,
        "resume_url": review.resume_url,
        "resume_score": review.resume_score,
        "ats_score": review.ats_score,
        "strengths": review.strengths,
        "weaknesses": review.weaknesses,
        "missing_skills": review.missing_skills,
        "grammar_suggestions": review.grammar_suggestions,
        "improvements": review.improvements,
        "keyword_analysis": review.keyword_analysis,
        "section_scores": review.section_scores,
        "ai_feedback": review.ai_feedback,
        "created_at": review.created_at.isoformat(),
    }


@router.get("/reviews/{review_id}/download")
async def download_review_pdf(
    review_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Download AI feedback as a PDF report."""
    review = db.query(ResumeReview).filter(
        ResumeReview.id == review_id,
        ResumeReview.user_id == current_user.id,
    ).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    if not review.is_processed:
        raise HTTPException(status_code=400, detail="Review not yet processed")

    pdf_bytes = generate_resume_feedback_pdf(
        {
            "resume_score": review.resume_score,
            "ats_score": review.ats_score,
            "strengths": review.strengths,
            "weaknesses": review.weaknesses,
            "missing_skills": review.missing_skills,
            "improvements": review.improvements,
            "grammar_suggestions": review.grammar_suggestions,
            "section_scores": review.section_scores,
            "ai_feedback": review.ai_feedback,
        },
        current_user.full_name,
    )

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="resume_review_{review_id}.pdf"'},
    )
