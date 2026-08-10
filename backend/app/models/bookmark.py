import enum
from sqlalchemy import Column, Integer, ForeignKey, Enum, UniqueConstraint, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy import DateTime
from app.database.connection import Base


class BookmarkType(str, enum.Enum):
    QUESTION = "question"
    CODING = "coding"
    COMPANY = "company"


class Bookmark(Base):
    __tablename__ = "bookmarks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    bookmark_type = Column(Enum(BookmarkType), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id", ondelete="CASCADE"), nullable=True)
    coding_question_id = Column(Integer, ForeignKey("coding_questions.id", ondelete="CASCADE"), nullable=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=True)
    notes = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="bookmarks")
    question = relationship("Question", back_populates="bookmarks")
