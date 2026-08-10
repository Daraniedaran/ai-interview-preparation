import enum
from sqlalchemy import Column, Integer, String, Text, Boolean, JSON, ForeignKey, Enum, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy import DateTime
from app.database.connection import Base


class QuestionCategory(str, enum.Enum):
    QUANTITATIVE = "quantitative"
    LOGICAL = "logical"
    VERBAL = "verbal"
    DATA_INTERPRETATION = "data_interpretation"
    GENERAL = "general"
    TECHNICAL = "technical"
    BEHAVIORAL = "behavioral"
    HR = "hr"
    CODING = "coding"


class Difficulty(str, enum.Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


class QuestionType(str, enum.Enum):
    MCQ = "mcq"
    CODING = "coding"
    SUBJECTIVE = "subjective"
    FILL_IN_BLANK = "fill_in_blank"


class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), nullable=False)
    content = Column(Text, nullable=False)
    question_type = Column(Enum(QuestionType), default=QuestionType.MCQ, nullable=False)
    category = Column(Enum(QuestionCategory), nullable=False)
    difficulty = Column(Enum(Difficulty), default=Difficulty.MEDIUM, nullable=False)
    options = Column(JSON, nullable=True)        # List of option strings for MCQ
    correct_answer = Column(String(500), nullable=False)
    explanation = Column(Text, nullable=True)
    tags = Column(JSON, default=list)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="SET NULL"), nullable=True)
    topic = Column(String(200), nullable=True)
    negative_marks = Column(Float, default=0.0)
    marks = Column(Float, default=1.0)
    time_limit_seconds = Column(Integer, default=60)
    is_active = Column(Boolean, default=True)
    like_count = Column(Integer, default=0)
    view_count = Column(Integer, default=0)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    company = relationship("Company", back_populates="questions")
    bookmarks = relationship("Bookmark", back_populates="question")
