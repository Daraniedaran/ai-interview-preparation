from sqlalchemy import Column, Integer, String, Text, Boolean, JSON, ForeignKey, Float, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy import DateTime
from app.database.connection import Base


class Achievement(Base):
    __tablename__ = "achievements"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    icon = Column(String(100), nullable=True)         # Emoji or icon name
    badge_color = Column(String(50), nullable=True)   # CSS color
    category = Column(String(100), nullable=True)     # Coding, Aptitude, Interview, etc.
    condition_type = Column(String(100), nullable=False)  # questions_solved, streak_days, etc.
    condition_value = Column(Integer, nullable=False)  # Threshold value
    points_reward = Column(Integer, default=50)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user_achievements = relationship("UserAchievement", back_populates="achievement")


class UserAchievement(Base):
    __tablename__ = "user_achievements"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    achievement_id = Column(Integer, ForeignKey("achievements.id", ondelete="CASCADE"), nullable=False)
    earned_at = Column(DateTime(timezone=True), server_default=func.now())
    is_displayed = Column(Boolean, default=True)

    __table_args__ = (
        UniqueConstraint("user_id", "achievement_id", name="uq_user_achievement"),
    )

    # Relationships
    user = relationship("User", back_populates="achievements")
    achievement = relationship("Achievement", back_populates="user_achievements")


class Badge(Base):
    """Profile badges that can be displayed on profile."""
    __tablename__ = "badges"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    image_url = Column(String(500), nullable=True)
    tier = Column(String(50), nullable=True)          # Bronze, Silver, Gold, Platinum
    created_at = Column(DateTime(timezone=True), server_default=func.now())
