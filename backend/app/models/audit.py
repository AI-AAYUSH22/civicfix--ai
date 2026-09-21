import uuid
from datetime import datetime
from sqlalchemy import Column, String, ForeignKey, DateTime, Text, Boolean
from app.core.database import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    actor_id = Column(String(36), nullable=True)
    actor_name = Column(String(255), nullable=True)
    actor_role = Column(String(50), nullable=True)
    action = Column(String(100), nullable=False)
    entity_type = Column(String(50), nullable=False) # Case, WorkOrder, Evidence, Verification
    entity_id = Column(String(50), nullable=False)
    details_json = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), nullable=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    event_type = Column(String(50), nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
