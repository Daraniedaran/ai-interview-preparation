from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Optional, List
from pydantic import BaseModel
from app.database.connection import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.flashcard import Note
from datetime import datetime
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/notes", tags=["Notes"])


# ===== Schemas =====

class NoteCreate(BaseModel):
    title: str
    content: Optional[str] = None
    topic: Optional[str] = None
    tags: Optional[str] = None


class NoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    topic: Optional[str] = None
    tags: Optional[str] = None


class NoteResponse(BaseModel):
    id: int
    title: str
    content: Optional[str] = None
    topic: Optional[str] = None
    tags: Optional[str] = None
    is_pinned: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ===== Endpoints =====

@router.get("", response_model=List[NoteResponse])
async def list_notes(
    topic: Optional[str] = Query(None, description="Filter by topic"),
    search: Optional[str] = Query(None, description="Search in title and content"),
    pinned: Optional[bool] = Query(None, description="Filter pinned notes"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all notes for the current user."""
    query = db.query(Note).filter(Note.user_id == current_user.id)

    if topic:
        query = query.filter(Note.topic.ilike(f"%{topic}%"))
    if search:
        query = query.filter(
            (Note.title.ilike(f"%{search}%")) | (Note.content.ilike(f"%{search}%"))
        )
    if pinned is not None:
        query = query.filter(Note.is_pinned == pinned)

    # Pinned notes first, then by most recently updated
    notes = query.order_by(desc(Note.is_pinned), desc(Note.updated_at)).all()
    return notes


@router.get("/topics")
async def get_note_topics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get distinct topics for the current user's notes."""
    topics = (
        db.query(Note.topic)
        .filter(Note.user_id == current_user.id, Note.topic.isnot(None))
        .distinct()
        .all()
    )
    return [t[0] for t in topics if t[0]]


@router.post("", response_model=NoteResponse, status_code=status.HTTP_201_CREATED)
async def create_note(
    data: NoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new note."""
    note = Note(
        user_id=current_user.id,
        title=data.title,
        content=data.content,
        topic=data.topic,
        tags=data.tags,
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    return note


@router.get("/{note_id}", response_model=NoteResponse)
async def get_note(
    note_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a single note."""
    note = db.query(Note).filter(
        Note.id == note_id,
        Note.user_id == current_user.id,
    ).first()

    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return note


@router.put("/{note_id}", response_model=NoteResponse)
async def update_note(
    note_id: int,
    data: NoteUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a note."""
    note = db.query(Note).filter(
        Note.id == note_id,
        Note.user_id == current_user.id,
    ).first()

    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    if data.title is not None:
        note.title = data.title
    if data.content is not None:
        note.content = data.content
    if data.topic is not None:
        note.topic = data.topic
    if data.tags is not None:
        note.tags = data.tags

    db.commit()
    db.refresh(note)
    return note


@router.delete("/{note_id}")
async def delete_note(
    note_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a note."""
    note = db.query(Note).filter(
        Note.id == note_id,
        Note.user_id == current_user.id,
    ).first()

    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    db.delete(note)
    db.commit()
    return {"message": "Note deleted successfully"}


@router.patch("/{note_id}/pin", response_model=NoteResponse)
async def toggle_pin(
    note_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Toggle pin status of a note."""
    note = db.query(Note).filter(
        Note.id == note_id,
        Note.user_id == current_user.id,
    ).first()

    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    note.is_pinned = not note.is_pinned
    db.commit()
    db.refresh(note)
    return note
