import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, ForeignKey, DateTime, Text, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base

class EvidenceFile(Base):
    __tablename__ = "evidence_files"

    id = Column(String(36), primary_key=True, default=lambda: f"EV-{uuid.uuid4().hex[:6].upper()}")
    case_id = Column(String(36), ForeignKey("cases.id"), nullable=False)
    work_order_id = Column(String(36), ForeignKey("work_orders.id"), nullable=True)
    contractor_id = Column(String(36), ForeignKey("contractors.id"), nullable=True)
    
    capture_type = Column(String(20), nullable=False) # BEFORE, AFTER, CITIZEN
    storage_path = Column(String(500), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_hash = Column(String(64), nullable=True)
    
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    captured_at = Column(DateTime, default=datetime.utcnow)
    
    validation_status = Column(String(50), default="VALID", nullable=False) # VALID, INVALID, DUPLICATE
    device_metadata = Column(Text, nullable=True) # JSON string
    created_at = Column(DateTime, default=datetime.utcnow)

    case = relationship("Case", back_populates="evidence_files")
    work_order = relationship("WorkOrder", back_populates="evidence_files")
    contractor = relationship("Contractor")
