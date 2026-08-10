from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from app.models.coding_question import ProgrammingLanguage, SubmissionStatus
from app.models.question import Difficulty


class TestCaseBase(BaseModel):
    input_data: str
    expected_output: str
    is_sample: bool = False
    explanation: Optional[str] = None


class TestCaseResponse(TestCaseBase):
    id: int
    class Config:
        from_attributes = True


class CodingQuestionBase(BaseModel):
    title: str
    problem_statement: str
    input_format: Optional[str] = None
    output_format: Optional[str] = None
    constraints: Optional[str] = None
    examples: List[Dict[str, str]] = []
    hints: List[str] = []
    editorial: Optional[str] = None
    difficulty: Difficulty = Difficulty.MEDIUM
    category: Optional[str] = None
    tags: List[str] = []
    supported_languages: List[str] = []
    time_limit_ms: int = 2000
    memory_limit_kb: int = 262144


class CodingQuestionCreate(CodingQuestionBase):
    slug: str
    company_id: Optional[int] = None
    test_cases: List[TestCaseBase] = []


class CodingQuestionResponse(CodingQuestionBase):
    id: int
    slug: str
    company_id: Optional[int] = None
    acceptance_rate: float = 0.0
    total_submissions: int = 0
    like_count: int = 0
    is_active: bool = True
    sample_test_cases: List[TestCaseResponse] = []
    created_at: datetime

    class Config:
        from_attributes = True


class CodeSubmitRequest(BaseModel):
    question_id: int
    code: str
    language: ProgrammingLanguage


class CodeRunRequest(BaseModel):
    code: str
    language: ProgrammingLanguage
    input_data: str = ""


class CodeRunResponse(BaseModel):
    output: str
    error: Optional[str] = None
    execution_time_ms: Optional[int] = None
    memory_used_kb: Optional[int] = None


class TestCaseResult(BaseModel):
    """Result for a single test case execution."""
    index: int
    passed: bool
    input_data: str
    expected_output: str
    actual_output: str
    error: Optional[str] = None
    execution_time_ms: Optional[int] = None
    is_sample: bool = False


class SubmissionResponse(BaseModel):
    id: int
    question_id: int
    status: SubmissionStatus
    execution_time_ms: Optional[int] = None
    memory_used_kb: Optional[int] = None
    test_cases_passed: int
    total_test_cases: int
    error_message: Optional[str] = None
    score: float
    submitted_at: datetime
    test_results: List[TestCaseResult] = []

    class Config:
        from_attributes = True


class HintRequest(BaseModel):
    question_id: int
    code: str
    language: ProgrammingLanguage
    error_message: Optional[str] = None
