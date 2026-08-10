from pydantic import BaseModel, HttpUrl
from typing import Optional, List
from datetime import date, datetime


class EducationBase(BaseModel):
    institution: str
    degree: str
    field_of_study: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    grade: Optional[str] = None
    description: Optional[str] = None


class EducationCreate(EducationBase):
    pass


class EducationResponse(EducationBase):
    id: int
    class Config:
        from_attributes = True


class ExperienceBase(BaseModel):
    company_name: str
    position: str
    location: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_current: bool = False
    description: Optional[str] = None


class ExperienceCreate(ExperienceBase):
    pass


class ExperienceResponse(ExperienceBase):
    id: int
    class Config:
        from_attributes = True


class ProjectBase(BaseModel):
    title: str
    description: Optional[str] = None
    tech_stack: List[str] = []
    github_url: Optional[str] = None
    live_url: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class ProjectCreate(ProjectBase):
    pass


class ProjectResponse(ProjectBase):
    id: int
    class Config:
        from_attributes = True


class CertificateBase(BaseModel):
    name: str
    issuer: str
    issue_date: Optional[date] = None
    expiry_date: Optional[date] = None
    credential_url: Optional[str] = None
    credential_id: Optional[str] = None


class CertificateCreate(CertificateBase):
    pass


class CertificateResponse(CertificateBase):
    id: int
    class Config:
        from_attributes = True


class SkillBase(BaseModel):
    name: str
    category: Optional[str] = None
    proficiency: Optional[str] = None


class SkillCreate(SkillBase):
    pass


class SkillResponse(SkillBase):
    id: int
    class Config:
        from_attributes = True


class ProfileUpdate(BaseModel):
    bio: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    location: Optional[str] = None
    target_role: Optional[str] = None
    target_companies: Optional[List[str]] = None
    languages: Optional[List[str]] = None


class ProfileResponse(BaseModel):
    id: int
    user_id: int
    bio: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    resume_url: Optional[str] = None
    location: Optional[str] = None
    target_role: Optional[str] = None
    target_companies: List[str] = []
    languages: List[str] = []
    total_points: int = 0
    coding_score: float = 0.0
    aptitude_score: float = 0.0
    interview_score: float = 0.0
    resume_score: float = 0.0
    streak_days: int = 0
    educations: List[EducationResponse] = []
    experiences: List[ExperienceResponse] = []
    projects: List[ProjectResponse] = []
    certificates: List[CertificateResponse] = []
    skills: List[SkillResponse] = []
    updated_at: datetime

    class Config:
        from_attributes = True
