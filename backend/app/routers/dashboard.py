from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from app.database.connection import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.student_profile import StudentProfile
from app.models.coding_question import CodingSubmission, SubmissionStatus
from app.models.aptitude_test import TestAttempt
from app.models.mock_interview import MockInterview, InterviewStatus
from app.models.resume_review import ResumeReview
from app.models.leaderboard import Leaderboard
from app.models.achievement import UserAchievement, Achievement
from app.models.notification import Notification
from datetime import datetime, timedelta, timezone
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats")
async def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get student dashboard statistics."""
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    lb = db.query(Leaderboard).filter(Leaderboard.user_id == current_user.id).first()

    # Counts
    total_coding_solved = db.query(CodingSubmission).filter(
        CodingSubmission.user_id == current_user.id,
        CodingSubmission.status == SubmissionStatus.ACCEPTED,
    ).count()

    total_tests = db.query(TestAttempt).filter(
        TestAttempt.user_id == current_user.id,
        TestAttempt.is_completed == True,
    ).count()

    total_interviews = db.query(MockInterview).filter(
        MockInterview.user_id == current_user.id,
        MockInterview.status == InterviewStatus.COMPLETED,
    ).count()

    resume_score = profile.resume_score if profile else 0

    # Leaderboard rank
    global_rank = None
    if lb:
        global_rank = (
            db.query(Leaderboard)
            .filter(Leaderboard.total_points > lb.total_points)
            .count()
            + 1
        )

    # Recent achievements
    recent_achievements = (
        db.query(UserAchievement, Achievement)
        .join(Achievement, UserAchievement.achievement_id == Achievement.id)
        .filter(UserAchievement.user_id == current_user.id)
        .order_by(desc(UserAchievement.earned_at))
        .limit(3)
        .all()
    )

    # Unread notifications count
    unread_notifications = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False,
    ).count()

    return {
        "user": {
            "full_name": current_user.full_name,
            "username": current_user.username,
            "profile_picture": current_user.profile_picture,
            "college": current_user.college,
        },
        "stats": {
            "total_points": lb.total_points if lb else 0,
            "global_rank": global_rank,
            "coding_solved": total_coding_solved,
            "tests_taken": total_tests,
            "interviews_completed": total_interviews,
            "resume_score": resume_score,
            "aptitude_score": profile.aptitude_score if profile else 0,
            "coding_score": profile.coding_score if profile else 0,
            "interview_score": profile.interview_score if profile else 0,
            "streak_days": profile.streak_days if profile else 0,
        },
        "achievements": [
            {
                "name": a.name,
                "icon": a.icon,
                "badge_color": a.badge_color,
                "earned_at": ua.earned_at.isoformat(),
            }
            for ua, a in recent_achievements
        ],
        "unread_notifications": unread_notifications,
    }


@router.get("/activity")
async def get_activity_data(
    days: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get activity calendar data for the past N days."""
    end_date = datetime.now(timezone.utc)
    start_date = end_date - timedelta(days=days)

    # Coding submissions per day
    coding_activity = (
        db.query(
            func.date(CodingSubmission.submitted_at).label("date"),
            func.count().label("count"),
        )
        .filter(
            CodingSubmission.user_id == current_user.id,
            CodingSubmission.submitted_at >= start_date,
        )
        .group_by(func.date(CodingSubmission.submitted_at))
        .all()
    )

    # Test attempts per day
    aptitude_activity = (
        db.query(
            func.date(TestAttempt.completed_at).label("date"),
            func.count().label("count"),
        )
        .filter(
            TestAttempt.user_id == current_user.id,
            TestAttempt.completed_at >= start_date,
            TestAttempt.is_completed == True,
        )
        .group_by(func.date(TestAttempt.completed_at))
        .all()
    )

    # Combine
    activity_map = {}
    for row in coding_activity:
        date_str = str(row.date)
        activity_map[date_str] = activity_map.get(date_str, 0) + row.count
    for row in aptitude_activity:
        date_str = str(row.date)
        activity_map[date_str] = activity_map.get(date_str, 0) + row.count

    return {"activity": activity_map}


