from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Optional, List
from pydantic import BaseModel
from app.database.connection import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.flashcard import Flashcard
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/flashcards", tags=["Flashcards"])


# ===== Schemas =====

class FlashcardCreate(BaseModel):
    front: str
    back: str
    topic: Optional[str] = None
    difficulty: Optional[str] = None


class FlashcardUpdate(BaseModel):
    front: Optional[str] = None
    back: Optional[str] = None
    topic: Optional[str] = None
    difficulty: Optional[str] = None


class FlashcardResponse(BaseModel):
    id: int
    front: str
    back: str
    topic: Optional[str] = None
    difficulty: Optional[str] = None
    is_mastered: bool
    review_count: int
    last_reviewed_at: Optional[datetime] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ===== Endpoints =====

@router.get("", response_model=List[FlashcardResponse])
async def list_flashcards(
    topic: Optional[str] = Query(None, description="Filter by topic"),
    mastered: Optional[bool] = Query(None, description="Filter by mastered status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all flashcards for the current user."""
    query = db.query(Flashcard).filter(Flashcard.user_id == current_user.id)

    if topic:
        query = query.filter(Flashcard.topic.ilike(f"%{topic}%"))
    if mastered is not None:
        query = query.filter(Flashcard.is_mastered == mastered)

    flashcards = query.order_by(desc(Flashcard.created_at)).all()
    return flashcards


@router.get("/topics")
async def get_flashcard_topics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get distinct topics for the current user's flashcards."""
    topics = (
        db.query(Flashcard.topic)
        .filter(Flashcard.user_id == current_user.id, Flashcard.topic.isnot(None))
        .distinct()
        .all()
    )
    return [t[0] for t in topics if t[0]]


@router.post("", response_model=FlashcardResponse, status_code=status.HTTP_201_CREATED)
async def create_flashcard(
    data: FlashcardCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new flashcard."""
    flashcard = Flashcard(
        user_id=current_user.id,
        front=data.front,
        back=data.back,
        topic=data.topic,
        difficulty=data.difficulty,
    )
    db.add(flashcard)
    db.commit()
    db.refresh(flashcard)
    return flashcard


@router.put("/{flashcard_id}", response_model=FlashcardResponse)
async def update_flashcard(
    flashcard_id: int,
    data: FlashcardUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a flashcard."""
    flashcard = db.query(Flashcard).filter(
        Flashcard.id == flashcard_id,
        Flashcard.user_id == current_user.id,
    ).first()

    if not flashcard:
        raise HTTPException(status_code=404, detail="Flashcard not found")

    if data.front is not None:
        flashcard.front = data.front
    if data.back is not None:
        flashcard.back = data.back
    if data.topic is not None:
        flashcard.topic = data.topic
    if data.difficulty is not None:
        flashcard.difficulty = data.difficulty

    db.commit()
    db.refresh(flashcard)
    return flashcard


@router.delete("/{flashcard_id}")
async def delete_flashcard(
    flashcard_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a flashcard."""
    flashcard = db.query(Flashcard).filter(
        Flashcard.id == flashcard_id,
        Flashcard.user_id == current_user.id,
    ).first()

    if not flashcard:
        raise HTTPException(status_code=404, detail="Flashcard not found")

    db.delete(flashcard)
    db.commit()
    return {"message": "Flashcard deleted successfully"}


@router.patch("/{flashcard_id}/review", response_model=FlashcardResponse)
async def review_flashcard(
    flashcard_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark a flashcard as reviewed (increments review count)."""
    flashcard = db.query(Flashcard).filter(
        Flashcard.id == flashcard_id,
        Flashcard.user_id == current_user.id,
    ).first()

    if not flashcard:
        raise HTTPException(status_code=404, detail="Flashcard not found")

    flashcard.review_count += 1
    flashcard.last_reviewed_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(flashcard)
    return flashcard


@router.patch("/{flashcard_id}/master", response_model=FlashcardResponse)
async def toggle_mastered(
    flashcard_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Toggle the mastered status of a flashcard."""
    flashcard = db.query(Flashcard).filter(
        Flashcard.id == flashcard_id,
        Flashcard.user_id == current_user.id,
    ).first()

    if not flashcard:
        raise HTTPException(status_code=404, detail="Flashcard not found")

    flashcard.is_mastered = not flashcard.is_mastered
    db.commit()
    db.refresh(flashcard)
    return flashcard
