from sqlalchemy import Column, Integer, String, Text, ForeignKey, JSON
from sqlalchemy.sql import func
from sqlalchemy import DateTime
from app.database.connection import Base


class AdminLog(Base):
    __tablename__ = "admin_logs"

    id = Column(Integer, primary_key=True, index=True)
    admin_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(String(200), nullable=False)      # e.g., "CREATE_QUESTION", "DELETE_USER"
    resource_type = Column(String(100), nullable=True) # e.g., "User", "Question"
    resource_id = Column(Integer, nullable=True)
    details = Column(JSON, nullable=True)              # Additional context
    ip_address = Column(String(50), nullable=True)
    user_agent = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
