from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from app.models.question import QuestionCategory, Difficulty, QuestionType


class QuestionBase(BaseModel):
    title: str
    content: Optional[str] = None
    question_type: QuestionType = QuestionType.SUBJECTIVE
    category: QuestionCategory
    difficulty: Difficulty = Difficulty.MEDIUM
    options: Optional[List[str]] = None
    correct_answer: Optional[str] = ""
    explanation: Optional[str] = None
    tags: List[str] = []
    topic: Optional[str] = None
    negative_marks: float = 0.0
    marks: float = 1.0
    time_limit_seconds: int = 60


class QuestionCreate(QuestionBase):
    company_id: Optional[int] = None


class QuestionUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    question_type: Optional[QuestionType] = None
    category: Optional[QuestionCategory] = None
    difficulty: Optional[Difficulty] = None
    options: Optional[List[str]] = None
    correct_answer: Optional[str] = None
    explanation: Optional[str] = None
    tags: Optional[List[str]] = None
    is_active: Optional[bool] = None


class QuestionResponse(QuestionBase):
    id: int
    company_id: Optional[int] = None
    like_count: int = 0
    view_count: int = 0
    is_active: bool = True
    bookmarked: bool = False
    created_at: datetime

    class Config:
        from_attributes = True


class QuestionListResponse(BaseModel):
    questions: List[QuestionResponse]
    total: int
    page: int
    per_page: int
    total_pages: int


class QuestionFilter(BaseModel):
    category: Optional[QuestionCategory] = None
    difficulty: Optional[Difficulty] = None
    topic: Optional[str] = None
    company_id: Optional[int] = None
    search: Optional[str] = None
    page: int = 1
    per_page: int = 20
