from sqlalchemy import (
    Column, Integer, String, Text, ForeignKey, Date, Float, JSON, Boolean
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy import DateTime
from app.database.connection import Base


class StudentProfile(Base):
    __tablename__ = "student_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    bio = Column(Text, nullable=True)
    linkedin_url = Column(String(500), nullable=True)
    github_url = Column(String(500), nullable=True)
    portfolio_url = Column(String(500), nullable=True)
    resume_url = Column(String(500), nullable=True)
    resume_filename = Column(String(255), nullable=True)
    location = Column(String(200), nullable=True)
    target_role = Column(String(200), nullable=True)
    target_companies = Column(JSON, default=list)  # List of company names
    languages = Column(JSON, default=list)          # Spoken languages
    total_points = Column(Integer, default=0)
    coding_score = Column(Float, default=0.0)
    aptitude_score = Column(Float, default=0.0)
    interview_score = Column(Float, default=0.0)
    resume_score = Column(Float, default=0.0)
    streak_days = Column(Integer, default=0)
    last_activity_date = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="profile")
    educations = relationship("Education", back_populates="profile", cascade="all, delete-orphan")
    experiences = relationship("Experience", back_populates="profile", cascade="all, delete-orphan")
    projects = relationship("Project", back_populates="profile", cascade="all, delete-orphan")
    certificates = relationship("Certificate", back_populates="profile", cascade="all, delete-orphan")
    skills = relationship("Skill", back_populates="profile", cascade="all, delete-orphan")


class Education(Base):
    __tablename__ = "educations"

    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("student_profiles.id", ondelete="CASCADE"), nullable=False)
    institution = Column(String(300), nullable=False)
    degree = Column(String(200), nullable=False)
    field_of_study = Column(String(200), nullable=True)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    grade = Column(String(50), nullable=True)
    description = Column(Text, nullable=True)

    profile = relationship("StudentProfile", back_populates="educations")


class Experience(Base):
    __tablename__ = "experiences"

    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("student_profiles.id", ondelete="CASCADE"), nullable=False)
    company_name = Column(String(200), nullable=False)
    position = Column(String(200), nullable=False)
    location = Column(String(200), nullable=True)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    is_current = Column(Boolean, default=False)  # True = current job
    description = Column(Text, nullable=True)

    profile = relationship("StudentProfile", back_populates="experiences")


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("student_profiles.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    tech_stack = Column(JSON, default=list)
    github_url = Column(String(500), nullable=True)
    live_url = Column(String(500), nullable=True)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)

    profile = relationship("StudentProfile", back_populates="projects")


class Certificate(Base):
    __tablename__ = "certificates"

    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("student_profiles.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(200), nullable=False)
    issuer = Column(String(200), nullable=False)
    issue_date = Column(Date, nullable=True)
    expiry_date = Column(Date, nullable=True)
    credential_url = Column(String(500), nullable=True)
    credential_id = Column(String(200), nullable=True)

    profile = relationship("StudentProfile", back_populates="certificates")


class Skill(Base):
    __tablename__ = "skills"

    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("student_profiles.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    category = Column(String(100), nullable=True)  # Programming, Framework, Tool, Soft Skill
    proficiency = Column(String(50), nullable=True)  # Beginner, Intermediate, Expert

    profile = relationship("StudentProfile", back_populates="skills")
