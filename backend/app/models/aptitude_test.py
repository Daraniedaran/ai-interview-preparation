import enum
from sqlalchemy import Column, Integer, String, Text, Boolean, JSON, ForeignKey, Enum, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy import DateTime
from app.database.connection import Base
from app.models.question import QuestionCategory, Difficulty


class AptitudeTest(Base):
    __tablename__ = "aptitude_tests"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(300), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(Enum(QuestionCategory), nullable=False)
    difficulty = Column(Enum(Difficulty), nullable=False)
    duration_minutes = Column(Integer, default=30)
    total_questions = Column(Integer, default=20)
    total_marks = Column(Float, default=20.0)
    negative_marking = Column(Boolean, default=False)
    negative_marks_per_wrong = Column(Float, default=0.25)
    is_active = Column(Boolean, default=True)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    attempts = relationship("TestAttempt", back_populates="test", cascade="all, delete-orphan")
    questions = relationship("TestQuestion", back_populates="test", cascade="all, delete-orphan")


class TestQuestion(Base):
    """Junction table linking AptitudeTest to Questions."""
    __tablename__ = "test_questions"

    id = Column(Integer, primary_key=True, index=True)
    test_id = Column(Integer, ForeignKey("aptitude_tests.id", ondelete="CASCADE"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id", ondelete="CASCADE"), nullable=False)
    order_number = Column(Integer, default=0)

    test = relationship("AptitudeTest", back_populates="questions")


class TestAttempt(Base):
    __tablename__ = "test_attempts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    test_id = Column(Integer, ForeignKey("aptitude_tests.id", ondelete="CASCADE"), nullable=False)
    score = Column(Float, default=0.0)
    total_marks = Column(Float, default=0.0)
    correct_answers = Column(Integer, default=0)
    wrong_answers = Column(Integer, default=0)
    unattempted = Column(Integer, default=0)
    time_taken_seconds = Column(Integer, default=0)
    answers = Column(JSON, default=dict)    # {question_id: selected_answer}
    is_completed = Column(Boolean, default=False)
    percentile = Column(Float, nullable=True)
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    user = relationship("User", back_populates="test_attempts")
    test = relationship("AptitudeTest", back_populates="attempts")
