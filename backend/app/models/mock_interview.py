import enum
from sqlalchemy import Column, Integer, String, Text, Boolean, JSON, ForeignKey, Enum, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy import DateTime
from app.database.connection import Base


class InterviewType(str, enum.Enum):
    BEHAVIORAL = "behavioral"
    TECHNICAL = "technical"
    HR = "hr"
    MIXED = "mixed"


class InterviewStatus(str, enum.Enum):
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class MockInterview(Base):
    __tablename__ = "mock_interviews"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="SET NULL"), nullable=True)
    interview_type = Column(Enum(InterviewType), default=InterviewType.TECHNICAL, nullable=False)
    target_role = Column(String(200), nullable=True)
    difficulty = Column(String(50), nullable=True)
    status = Column(Enum(InterviewStatus), default=InterviewStatus.IN_PROGRESS)
    total_questions = Column(Integer, default=0)
    answered_questions = Column(Integer, default=0)
    current_question = Column(Integer, default=0)         # Last answered question number (0 = none yet)
    current_question_text = Column(Text, nullable=True)   # Next question shown to the user
    overall_score = Column(Float, nullable=True)
    confidence_score = Column(Float, nullable=True)
    communication_score = Column(Float, nullable=True)
    technical_score = Column(Float, nullable=True)
    professionalism_score = Column(Float, nullable=True)
    grammar_score = Column(Float, nullable=True)
    completeness_score = Column(Float, nullable=True)
    ai_summary = Column(Text, nullable=True)
    suggestions = Column(JSON, default=list)
    strengths = Column(JSON, default=list)
    areas_to_improve = Column(JSON, default=list)
    report_pdf_url = Column(String(500), nullable=True)
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    duration_minutes = Column(Integer, nullable=True)

    # Relationships
    user = relationship("User", back_populates="mock_interviews")
    responses = relationship("InterviewResponse", back_populates="interview", cascade="all, delete-orphan")


class InterviewResponse(Base):
    __tablename__ = "interview_responses"

    id = Column(Integer, primary_key=True, index=True)
    interview_id = Column(Integer, ForeignKey("mock_interviews.id", ondelete="CASCADE"), nullable=False)
    question_number = Column(Integer, nullable=False)
    question_text = Column(Text, nullable=False)
    student_answer = Column(Text, nullable=True)
    voice_transcript = Column(Text, nullable=True)   # If voice input used
    ai_feedback = Column(Text, nullable=True)
    score = Column(Float, nullable=True)             # 0-10
    ideal_answer = Column(Text, nullable=True)       # AI suggested answer
    keywords_used = Column(JSON, default=list)
    keywords_missed = Column(JSON, default=list)
    answered_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    interview = relationship("MockInterview", back_populates="responses")
