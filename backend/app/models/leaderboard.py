from sqlalchemy import Column, Integer, Float, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy import DateTime
from app.database.connection import Base


class Leaderboard(Base):
    __tablename__ = "leaderboard"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    total_points = Column(Integer, default=0)
    global_rank = Column(Integer, nullable=True)
    college_rank = Column(Integer, nullable=True)
    weekly_points = Column(Integer, default=0)
    monthly_points = Column(Integer, default=0)
    questions_solved = Column(Integer, default=0)
    coding_problems_solved = Column(Integer, default=0)
    tests_taken = Column(Integer, default=0)
    interviews_completed = Column(Integer, default=0)
    streak_days = Column(Integer, default=0)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="leaderboard")
