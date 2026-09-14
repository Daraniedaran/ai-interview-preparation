from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.achievement import Achievement, UserAchievement
from app.models.leaderboard import Leaderboard
from app.models.student_profile import StudentProfile
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/achievements", tags=["Achievements"])


def _user_stats(db: Session, user_id: int) -> dict:
    """Gather the counters used to evaluate achievement conditions."""
    lb = db.query(Leaderboard).filter(Leaderboard.user_id == user_id).first()
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == user_id).first()
    my_points = lb.total_points if lb else 0
    # global_rank is computed on-fly (column is never persisted)
    global_rank = (
        db.query(Leaderboard).filter(Leaderboard.total_points > my_points).count() + 1
        if lb else None
    )
    return {
        "questions_solved": lb.questions_solved if lb else 0,
        "coding_solved": lb.coding_problems_solved if lb else 0,
        "streak_days": (profile.streak_days if profile else 0) or (lb.streak_days if lb else 0),
        "interviews_completed": lb.interviews_completed if lb else 0,
        "resume_score": profile.resume_score if profile else 0,
        "tests_taken": lb.tests_taken if lb else 0,
        "global_rank": global_rank,
    }


def _check_and_award(db: Session, user_id: int) -> set:
    """Award any achievements the user has earned but not yet received. Returns earned ids."""
    stats = _user_stats(db, user_id)
    earned_ids = {
        ua.achievement_id
        for ua in db.query(UserAchievement).filter(UserAchievement.user_id == user_id).all()
    }
    newly_awarded = []
    achievements = db.query(Achievement).filter(Achievement.is_active == True).all()

    for ach in achievements:
        if ach.id in earned_ids:
            continue
        value = stats.get(ach.condition_type)
        if value is None:
            continue
        if value >= ach.condition_value:
            newly_awarded.append(UserAchievement(user_id=user_id, achievement_id=ach.id))

    if newly_awarded:
        db.add_all(newly_awarded)
        db.commit()
        earned_ids.update(a.achievement_id for a in newly_awarded)
        logger.info(f"Awarded {len(newly_awarded)} achievement(s) to user {user_id}")

    return earned_ids


@router.get("/me")
async def get_my_achievements(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all achievements with the current user's unlock status."""
    earned_ids = _check_and_award(db, current_user.id)
    achievements = db.query(Achievement).filter(Achievement.is_active == True).order_by(Achievement.id).all()

    result = []
    total_points = 0
    for ach in achievements:
        unlocked = ach.id in earned_ids
        if unlocked:
            total_points += ach.points_reward
        result.append(
            {
                "id": ach.id,
                "title": ach.name,
                "description": ach.description,
                "icon": ach.icon or "🏅",
                "badge_color": ach.badge_color,
                "category": ach.category,
                "points": ach.points_reward,
                "unlocked": unlocked,
            }
        )

    return {
        "achievements": result,
        "total_points": total_points,
        "unlocked_count": len(earned_ids),
    }
