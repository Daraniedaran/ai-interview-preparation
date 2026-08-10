from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from app.models.mock_interview import InterviewType, InterviewStatus


class StartInterviewRequest(BaseModel):
    interview_type: InterviewType = InterviewType.TECHNICAL
    company_id: Optional[int] = None
    target_role: Optional[str] = None
    difficulty: str = "medium"
    num_questions: int = 5


class SubmitAnswerRequest(BaseModel):
    interview_id: int
    question_number: int
    question_text: str
    student_answer: str
    voice_transcript: Optional[str] = None


class InterviewResponseSchema(BaseModel):
    id: int
    question_number: int
    question_text: str
    student_answer: Optional[str] = None
    ai_feedback: Optional[str] = None
    score: Optional[float] = None
    ideal_answer: Optional[str] = None
    keywords_used: List[str] = []
    keywords_missed: List[str] = []
    answered_at: datetime

    class Config:
        from_attributes = True


class MockInterviewResponse(BaseModel):
    id: int
    interview_type: InterviewType
    target_role: Optional[str] = None
    difficulty: Optional[str] = None
    status: InterviewStatus
    total_questions: int
    answered_questions: int
    overall_score: Optional[float] = None
    confidence_score: Optional[float] = None
    communication_score: Optional[float] = None
    technical_score: Optional[float] = None
    professionalism_score: Optional[float] = None
    grammar_score: Optional[float] = None
    completeness_score: Optional[float] = None
    ai_summary: Optional[str] = None
    suggestions: List[str] = []
    strengths: List[str] = []
    areas_to_improve: List[str] = []
    responses: List[InterviewResponseSchema] = []
    started_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class NextQuestionResponse(BaseModel):
    question_number: int
    question_text: str
    is_last: bool
