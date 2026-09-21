import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, ForeignKey, Text, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base

class Case(Base):
    __tablename__ = "cases"

    id = Column(String(36), primary_key=True, default=lambda: f"CF-{uuid.uuid4().hex[:6].upper()}")
    reported_by = Column(String(36), ForeignKey("users.id"), nullable=True)
    title = Column(String(255), nullable=True)
    description = Column(Text, nullable=False)
    severity = Column(String(20), default="Medium", nullable=False)  # Low, Medium, High
    status = Column(String(50), default="REPORTED", nullable=False)
    # Status lifecycle: REPORTED -> VALIDATED -> ASSIGNED -> REPAIRING -> VERIFICATION -> VERIFIED / NEEDS_REVIEW -> CLOSED
    ward_id = Column(String(36), ForeignKey("wards.id"), nullable=True)
    road_id = Column(String(36), ForeignKey("roads.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    reporter = relationship("User", foreign_keys=[reported_by])
    ward = relationship("Ward", back_populates="cases")
    road = relationship("Road", back_populates="cases")
    location = relationship("CaseLocation", uselist=False, back_populates="case", cascade="all, delete-orphan")
    work_orders = relationship("WorkOrder", back_populates="case", cascade="all, delete-orphan")
    evidence_files = relationship("EvidenceFile", back_populates="case", cascade="all, delete-orphan")
    verifications = relationship("VerificationResult", back_populates="case", cascade="all, delete-orphan")


class CaseLocation(Base):
    __tablename__ = "case_locations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    case_id = Column(String(36), ForeignKey("cases.id"), nullable=False, unique=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    address = Column(String(500), nullable=True)
    landmark = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    case = relationship("Case", back_populates="location")
