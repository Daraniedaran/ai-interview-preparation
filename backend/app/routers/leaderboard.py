from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.database.connection import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.leaderboard import Leaderboard
from typing import Optional
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/leaderboard", tags=["Leaderboard"])


@router.get("/global")
async def global_leaderboard(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get global leaderboard ranked by total points."""
    # Recompute global ranks
    entries = (
        db.query(Leaderboard, User)
        .join(User, Leaderboard.user_id == User.id)
        .filter(User.is_active == True)
        .order_by(desc(Leaderboard.total_points))
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )

    total = db.query(Leaderboard).count()

    # Get current user rank
    my_entry = db.query(Leaderboard).filter(Leaderboard.user_id == current_user.id).first()
    my_rank = None
    if my_entry:
        my_rank = (
            db.query(Leaderboard)
            .filter(Leaderboard.total_points > my_entry.total_points)
            .count()
            + 1
        )

    return {
        "data": [
            {
                "rank": (page - 1) * per_page + i + 1,
                "user_id": u.id,
                "username": u.username,
                "full_name": u.full_name,
                "college": u.college,
                "profile_picture": u.profile_picture,
                "total_points": lb.total_points,
                "questions_solved": lb.questions_solved,
                "coding_problems_solved": lb.coding_problems_solved,
                "streak_days": lb.streak_days,
            }
            for i, (lb, u) in enumerate(entries)
        ],
        "total": total,
        "page": page,
        "my_rank": my_rank,
        "my_points": my_entry.total_points if my_entry else 0,
    }


@router.get("/weekly")
async def weekly_leaderboard(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get weekly leaderboard."""
    entries = (
        db.query(Leaderboard, User)
        .join(User, Leaderboard.user_id == User.id)
        .filter(User.is_active == True)
        .order_by(desc(Leaderboard.weekly_points))
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )
    return {
        "data": [
            {
                "rank": (page - 1) * per_page + i + 1,
                "user_id": u.id,
                "username": u.username,
                "full_name": u.full_name,
                "profile_picture": u.profile_picture,
                "weekly_points": lb.weekly_points,
            }
            for i, (lb, u) in enumerate(entries)
        ]
    }


@router.get("/monthly")
async def monthly_leaderboard(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get monthly leaderboard."""
    entries = (
        db.query(Leaderboard, User)
        .join(User, Leaderboard.user_id == User.id)
        .filter(User.is_active == True)
        .order_by(desc(Leaderboard.monthly_points))
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )
    return {
        "data": [
            {
                "rank": (page - 1) * per_page + i + 1,
                "user_id": u.id,
                "username": u.username,
                "full_name": u.full_name,
                "profile_picture": u.profile_picture,
                "monthly_points": lb.monthly_points,
            }
            for i, (lb, u) in enumerate(entries)
        ]
    }


@router.get("/college")
async def college_leaderboard(
    college: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get college-specific leaderboard."""
    target_college = college or current_user.college
    if not target_college:
        return {"data": [], "message": "No college set in profile"}

    entries = (
        db.query(Leaderboard, User)
        .join(User, Leaderboard.user_id == User.id)
        .filter(User.college.ilike(f"%{target_college}%"), User.is_active == True)
        .order_by(desc(Leaderboard.total_points))
        .limit(50)
        .all()
    )

    return {
        "college": target_college,
        "data": [
            {
                "rank": i + 1,
                "user_id": u.id,
                "username": u.username,
                "full_name": u.full_name,
                "total_points": lb.total_points,
                "questions_solved": lb.questions_solved,
            }
            for i, (lb, u) in enumerate(entries)
        ],
    }
