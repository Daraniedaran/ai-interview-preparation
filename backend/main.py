import logging
import time
from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from app.core.config import settings
from app.database.connection import init_db
from app.routers import auth, users, resume, questions, coding, aptitude, interview, companies, leaderboard, notifications, dashboard, admin, flashcards, notes, discussion, study_planner, achievements

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s — %(name)s — %(levelname)s — %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """App startup and shutdown events."""
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    # Always ensure tables exist for SQLite dev; in production use Alembic,
    # but auto-create avoids first-request 500 when DEBUG=False and no migration ran.
    try:
        init_db()
    except Exception as e:
        logger.error(f"init_db failed: {e}", exc_info=True)
    yield
    logger.info("Application shutdown")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="""
    ## AI Interview Preparation Portal API

    A comprehensive API for the AI-powered interview preparation platform.

    ### Features
    - 🔐 JWT Authentication (access + refresh tokens)
    - 📄 AI Resume Review (OpenAI)
    - 📝 Aptitude Tests (5 categories, 3 difficulties)
    - 💻 Coding Challenges (Judge0 execution)
    - 🤖 AI Mock Interviews (GPT-4o)
    - 🏢 Company-wise Preparation
    - 🏆 Leaderboards & Achievements
    - 📊 Progress Analytics
    - 🔔 Notifications
    """,
    openapi_url="/api/v1/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ===== CORS =====
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ===== Request Timing Middleware =====
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(round(process_time * 1000, 2))
    return response


# ===== Exception Handlers =====
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = []
    for error in exc.errors():
        field = " -> ".join(str(loc) for loc in error["loc"])
        errors.append({"field": field, "message": error["msg"]})
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": "Validation error", "errors": errors},
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error"},
    )


# ===== Routers =====
API_PREFIX = "/api/v1"

app.include_router(auth.router, prefix=API_PREFIX)
app.include_router(users.router, prefix=API_PREFIX)
app.include_router(resume.router, prefix=API_PREFIX)
app.include_router(questions.router, prefix=API_PREFIX)
app.include_router(coding.router, prefix=API_PREFIX)
app.include_router(aptitude.router, prefix=API_PREFIX)
app.include_router(interview.router, prefix=API_PREFIX)
app.include_router(companies.router, prefix=API_PREFIX)
app.include_router(leaderboard.router, prefix=API_PREFIX)
app.include_router(notifications.router, prefix=API_PREFIX)
app.include_router(dashboard.router, prefix=API_PREFIX)
app.include_router(admin.router, prefix=API_PREFIX)
app.include_router(flashcards.router, prefix=API_PREFIX)
app.include_router(notes.router, prefix=API_PREFIX)
app.include_router(discussion.router, prefix=API_PREFIX)
app.include_router(study_planner.router, prefix=API_PREFIX)
app.include_router(achievements.router, prefix=API_PREFIX)


# ===== Health Check =====
@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
    }


# ===== Static Frontend (production single-server deployment) =====
FRONTEND_DIST = Path(__file__).resolve().parent.parent / "frontend" / "dist"
if FRONTEND_DIST.exists():
    from fastapi.responses import FileResponse
    from fastapi.staticfiles import StaticFiles

    app.mount("/assets", StaticFiles(directory=FRONTEND_DIST / "assets"), name="assets")

    @app.get("/", include_in_schema=False)
    async def serve_app_root():
        return FileResponse(FRONTEND_DIST / "index.html")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        """Serve the built SPA with a fallback to index.html for client-side routes."""
        # Preserve FastAPI's trailing-slash redirect for API routes
        if full_path.startswith("api/"):
            from fastapi.responses import RedirectResponse
            if not full_path.endswith("/"):
                return RedirectResponse(url=f"/{full_path}/", status_code=307)
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="Not found")
        requested = FRONTEND_DIST / full_path
        if requested.is_file():
            return FileResponse(requested)
        index = FRONTEND_DIST / "index.html"
        if index.exists():
            return FileResponse(index)
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Not found")
else:
    @app.get("/", tags=["Root"])
    async def root():
        return {
            "message": f"Welcome to {settings.APP_NAME} API",
            "docs": "/docs",
            "redoc": "/redoc",
            "version": settings.APP_VERSION,
        }
