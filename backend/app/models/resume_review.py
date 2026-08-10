from sqlalchemy import Column, Integer, String, Text, Boolean, JSON, ForeignKey, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy import DateTime
from app.database.connection import Base


class ResumeReview(Base):
    __tablename__ = "resume_reviews"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    original_filename = Column(String(255), nullable=False)
    resume_url = Column(String(500), nullable=True)     # Cloudinary URL
    extracted_text = Column(Text, nullable=True)        # PDF text content
    resume_score = Column(Float, nullable=True)         # 0-100
    ats_score = Column(Float, nullable=True)            # 0-100
    strengths = Column(JSON, default=list)              # List of strengths
    weaknesses = Column(JSON, default=list)             # List of weaknesses
    missing_skills = Column(JSON, default=list)         # Suggested skills to add
    grammar_suggestions = Column(JSON, default=list)    # Grammar fixes
    improvements = Column(JSON, default=list)           # General improvements
    keyword_analysis = Column(JSON, default=dict)       # {found: [], missing: []}
    section_scores = Column(JSON, default=dict)         # {education: 85, skills: 70...}
    ai_feedback = Column(Text, nullable=True)           # Full AI narrative feedback
    feedback_pdf_url = Column(String(500), nullable=True)  # Generated PDF report
    is_processed = Column(Boolean, default=False)
    processing_error = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="resume_reviews")
