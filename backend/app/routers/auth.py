from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from app.database.connection import get_db
from app.core.dependencies import get_current_user
from app.core.security import (
    get_password_hash, verify_password, create_access_token,
    create_refresh_token, create_email_verification_token,
    create_password_reset_token, decode_token
)
from app.core.config import settings
from app.models.user import User, UserRole
from app.models.student_profile import StudentProfile
from app.models.leaderboard import Leaderboard
from app.schemas.auth import (
    UserRegister, UserLogin, TokenResponse, RefreshTokenRequest,
    ForgotPasswordRequest, ResetPasswordRequest, VerifyEmailRequest,
    UserResponse, ChangePasswordRequest
)
from app.utils.email import send_verification_email, send_password_reset_email
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    data: UserRegister,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """Register a new student account."""
    # Check email uniqueness
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    # Check username uniqueness
    if db.query(User).filter(User.username == data.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")

    # Create user
    user = User(
        email=data.email,
        username=data.username,
        hashed_password=get_password_hash(data.password),
        full_name=data.full_name,
        phone=data.phone,
        college=data.college,
        graduation_year=data.graduation_year,
        role=UserRole.STUDENT,
        is_verified=False,
    )
    db.add(user)
    try:
        db.flush()  # Get the user ID
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Email or username already registered")

    # Create student profile
    profile = StudentProfile(user_id=user.id)
    db.add(profile)

    # Create leaderboard entry
    lb = Leaderboard(user_id=user.id)
    db.add(lb)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Email or username already registered")
    db.refresh(user)

    # Send verification email in background
    token = create_email_verification_token(user.email)
    background_tasks.add_task(send_verification_email, user.email, user.full_name, token)

    logger.info(f"New user registered: {user.email}")
    return user


@router.post("/login", response_model=TokenResponse)
async def login(data: UserLogin, db: Session = Depends(get_db)):
    """Authenticate user and return JWT tokens."""
    # Case-insensitive + whitespace-tolerant email lookup (emails are unique
    # regardless of case; avoids "invalid credentials" from accidental caps/spaces)
    email = data.email.strip().lower()
    user = db.query(User).filter(func.lower(User.email) == email).first()

    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")

    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})

    # Store refresh token hash
    user.refresh_token = get_password_hash(refresh_token)
    user.last_login = datetime.now(timezone.utc)
    db.commit()

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user_id=user.id,
        role=user.role,
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(data: RefreshTokenRequest, db: Session = Depends(get_db)):
    """Get a new access token using a refresh token."""
    payload = decode_token(data.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    user_id = payload.get("sub")
    try:
        user_id_int = int(user_id)
    except (TypeError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    user = db.query(User).filter(User.id == user_id_int).first()
    if not user or not user.refresh_token:
        raise HTTPException(status_code=401, detail="Token revoked or user not found")

    # Verify refresh token matches stored hash
    if not verify_password(data.refresh_token, user.refresh_token):
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    access_token = create_access_token({"sub": str(user.id)})
    new_refresh_token = create_refresh_token({"sub": str(user.id)})
    user.refresh_token = get_password_hash(new_refresh_token)
    db.commit()

    return TokenResponse(
        access_token=access_token,
        refresh_token=new_refresh_token,
        user_id=user.id,
        role=user.role,
    )


@router.post("/logout")
async def logout(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Revoke refresh token (logout)."""
    current_user.refresh_token = None
    db.commit()
    return {"message": "Logged out successfully"}


@router.post("/verify-email")
async def verify_email(data: VerifyEmailRequest, db: Session = Depends(get_db)):
    """Verify a user's email address."""
    payload = decode_token(data.token)
    if not payload or payload.get("type") != "email_verification":
        raise HTTPException(status_code=400, detail="Invalid or expired verification token")

    email = payload.get("sub")
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.is_verified:
        return {"message": "Email already verified"}

    user.is_verified = True
    db.commit()
    return {"message": "Email verified successfully"}


@router.post("/forgot-password")
async def forgot_password(
    data: ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """Send a password reset email."""
    user = db.query(User).filter(User.email == data.email).first()
    # Always return success (don't reveal if email exists)
    if user:
        token = create_password_reset_token(user.email)
        background_tasks.add_task(send_password_reset_email, user.email, user.full_name, token)
    return {"message": "If this email is registered, a reset link has been sent"}


@router.post("/reset-password")
async def reset_password(data: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Reset password using a valid reset token."""
    payload = decode_token(data.token)
    if not payload or payload.get("type") != "password_reset":
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    email = payload.get("sub")
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.hashed_password = get_password_hash(data.new_password)
    user.refresh_token = None  # Invalidate all sessions
    db.commit()
    return {"message": "Password reset successfully"}


@router.post("/change-password")
async def change_password(
    data: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Change password for authenticated user."""
    if not verify_password(data.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect current password")

    current_user.hashed_password = get_password_hash(data.new_password)
    current_user.refresh_token = None
    db.commit()
    return {"message": "Password changed successfully"}


@router.post("/resend-verification")
async def resend_verification(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Resend email verification link."""
    if current_user.is_verified:
        return {"message": "Email already verified"}
    token = create_email_verification_token(current_user.email)
    background_tasks.add_task(send_verification_email, current_user.email, current_user.full_name, token)
    return {"message": "Verification email sent"}
