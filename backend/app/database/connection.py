from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from typing import Generator
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

if settings.DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        settings.DATABASE_URL,
        connect_args={"check_same_thread": False},
        echo=settings.DEBUG,
    )
else:
    engine = create_engine(
        settings.DATABASE_URL,
        pool_pre_ping=True,       # Verify connections before use
        pool_size=10,              # Connection pool size
        max_overflow=20,           # Max overflow connections
        echo=settings.DEBUG,       # Log SQL in debug mode
    )

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Declarative base for all models
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency that provides a database session.
    Automatically closes the session after the request.
    """
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        logger.error(f"Database session error: {e}")
        db.rollback()
        raise
    finally:
        db.close()


def _ensure_column(table: str, column: str, ddl: str) -> None:
    """Add a column if it doesn't exist (lightweight migration for SQLite dev)."""
    if not settings.DATABASE_URL.startswith("sqlite"):
        return
    from sqlalchemy import text
    with engine.connect() as conn:
        existing = [row[1] for row in conn.execute(text(f"PRAGMA table_info({table})"))]
        if column not in existing:
            conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {ddl}"))
            conn.commit()
            logger.info(f"Added missing column {table}.{column}")


def init_db() -> None:
    """Initialize database tables (for development only, use Alembic for production)."""
    from app.models import (  # noqa: F401 - import all models to register them
        user, student_profile, company, question, coding_question,
        aptitude_test, resume_review, mock_interview, achievement,
        notification, leaderboard, bookmark, flashcard, study_task,
        discussion, admin_log,
    )
    Base.metadata.create_all(bind=engine)
    # Lightweight migration for columns added after the table was first created
    _ensure_column("mock_interviews", "current_question", "INTEGER DEFAULT 0")
    _ensure_column("mock_interviews", "current_question_text", "TEXT")
    logger.info("Database tables initialized")
