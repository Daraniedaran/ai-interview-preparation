import enum
from sqlalchemy import Column, Integer, String, Text, Boolean, JSON, ForeignKey, Enum, Float, BigInteger
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy import DateTime
from app.database.connection import Base
from app.models.question import Difficulty


class ProgrammingLanguage(str, enum.Enum):
    PYTHON = "python"
    JAVA = "java"
    CPP = "cpp"
    JAVASCRIPT = "javascript"
    SQL = "sql"
    C = "c"
    CSHARP = "csharp"
    GO = "go"


class SubmissionStatus(str, enum.Enum):
    PENDING = "pending"
    RUNNING = "running"
    ACCEPTED = "accepted"
    WRONG_ANSWER = "wrong_answer"
    TIME_LIMIT_EXCEEDED = "time_limit_exceeded"
    MEMORY_LIMIT_EXCEEDED = "memory_limit_exceeded"
    RUNTIME_ERROR = "runtime_error"
    COMPILATION_ERROR = "compilation_error"


class CodingQuestion(Base):
    __tablename__ = "coding_questions"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(300), nullable=False)
    slug = Column(String(300), unique=True, nullable=False, index=True)
    problem_statement = Column(Text, nullable=False)
    input_format = Column(Text, nullable=True)
    output_format = Column(Text, nullable=True)
    constraints = Column(Text, nullable=True)
    examples = Column(JSON, default=list)      # [{input, output, explanation}]
    hints = Column(JSON, default=list)
    editorial = Column(Text, nullable=True)
    difficulty = Column(Enum(Difficulty), default=Difficulty.MEDIUM, nullable=False)
    category = Column(String(200), nullable=True)  # Arrays, Strings, DP, etc.
    tags = Column(JSON, default=list)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="SET NULL"), nullable=True)
    supported_languages = Column(JSON, default=list)
    time_limit_ms = Column(Integer, default=2000)   # milliseconds
    memory_limit_kb = Column(Integer, default=262144)  # 256 MB
    acceptance_rate = Column(Float, default=0.0)
    total_submissions = Column(Integer, default=0)
    like_count = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    company = relationship("Company", back_populates="coding_questions")
    test_cases = relationship("TestCase", back_populates="question", cascade="all, delete-orphan")
    submissions = relationship("CodingSubmission", back_populates="question", cascade="all, delete-orphan")


class TestCase(Base):
    __tablename__ = "test_cases"

    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey("coding_questions.id", ondelete="CASCADE"), nullable=False)
    input_data = Column(Text, nullable=False)
    expected_output = Column(Text, nullable=False)
    is_sample = Column(Boolean, default=False)   # True = visible to students
    is_hidden = Column(Boolean, default=True)
    explanation = Column(Text, nullable=True)

    question = relationship("CodingQuestion", back_populates="test_cases")


class CodingSubmission(Base):
    __tablename__ = "coding_submissions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    question_id = Column(Integer, ForeignKey("coding_questions.id", ondelete="CASCADE"), nullable=False)
    code = Column(Text, nullable=False)
    language = Column(Enum(ProgrammingLanguage), nullable=False)
    status = Column(Enum(SubmissionStatus), default=SubmissionStatus.PENDING)
    execution_time_ms = Column(Integer, nullable=True)
    memory_used_kb = Column(Integer, nullable=True)
    test_cases_passed = Column(Integer, default=0)
    total_test_cases = Column(Integer, default=0)
    error_message = Column(Text, nullable=True)
    ai_hint = Column(Text, nullable=True)       # AI-generated hint if requested
    score = Column(Float, default=0.0)
    submitted_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="coding_submissions")
    question = relationship("CodingQuestion", back_populates="submissions")
