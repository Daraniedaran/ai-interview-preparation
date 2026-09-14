from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.core.dependencies import get_current_user, get_current_admin
from app.models.user import User
from app.models.student_profile import (
    StudentProfile, Education, Experience, Project, Certificate, Skill
)
from app.schemas.auth import UserResponse, UserUpdate
from app.schemas.profile import (
    ProfileResponse, ProfileUpdate,
    EducationCreate, EducationResponse,
    ExperienceCreate, ExperienceResponse,
    ProjectCreate, ProjectResponse,
    CertificateCreate, CertificateResponse,
    SkillCreate, SkillResponse,
)
from app.utils.file_upload import upload_profile_picture
from typing import List, Optional
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current user's basic info."""
    return current_user


@router.put("/me", response_model=UserResponse)
async def update_me(
    data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update current user's basic info."""
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(current_user, field, value)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/me/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Upload or update profile picture."""
    if file.content_type not in ["image/jpeg", "image/png", "image/webp"]:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, WebP images allowed")

    file_bytes = await file.read()
    if len(file_bytes) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image must be under 5MB")
    url = await upload_profile_picture(file_bytes, current_user.id)
    if url:
        current_user.profile_picture = url
        db.commit()

    return {"profile_picture": url or current_user.profile_picture, "message": "Avatar updated"}


@router.get("/me/profile", response_model=ProfileResponse)
async def get_my_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get current user's full profile."""
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile


@router.put("/me/profile", response_model=ProfileResponse)
async def update_my_profile(
    data: ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update profile bio, links, target info."""
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(profile, field, value)
    db.commit()
    db.refresh(profile)
    return profile


# ===== Education =====

@router.post("/me/education", response_model=EducationResponse, status_code=201)
async def add_education(
    data: EducationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    edu = Education(**data.model_dump(), profile_id=profile.id)
    db.add(edu)
    db.commit()
    db.refresh(edu)
    return edu


@router.delete("/me/education/{edu_id}")
async def delete_education(
    edu_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    edu = db.query(Education).filter(Education.id == edu_id, Education.profile_id == profile.id).first()
    if not edu:
        raise HTTPException(status_code=404, detail="Education record not found")
    db.delete(edu)
    db.commit()
    return {"message": "Deleted"}


# ===== Experience =====

@router.post("/me/experience", response_model=ExperienceResponse, status_code=201)
async def add_experience(
    data: ExperienceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    exp = Experience(**data.model_dump(), profile_id=profile.id)
    db.add(exp)
    db.commit()
    db.refresh(exp)
    return exp


@router.delete("/me/experience/{exp_id}")
async def delete_experience(
    exp_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    exp = db.query(Experience).filter(Experience.id == exp_id, Experience.profile_id == profile.id).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Experience record not found")
    db.delete(exp)
    db.commit()
    return {"message": "Deleted"}


# ===== Projects =====

@router.post("/me/projects", response_model=ProjectResponse, status_code=201)
async def add_project(
    data: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    proj = Project(**data.model_dump(), profile_id=profile.id)
    db.add(proj)
    db.commit()
    db.refresh(proj)
    return proj


@router.delete("/me/projects/{proj_id}")
async def delete_project(
    proj_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    proj = db.query(Project).filter(Project.id == proj_id, Project.profile_id == profile.id).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
    db.delete(proj)
    db.commit()
    return {"message": "Deleted"}


# ===== Skills =====

@router.post("/me/skills", response_model=SkillResponse, status_code=201)
async def add_skill(
    data: SkillCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    skill = Skill(**data.model_dump(), profile_id=profile.id)
    db.add(skill)
    db.commit()
    db.refresh(skill)
    return skill


@router.delete("/me/skills/{skill_id}")
async def delete_skill(
    skill_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    skill = db.query(Skill).filter(Skill.id == skill_id, Skill.profile_id == profile.id).first()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    db.delete(skill)
    db.commit()
    return {"message": "Deleted"}


# ===== Admin: List Users =====

@router.get("/", response_model=List[UserResponse])
async def list_users(
    page: int = 1,
    per_page: int = 20,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Admin: List all users with pagination."""
    query = db.query(User)
    if search:
        query = query.filter(
            User.email.ilike(f"%{search}%") |
            User.full_name.ilike(f"%{search}%") |
            User.username.ilike(f"%{search}%")
        )
    users = query.offset((page - 1) * per_page).limit(per_page).all()
    return users


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Admin: Get a specific user."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.patch("/{user_id}/toggle-active")
async def toggle_user_active(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Admin: Activate or deactivate a user."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="Admins cannot deactivate their own account")
    user.is_active = not user.is_active
    db.commit()
    return {"message": f"User {'activated' if user.is_active else 'deactivated'}", "is_active": user.is_active}
