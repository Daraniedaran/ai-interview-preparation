from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Optional, List
from pydantic import BaseModel
from app.database.connection import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.study_task import StudyTask
from datetime import datetime
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/study-planner", tags=["Study Planner"])


# ===== Schemas =====

class TaskCreate(BaseModel):
    text: str
    category: Optional[str] = None
    date: Optional[str] = "Today"
    priority: Optional[str] = "medium"


class TaskUpdate(BaseModel):
    text: Optional[str] = None
    category: Optional[str] = None
    date: Optional[str] = None
    priority: Optional[str] = None


class TaskResponse(BaseModel):
    id: int
    text: str
    category: Optional[str] = None
    completed: bool
    date: Optional[str] = None
    priority: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ===== Endpoints =====

@router.get("/tasks", response_model=List[TaskResponse])
async def list_tasks(
    category: Optional[str] = Query(None, description="Filter by category"),
    completed: Optional[bool] = Query(None, description="Filter by completion status"),
    date: Optional[str] = Query(None, description="Filter by date label"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all study tasks for the current user."""
    query = db.query(StudyTask).filter(StudyTask.user_id == current_user.id)

    if category and category != "All":
        query = query.filter(StudyTask.category == category)
    if completed is not None:
        query = query.filter(StudyTask.completed == completed)
    if date:
        query = query.filter(StudyTask.date == date)

    tasks = query.order_by(StudyTask.completed, desc(StudyTask.created_at)).all()
    return tasks


@router.post("/tasks", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    data: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new study task."""
    task = StudyTask(
        user_id=current_user.id,
        text=data.text,
        category=data.category,
        date=data.date,
        priority=data.priority,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.put("/tasks/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: int,
    data: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a study task."""
    task = db.query(StudyTask).filter(
        StudyTask.id == task_id,
        StudyTask.user_id == current_user.id,
    ).first()

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if data.text is not None:
        task.text = data.text
    if data.category is not None:
        task.category = data.category
    if data.date is not None:
        task.date = data.date
    if data.priority is not None:
        task.priority = data.priority

    db.commit()
    db.refresh(task)
    return task


@router.patch("/tasks/{task_id}/toggle", response_model=TaskResponse)
async def toggle_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Toggle completion status of a study task."""
    task = db.query(StudyTask).filter(
        StudyTask.id == task_id,
        StudyTask.user_id == current_user.id,
    ).first()

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    task.completed = not task.completed
    db.commit()
    db.refresh(task)
    return task


@router.delete("/tasks/{task_id}")
async def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a study task."""
    task = db.query(StudyTask).filter(
        StudyTask.id == task_id,
        StudyTask.user_id == current_user.id,
    ).first()

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    db.delete(task)
    db.commit()
    return {"message": "Task deleted successfully"}


@router.get("/stats")
async def get_planner_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get summary stats for the study planner."""
    total = db.query(StudyTask).filter(StudyTask.user_id == current_user.id).count()
    completed = db.query(StudyTask).filter(
        StudyTask.user_id == current_user.id,
        StudyTask.completed == True,
    ).count()
    today_total = db.query(StudyTask).filter(
        StudyTask.user_id == current_user.id,
        StudyTask.date == "Today",
    ).count()
    today_done = db.query(StudyTask).filter(
        StudyTask.user_id == current_user.id,
        StudyTask.date == "Today",
        StudyTask.completed == True,
    ).count()

    return {
        "total": total,
        "completed": completed,
        "pending": total - completed,
        "today_total": today_total,
        "today_done": today_done,
        "completion_rate": round((completed / total * 100) if total > 0 else 0, 1),
    }
