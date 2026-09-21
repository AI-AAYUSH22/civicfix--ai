import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class VerificationResult(Base):
    __tablename__ = "verification_results"

    id = Column(String(36), primary_key=True, default=lambda: f"VR-{uuid.uuid4().hex[:6].upper()}")
    case_id = Column(String(36), ForeignKey("cases.id"), nullable=False)
    work_order_id = Column(String(36), ForeignKey("work_orders.id"), nullable=False)
    
    overall_score = Column(Float, nullable=False, default=0.0) # 0 to 100
    status = Column(String(50), nullable=False) # VERIFIED, NEEDS_REVIEW, NOT_VERIFIED
    summary = Column(Text, nullable=True)
    
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, default=datetime.utcnow)

    case = relationship("Case", back_populates="verifications")
    work_order = relationship("WorkOrder", back_populates="verification_results")
    checks = relationship("VerificationCheck", back_populates="verification", cascade="all, delete-orphan")


class VerificationCheck(Base):
    __tablename__ = "verification_checks"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    verification_id = Column(String(36), ForeignKey("verification_results.id"), nullable=False)
    
    check_type = Column(String(50), nullable=False) # GPS, PERSPECTIVE, LANDMARK, POTHOLE, INTEGRITY
    status = Column(String(20), nullable=False)     # PASS, REVIEW, FAIL
    score = Column(Float, default=0.0)             # 0 to 100
    confidence = Column(Float, default=1.0)        # 0.0 to 1.0
    details_json = Column(Text, nullable=True)     # detailed metrics in JSON

    verification = relationship("VerificationResult", back_populates="checks")
