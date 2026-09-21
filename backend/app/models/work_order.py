import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base

class WorkOrder(Base):
    __tablename__ = "work_orders"

    id = Column(String(36), primary_key=True, default=lambda: f"WO-{uuid.uuid4().hex[:6].upper()}")
    case_id = Column(String(36), ForeignKey("cases.id"), nullable=False)
    contractor_id = Column(String(36), ForeignKey("contractors.id"), nullable=True)
    engineer_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    
    assigned_latitude = Column(Float, nullable=False)
    assigned_longitude = Column(Float, nullable=False)
    
    priority = Column(String(20), default="Medium", nullable=False) # High, Medium, Low
    status = Column(String(50), default="Assigned", nullable=False) # Assigned, In Progress, Evidence Submitted, Verified, Needs Review, Closed
    
    assigned_at = Column(DateTime, default=datetime.utcnow)
    deadline = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)

    case = relationship("Case", back_populates="work_orders")
    contractor = relationship("Contractor", back_populates="work_orders")
    engineer = relationship("User", foreign_keys=[engineer_id])
    evidence_files = relationship("EvidenceFile", back_populates="work_order", cascade="all, delete-orphan")
    verification_results = relationship("VerificationResult", back_populates="work_order", cascade="all, delete-orphan")
