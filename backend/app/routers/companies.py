from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.core.dependencies import get_current_user, get_current_admin
from app.models.user import User
from app.models.company import Company, InterviewRound
from typing import List, Optional
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/companies", tags=["Companies"])


@router.get("/", response_model=List[dict])
async def list_companies(
    search: Optional[str] = None,
    industry: Optional[str] = None,
    difficulty: Optional[str] = None,
    featured: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all companies."""
    query = db.query(Company)
    if search:
        query = query.filter(Company.name.ilike(f"%{search}%"))
    if industry:
        query = query.filter(Company.industry.ilike(f"%{industry}%"))
    if difficulty:
        query = query.filter(Company.difficulty == difficulty)
    if featured is not None:
        query = query.filter(Company.is_featured == featured)

    companies = query.order_by(Company.is_featured.desc(), Company.name).all()
    return [
        {
            "id": c.id,
            "name": c.name,
            "slug": c.slug,
            "logo_url": c.logo_url,
            "industry": c.industry,
            "headquarters": c.headquarters,
            "description": c.description,
            "difficulty": c.difficulty,
            "avg_salary": c.avg_salary,
            "employee_count": c.employee_count,
            "glassdoor_rating": c.glassdoor_rating,
            "is_featured": c.is_featured,
        }
        for c in companies
    ]


@router.get("/{slug}", response_model=dict)
async def get_company(
    slug: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get full company details including interview process and rounds."""
    company = db.query(Company).filter(Company.slug == slug).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    rounds = db.query(InterviewRound).filter(
        InterviewRound.company_id == company.id
    ).order_by(InterviewRound.round_number).all()

    # Get company-specific questions
    from app.models.question import Question
    questions = db.query(Question).filter(
        Question.company_id == company.id,
        Question.is_active == True,
    ).limit(20).all()

    from app.models.coding_question import CodingQuestion
    coding_questions = db.query(CodingQuestion).filter(
        CodingQuestion.company_id == company.id,
        CodingQuestion.is_active == True,
    ).limit(20).all()

    return {
        "id": company.id,
        "name": company.name,
        "slug": company.slug,
        "logo_url": company.logo_url,
        "website": company.website,
        "industry": company.industry,
        "headquarters": company.headquarters,
        "description": company.description,
        "interview_process": company.interview_process,
        "difficulty": company.difficulty,
        "avg_salary": company.avg_salary,
        "employee_count": company.employee_count,
        "glassdoor_rating": company.glassdoor_rating,
        "preparation_tips": company.preparation_tips,
        "frequently_asked_topics": company.frequently_asked_topics,
        "rounds": [
            {
                "round_number": r.round_number,
                "round_name": r.round_name,
                "description": r.description,
                "duration_minutes": r.duration_minutes,
                "tips": r.tips,
            }
            for r in rounds
        ],
        "questions": [
            {
                "id": q.id,
                "title": q.title,
                "category": q.category.value,
                "difficulty": q.difficulty.value,
            }
            for q in questions
        ],
        "coding_questions": [
            {
                "id": q.id,
                "title": q.title,
                "slug": q.slug,
                "difficulty": q.difficulty.value,
                "category": q.category,
            }
            for q in coding_questions
        ],
    }


@router.post("/", status_code=201)
async def create_company(
    data: dict,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Admin: Create a new company."""
    existing = db.query(Company).filter(Company.slug == data.get("slug")).first()
    if existing:
        raise HTTPException(status_code=400, detail="Company with this slug already exists")

    company = Company(**{k: v for k, v in data.items() if k != "rounds"})
    db.add(company)
    db.flush()

    for round_data in data.get("rounds", []):
        r = InterviewRound(**round_data, company_id=company.id)
        db.add(r)

    db.commit()
    db.refresh(company)
    return {"id": company.id, "name": company.name, "slug": company.slug}


@router.put("/{company_id}")
async def update_company(
    company_id: int,
    data: dict,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Admin: Update a company."""
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    for key, value in data.items():
        if hasattr(company, key):
            setattr(company, key, value)
    db.commit()
    return {"message": "Company updated"}
