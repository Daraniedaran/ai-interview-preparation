import cloudinary
import cloudinary.uploader
from typing import Optional
import io
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)


def configure_cloudinary():
    """Configure Cloudinary with credentials from settings."""
    if settings.CLOUDINARY_CLOUD_NAME:
        cloudinary.config(
            cloud_name=settings.CLOUDINARY_CLOUD_NAME,
            api_key=settings.CLOUDINARY_API_KEY,
            api_secret=settings.CLOUDINARY_API_SECRET,
        )


configure_cloudinary()


async def upload_resume(file_bytes: bytes, filename: str, user_id: int) -> Optional[str]:
    """Upload a resume PDF to Cloudinary."""
    if not settings.CLOUDINARY_CLOUD_NAME:
        logger.warning("Cloudinary not configured — file upload skipped")
        return None

    try:
        result = cloudinary.uploader.upload(
            file_bytes,
            resource_type="raw",
            folder=f"interview_portal/resumes/{user_id}",
            public_id=f"resume_{user_id}",
            overwrite=True,
            tags=["resume"],
        )
        return result.get("secure_url")
    except Exception as e:
        logger.error(f"Cloudinary upload error: {e}")
        return None


async def upload_profile_picture(file_bytes: bytes, user_id: int) -> Optional[str]:
    """Upload a profile picture to Cloudinary."""
    if not settings.CLOUDINARY_CLOUD_NAME:
        return None

    try:
        result = cloudinary.uploader.upload(
            file_bytes,
            resource_type="image",
            folder=f"interview_portal/avatars",
            public_id=f"avatar_{user_id}",
            overwrite=True,
            transformation=[
                {"width": 400, "height": 400, "crop": "fill", "gravity": "face"},
                {"quality": "auto", "fetch_format": "auto"},
            ],
        )
        return result.get("secure_url")
    except Exception as e:
        logger.error(f"Cloudinary avatar upload error: {e}")
        return None


def delete_file(public_id: str, resource_type: str = "image") -> bool:
    """Delete a file from Cloudinary."""
    if not settings.CLOUDINARY_CLOUD_NAME:
        return True

    try:
        cloudinary.uploader.destroy(public_id, resource_type=resource_type)
        return True
    except Exception as e:
        logger.error(f"Cloudinary delete error: {e}")
        return False
