import enum
from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy import DateTime
from app.database.connection import Base


class NotificationType(str, enum.Enum):
    SYSTEM = "system"
    ACHIEVEMENT = "achievement"
    INTERVIEW_REMINDER = "interview_reminder"
    TEST_REMINDER = "test_reminder"
    STREAK = "streak"
    LEADERBOARD = "leaderboard"
    EMAIL = "email"
    GENERAL = "general"


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(300), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(Enum(NotificationType), default=NotificationType.GENERAL)
    is_read = Column(Boolean, default=False)
    action_url = Column(String(500), nullable=True)   # Link to relevant page
    icon = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="notifications")
