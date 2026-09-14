# Note model lives in app.models.flashcard (single-table for flashcards + notes).
# Re-export here so `from app.models.note import Note` keeps working.
from app.models.flashcard import Note  # noqa: F401

__all__ = ["Note"]
