from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc
from typing import Optional, List
from pydantic import BaseModel
from app.database.connection import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.discussion import DiscussionPost, DiscussionComment
from datetime import datetime
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/discussion", tags=["Discussion"])


# ===== Schemas =====

class PostCreate(BaseModel):
    title: str
    content: str
    topic: Optional[str] = None
    tags: Optional[str] = None


class CommentCreate(BaseModel):
    content: str
    parent_id: Optional[int] = None


class CommentResponse(BaseModel):
    id: int
    post_id: int
    user_id: int
    author_name: Optional[str] = None
    content: str
    parent_id: Optional[int] = None
    like_count: int
    is_accepted: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class PostResponse(BaseModel):
    id: int
    user_id: int
    author_name: Optional[str] = None
    title: str
    content: str
    topic: Optional[str] = None
    tags: Optional[str] = None
    like_count: int
    view_count: int
    is_pinned: bool
    is_solved: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    comment_count: int = 0

    class Config:
        from_attributes = True


class PostDetailResponse(PostResponse):
    comments: List[CommentResponse] = []


# ===== Helpers =====

def _serialize_post(post, db) -> dict:
    """Serialize a post with author name and comment count."""
    user = db.query(User).filter(User.id == post.user_id).first()
    comment_count = db.query(DiscussionComment).filter(
        DiscussionComment.post_id == post.id
    ).count()
    return {
        "id": post.id,
        "user_id": post.user_id,
        "author_name": user.full_name if user else "Unknown",
        "title": post.title,
        "content": post.content,
        "topic": post.topic,
        "tags": post.tags,
        "like_count": post.like_count,
        "view_count": post.view_count,
        "is_pinned": post.is_pinned,
        "is_solved": post.is_solved,
        "created_at": post.created_at,
        "updated_at": post.updated_at,
        "comment_count": comment_count,
    }


def _serialize_comment(comment, db) -> dict:
    """Serialize a comment with author name."""
    user = db.query(User).filter(User.id == comment.user_id).first()
    return {
        "id": comment.id,
        "post_id": comment.post_id,
        "user_id": comment.user_id,
        "author_name": user.full_name if user else "Unknown",
        "content": comment.content,
        "parent_id": comment.parent_id,
        "like_count": comment.like_count,
        "is_accepted": comment.is_accepted,
        "created_at": comment.created_at,
    }


# ===== Endpoints =====

@router.get("/posts")
async def list_posts(
    topic: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List discussion posts with pagination, search, and topic filter."""
    query = db.query(DiscussionPost)

    if topic:
        query = query.filter(DiscussionPost.topic.ilike(f"%{topic}%"))
    if search:
        query = query.filter(
            (DiscussionPost.title.ilike(f"%{search}%"))
            | (DiscussionPost.content.ilike(f"%{search}%"))
            | (DiscussionPost.tags.ilike(f"%{search}%"))
        )

    total = query.count()
    posts = query.order_by(
        desc(DiscussionPost.is_pinned),
        desc(DiscussionPost.created_at),
    ).offset(skip).limit(limit).all()

    return {
        "posts": [_serialize_post(p, db) for p in posts],
        "total": total,
    }


@router.get("/posts/{post_id}")
async def get_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a single post with all its comments."""
    post = db.query(DiscussionPost).filter(DiscussionPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    # Increment view count
    post.view_count += 1
    db.commit()
    db.refresh(post)

    comments = db.query(DiscussionComment).filter(
        DiscussionComment.post_id == post_id
    ).order_by(DiscussionComment.created_at).all()

    post_data = _serialize_post(post, db)
    post_data["comments"] = [_serialize_comment(c, db) for c in comments]
    return post_data


@router.post("/posts", status_code=status.HTTP_201_CREATED)
async def create_post(
    data: PostCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new discussion post."""
    post = DiscussionPost(
        user_id=current_user.id,
        title=data.title,
        content=data.content,
        topic=data.topic,
        tags=data.tags,
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    return _serialize_post(post, db)


@router.delete("/posts/{post_id}")
async def delete_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a post (only the author can delete)."""
    post = db.query(DiscussionPost).filter(DiscussionPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if post.user_id != current_user.id and current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to delete this post")

    db.delete(post)
    db.commit()
    return {"message": "Post deleted successfully"}


@router.post("/posts/{post_id}/like")
async def toggle_like_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Toggle like on a post (simplified — increments/decrements like_count)."""
    post = db.query(DiscussionPost).filter(DiscussionPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    # Simple toggle: increment (in a full impl, you'd track per-user likes)
    post.like_count += 1
    db.commit()
    db.refresh(post)
    return {"like_count": post.like_count}


@router.post("/posts/{post_id}/comments", status_code=status.HTTP_201_CREATED)
async def add_comment(
    post_id: int,
    data: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Add a comment to a post."""
    post = db.query(DiscussionPost).filter(DiscussionPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    # Validate parent comment if provided
    if data.parent_id:
        parent = db.query(DiscussionComment).filter(
            DiscussionComment.id == data.parent_id,
            DiscussionComment.post_id == post_id,
        ).first()
        if not parent:
            raise HTTPException(status_code=404, detail="Parent comment not found")

    comment = DiscussionComment(
        post_id=post_id,
        user_id=current_user.id,
        content=data.content,
        parent_id=data.parent_id,
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return _serialize_comment(comment, db)


@router.delete("/comments/{comment_id}")
async def delete_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a comment (only the author or admin can delete)."""
    comment = db.query(DiscussionComment).filter(DiscussionComment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    if comment.user_id != current_user.id and current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to delete this comment")

    db.delete(comment)
    db.commit()
    return {"message": "Comment deleted successfully"}


@router.patch("/posts/{post_id}/solve")
async def toggle_solved(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark a post as solved/unsolved (only the author can do this)."""
    post = db.query(DiscussionPost).filter(DiscussionPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if post.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the author can mark as solved")

    post.is_solved = not post.is_solved
    db.commit()
    db.refresh(post)
    return {"is_solved": post.is_solved}
