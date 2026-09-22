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


class EngineerWardAssignment(Base):
    """
    Municipal Employee Registry & Ward Assignment History.
    Maintains permanent audit log of which engineer is assigned to which ward,
    ensuring jurisdictional isolation without altering historical records.
    """
    __tablename__ = "engineer_ward_assignments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    employee_id = Column(String(50), index=True, nullable=False)  # e.g. BMC-ENG-4001
    engineer_name = Column(String(255), nullable=False)
    engineer_email = Column(String(255), nullable=False)
    ward_id = Column(String(50), nullable=False)  # e.g. G/N or A or F/N
    ward_name = Column(String(255), nullable=False)
    assigned_by = Column(String(100), default="Municipal Commissioner Office")
    is_current = Column(Boolean, default=True, nullable=False)
    start_date = Column(DateTime, default=datetime.utcnow)
    end_date = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

