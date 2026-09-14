from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.database.connection import get_db
from app.core.dependencies import get_current_user, get_current_admin
from app.models.user import User
from app.models.question import Question, QuestionCategory, Difficulty
from app.models.bookmark import Bookmark, BookmarkType
from app.schemas.question import (
    QuestionCreate, QuestionUpdate, QuestionResponse, QuestionListResponse
)
from typing import List, Optional
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/questions", tags=["Questions"])


@router.get("/", response_model=QuestionListResponse)
async def list_questions(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    category: Optional[QuestionCategory] = None,
    difficulty: Optional[Difficulty] = None,
    topic: Optional[str] = None,
    company_id: Optional[int] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List questions with filtering and pagination."""
    query = db.query(Question).filter(Question.is_active == True)

    if category:
        query = query.filter(Question.category == category)
    if difficulty:
        query = query.filter(Question.difficulty == difficulty)
    if topic:
        query = query.filter(Question.topic.ilike(f"%{topic}%"))
    if company_id:
        query = query.filter(Question.company_id == company_id)
    if search:
        query = query.filter(
            or_(
                Question.title.ilike(f"%{search}%"),
                Question.content.ilike(f"%{search}%"),
                Question.topic.ilike(f"%{search}%"),
            )
        )

    total = query.count()
    questions = query.offset((page - 1) * per_page).limit(per_page).all()
    total_pages = (total + per_page - 1) // per_page

    # Annotate bookmarked state for the current user
    if questions:
        bookmarked_ids = {
            b.question_id
            for b in db.query(Bookmark).filter(
                Bookmark.user_id == current_user.id,
                Bookmark.bookmark_type == BookmarkType.QUESTION,
                Bookmark.question_id.in_([q.id for q in questions]),
            ).all()
        }
        for q in questions:
            q.bookmarked = q.id in bookmarked_ids

    return QuestionListResponse(
        questions=questions,
        total=total,
        page=page,
        per_page=per_page,
        total_pages=total_pages,
    )


@router.get("/categories")
async def get_categories():
    """Get all question categories with counts."""
    return [
        {"value": c.value, "label": c.value.replace("_", " ").title()}
        for c in QuestionCategory
    ]


@router.get("/random")
async def get_random_questions(
    category: QuestionCategory,
    difficulty: Optional[Difficulty] = None,
    count: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get random questions for a test."""
    from sqlalchemy.sql.expression import func as sql_func
    query = db.query(Question).filter(
        Question.is_active == True,
        Question.category == category,
    )
    if difficulty:
        query = query.filter(Question.difficulty == difficulty)
    questions = query.order_by(sql_func.random()).limit(count).all()
    return questions


@router.get("/{question_id}", response_model=QuestionResponse)
async def get_question(
    question_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a specific question by ID."""
    q = db.query(Question).filter(Question.id == question_id, Question.is_active == True).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    q.view_count = (q.view_count or 0) + 1
    db.commit()
    db.refresh(q)
    bm = db.query(Bookmark).filter(
        Bookmark.user_id == current_user.id,
        Bookmark.question_id == q.id,
        Bookmark.bookmark_type == BookmarkType.QUESTION,
    ).first()
    q.bookmarked = bm is not None
    return q


@router.post("/", response_model=QuestionResponse, status_code=201)
async def create_question(
    data: QuestionCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Admin: Create a new question."""
    q_dict = data.model_dump()
    if not q_dict.get("content"):
        q_dict["content"] = q_dict.get("title", "")
    if q_dict.get("correct_answer") is None:
        q_dict["correct_answer"] = ""
    question = Question(**q_dict, created_by=admin.id)
    db.add(question)
    db.commit()
    db.refresh(question)
    return question


@router.put("/{question_id}", response_model=QuestionResponse)
async def update_question(
    question_id: int,
    data: QuestionUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Admin: Update a question."""
    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(question, field, value)
    db.commit()
    db.refresh(question)
    return question


@router.delete("/{question_id}")
async def delete_question(
    question_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Admin: Soft-delete a question."""
    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    question.is_active = False
    db.commit()
    return {"message": "Question deleted"}


@router.post("/{question_id}/bookmark")
async def toggle_bookmark(
    question_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Bookmark or unbookmark a question."""
    q = db.query(Question).filter(Question.id == question_id, Question.is_active == True).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    existing = db.query(Bookmark).filter(
        Bookmark.user_id == current_user.id,
        Bookmark.question_id == question_id,
        Bookmark.bookmark_type == BookmarkType.QUESTION,
    ).first()

    if existing:
        db.delete(existing)
        db.commit()
        return {"bookmarked": False}
    else:
        bm = Bookmark(
            user_id=current_user.id,
            question_id=question_id,
            bookmark_type=BookmarkType.QUESTION,
        )
        db.add(bm)
        db.commit()
        return {"bookmarked": True}


@router.get("/bookmarks/me")
async def get_my_bookmarks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all bookmarked questions for current user."""
    bookmarks = (
        db.query(Bookmark)
        .filter(
            Bookmark.user_id == current_user.id,
            Bookmark.bookmark_type == BookmarkType.QUESTION,
        )
        .all()
    )
    question_ids = [b.question_id for b in bookmarks]
    questions = db.query(Question).filter(Question.id.in_(question_ids)).all()
    for q in questions:
        q.bookmarked = True
    return questions
