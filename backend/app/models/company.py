import enum
from sqlalchemy import Column, Integer, String, Text, Boolean, Float, JSON, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy import DateTime
from app.database.connection import Base


class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), unique=True, nullable=False, index=True)
    slug = Column(String(200), unique=True, nullable=False, index=True)
    logo_url = Column(String(500), nullable=True)
    website = Column(String(500), nullable=True)
    industry = Column(String(200), nullable=True)
    headquarters = Column(String(200), nullable=True)
    description = Column(Text, nullable=True)
    interview_process = Column(Text, nullable=True)
    difficulty = Column(String(50), nullable=True)  # Easy, Medium, Hard
    avg_salary = Column(String(100), nullable=True)
    employee_count = Column(String(100), nullable=True)
    glassdoor_rating = Column(Float, nullable=True)
    preparation_tips = Column(JSON, default=list)
    frequently_asked_topics = Column(JSON, default=list)
    is_featured = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    rounds = relationship("InterviewRound", back_populates="company", cascade="all, delete-orphan")
    questions = relationship("Question", back_populates="company")
    coding_questions = relationship("CodingQuestion", back_populates="company")


class InterviewRound(Base):
    __tablename__ = "interview_rounds"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    round_number = Column(Integer, nullable=False)
    round_name = Column(String(200), nullable=False)  # Online Test, Technical, HR, etc.
    description = Column(Text, nullable=True)
    duration_minutes = Column(Integer, nullable=True)
    tips = Column(JSON, default=list)

    company = relationship("Company", back_populates="rounds")
