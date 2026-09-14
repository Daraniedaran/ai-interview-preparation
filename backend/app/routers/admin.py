from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from app.database.connection import get_db
from app.core.dependencies import get_current_admin
from app.models.user import User, UserRole
from app.models.coding_question import CodingQuestion, CodingSubmission
from app.models.aptitude_test import AptitudeTest, TestAttempt
from app.models.mock_interview import MockInterview, InterviewStatus
from app.models.resume_review import ResumeReview
from app.models.company import Company
from app.models.question import Question
from app.models.leaderboard import Leaderboard
from datetime import datetime, timedelta, timezone
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/stats")
async def get_admin_stats(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Admin: Get platform-wide statistics."""
    total_users = db.query(User).filter(User.role == UserRole.STUDENT).count()
    active_users = db.query(User).filter(User.role == UserRole.STUDENT, User.is_active == True).count()
    total_questions = db.query(Question).filter(Question.is_active == True).count()
    total_coding = db.query(CodingQuestion).filter(CodingQuestion.is_active == True).count()
    total_tests = db.query(AptitudeTest).filter(AptitudeTest.is_active == True).count()
    total_companies = db.query(Company).count()
    total_interviews = db.query(MockInterview).count()
    total_submissions = db.query(CodingSubmission).count()
    total_resume_reviews = db.query(ResumeReview).filter(ResumeReview.is_processed == True).count()

    # New users this week
    week_ago = datetime.now(timezone.utc) - timedelta(weeks=1)
    new_users_week = db.query(User).filter(User.created_at >= week_ago).count()

    # Daily active users (last 7 days)
    daily_users = []
    for i in range(6, -1, -1):
        day_start = datetime.now(timezone.utc) - timedelta(days=i + 1)
        day_end = datetime.now(timezone.utc) - timedelta(days=i)
        count = db.query(CodingSubmission.user_id).filter(
            CodingSubmission.submitted_at.between(day_start, day_end)
        ).distinct().count()
        daily_users.append({
            "date": (datetime.now(timezone.utc) - timedelta(days=i)).strftime("%b %d"),
            "users": count,
        })

    return {
        "overview": {
            "total_users": total_users,
            "active_users": active_users,
            "total_questions": total_questions,
            "total_coding_problems": total_coding,
            "total_tests": total_tests,
            "total_companies": total_companies,
            "total_interviews": total_interviews,
            "total_submissions": total_submissions,
            "total_resume_reviews": total_resume_reviews,
            "new_users_this_week": new_users_week,
        },
        "daily_active_users": daily_users,
    }


@router.get("/users")
async def admin_list_users(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    search: str = None,
    role: str = None,
    is_active: bool = None,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Admin: List users with filters."""
    query = db.query(User)
    if search:
        query = query.filter(
            User.email.ilike(f"%{search}%") |
            User.full_name.ilike(f"%{search}%") |
            User.username.ilike(f"%{search}%")
        )
    if role:
        try:
            query = query.filter(User.role == UserRole(role))
        except ValueError:
            from fastapi import HTTPException
            raise HTTPException(status_code=422, detail=f"Invalid role: {role}")
    if is_active is not None:
        query = query.filter(User.is_active == is_active)

    total = query.count()
    users = query.order_by(desc(User.created_at)).offset((page - 1) * per_page).limit(per_page).all()

    return {
        "total": total,
        "page": page,
        "data": [
            {
                "id": u.id,
                "email": u.email,
                "username": u.username,
                "full_name": u.full_name,
                "profile_picture": u.profile_picture,
                "role": u.role.value,
                "is_active": u.is_active,
                "is_verified": u.is_verified,
                "college": u.college,
                "created_at": u.created_at.isoformat(),
                "last_login": u.last_login.isoformat() if u.last_login else None,
            }
            for u in users
        ],
    }


@router.get("/questions/stats")
async def question_stats(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Admin: Question bank stats by category and difficulty."""
    from app.models.question import QuestionCategory, Difficulty

    stats = {}
    for cat in QuestionCategory:
        stats[cat.value] = {}
        for diff in Difficulty:
            count = db.query(Question).filter(
                Question.category == cat,
                Question.difficulty == diff,
                Question.is_active == True,
            ).count()
            stats[cat.value][diff.value] = count

    return {"question_stats": stats}


@router.get("/submissions/recent")
async def recent_submissions(
    limit: int = 20,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Admin: Recent code submissions."""
    submissions = (
        db.query(CodingSubmission, User, CodingQuestion)
        .join(User, CodingSubmission.user_id == User.id)
        .join(CodingQuestion, CodingSubmission.question_id == CodingQuestion.id)
        .order_by(desc(CodingSubmission.submitted_at))
        .limit(limit)
        .all()
    )
    return [
        {
            "id": s.id,
            "user": {"id": u.id, "username": u.username},
            "problem": {"id": q.id, "title": q.title},
            "language": s.language.value,
            "status": s.status.value,
            "score": s.score,
            "submitted_at": s.submitted_at.isoformat(),
        }
        for s, u, q in submissions
    ]


@router.delete("/users/{user_id}")
async def admin_delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Admin: Delete a user (hard delete)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return {"message": "User deleted"}


@router.get("/interviews/stats")
async def interview_stats(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Admin: Interview completion and score stats."""
    total = db.query(MockInterview).count()
    completed = db.query(MockInterview).filter(MockInterview.status == InterviewStatus.COMPLETED).count()
    avg_score = db.query(func.avg(MockInterview.overall_score)).filter(
        MockInterview.status == InterviewStatus.COMPLETED
    ).scalar() or 0

    return {
        "total_interviews": total,
        "completed_interviews": completed,
        "completion_rate": round((completed / max(total, 1)) * 100, 1),
        "avg_overall_score": round(float(avg_score), 1),
        "avg_duration_minutes": round(float(
            db.query(func.avg(MockInterview.duration_minutes)).filter(
                MockInterview.status == InterviewStatus.COMPLETED,
                MockInterview.duration_minutes.isnot(None),
            ).scalar() or 0
        ), 0),
    }


@router.get("/interviews")
async def admin_list_interviews(
    search: str = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Admin: List interview sessions with candidate and company info."""
    query = (
        db.query(MockInterview, User, Company)
        .join(User, MockInterview.user_id == User.id)
        .outerjoin(Company, MockInterview.company_id == Company.id)
    )
    if search:
        query = query.filter(
            User.full_name.ilike(f"%{search}%")
            | User.username.ilike(f"%{search}%")
            | Company.name.ilike(f"%{search}%")
        )

    total = query.count()
    rows = (
        query.order_by(desc(MockInterview.started_at))
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )

    return {
        "total": total,
        "page": page,
        "data": [
            {
                "id": mi.id,
                "candidate": u.full_name or u.username,
                "type": mi.interview_type.value if mi.interview_type else None,
                "difficulty": mi.difficulty,
                "company": c.name if c else None,
                "score": mi.overall_score,
                "status": mi.status.value if mi.status else None,
                "duration_minutes": mi.duration_minutes,
                "date": (mi.started_at or mi.completed_at).isoformat() if (mi.started_at or mi.completed_at) else None,
            }
            for mi, u, c in rows
        ],
    }