@router.get("/performance-charts")
async def get_performance_charts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get data for performance charts (weekly progress, skill distribution)."""
    # Last 8 weeks of coding submissions
    weeks_data = []
    for i in range(7, -1, -1):
        week_start = datetime.now(timezone.utc) - timedelta(weeks=i + 1)
        week_end = datetime.now(timezone.utc) - timedelta(weeks=i)
        solved = db.query(CodingSubmission).filter(
            CodingSubmission.user_id == current_user.id,
            CodingSubmission.status == SubmissionStatus.ACCEPTED,
            CodingSubmission.submitted_at.between(week_start, week_end),
        ).count()
        tests = db.query(TestAttempt).filter(
            TestAttempt.user_id == current_user.id,
            TestAttempt.is_completed == True,
            TestAttempt.completed_at.between(week_start, week_end),
        ).count()
        weeks_data.append({"week": f"W{8-i}", "coding": solved, "aptitude": tests})

    # Skill distribution
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    skill_data = {
        "Coding": profile.coding_score if profile else 0,
        "Aptitude": profile.aptitude_score if profile else 0,
        "Interview": profile.interview_score if profile else 0,
        "Resume": profile.resume_score if profile else 0,
    }

    # Test category breakdown
    from app.models.aptitude_test import AptitudeTest
    category_scores = (
        db.query(AptitudeTest.category, func.avg(TestAttempt.score).label("avg_score"))
        .join(TestAttempt, AptitudeTest.id == TestAttempt.test_id)
        .filter(TestAttempt.user_id == current_user.id, TestAttempt.is_completed == True)
        .group_by(AptitudeTest.category)
        .all()
    )

    return {
        "weekly_progress": weeks_data,
        "skill_distribution": skill_data,
        "aptitude_by_category": [
            {"category": str(row.category), "avg_score": float(row.avg_score or 0)}
            for row in category_scores
        ],
    }


@router.get("/recent-activity")
async def get_recent_activity(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get recent activity feed."""
    activities = []

    # Recent submissions
    submissions = (
        db.query(CodingSubmission)
        .filter(CodingSubmission.user_id == current_user.id)
        .order_by(desc(CodingSubmission.submitted_at))
        .limit(5)
        .all()
    )
    for s in submissions:
        activities.append({
            "type": "coding",
            "icon": "💻",
            "title": f"Submitted a coding solution",
            "status": s.status.value,
            "timestamp": s.submitted_at.isoformat(),
        })

    # Recent test attempts
    attempts = (
        db.query(TestAttempt)
        .filter(TestAttempt.user_id == current_user.id, TestAttempt.is_completed == True)
        .order_by(desc(TestAttempt.completed_at))
        .limit(5)
        .all()
    )
    for a in attempts:
        score_val = a.score or 0
        total_val = a.total_marks or 0
        activities.append({
            "type": "aptitude",
            "icon": "📝",
            "title": f"Completed aptitude test — Score: {score_val:.0f}/{total_val:.0f}",
            "timestamp": a.completed_at.isoformat() if a.completed_at else "",
        })

    # Recent interviews
    interviews = (
        db.query(MockInterview)
        .filter(
            MockInterview.user_id == current_user.id,
            MockInterview.status == InterviewStatus.COMPLETED,
        )
        .order_by(desc(MockInterview.completed_at))
        .limit(3)
        .all()
    )
    for i in interviews:
        overall = i.overall_score or 0
        activities.append({
            "type": "interview",
            "icon": "🎤",
            "title": f"Completed {i.interview_type.value} interview — Score: {overall:.0f}/100",
            "timestamp": i.completed_at.isoformat() if i.completed_at else "",
        })

    # Sort by timestamp descending
    activities.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
    return activities[:limit]
