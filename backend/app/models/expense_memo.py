import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, ForeignKey, DateTime, Text, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base

class ExpenseMemo(Base):
    """
    Contractor Expense Memo recorded in the Central Municipal Ledger.
    Tracks itemized material costs, bitumen tonnage, and locks payout to AI verification.
    """
    __tablename__ = "expense_memos"

    id = Column(String(36), primary_key=True, default=lambda: f"MEMO-{uuid.uuid4().hex[:6].upper()}")
    case_id = Column(String(36), ForeignKey("cases.id"), nullable=False, index=True)
    work_order_id = Column(String(36), ForeignKey("work_orders.id"), nullable=False, index=True)
    ward_id = Column(String(36), ForeignKey("wards.id"), nullable=False)
    contractor_id = Column(String(36), ForeignKey("contractors.id"), nullable=False)
    
    material_cost = Column(Float, nullable=False, default=0.0)
    labor_cost = Column(Float, nullable=False, default=0.0)
    machinery_cost = Column(Float, nullable=False, default=0.0)
    total_amount = Column(Float, nullable=False, default=0.0)
    
    asphalt_tonnage = Column(Float, nullable=True, default=0.0)
    patch_area_sqm = Column(Float, nullable=True, default=0.0)
    itemized_breakdown_json = Column(Text, nullable=True)
    
    memo_hash = Column(String(64), nullable=False)
    memo_pdf_path = Column(String(500), nullable=True)
    
    ai_verified = Column(Boolean, default=False, nullable=False)
    payment_status = Column(String(50), default="HOLD_PENDING_CV", nullable=False)  # APPROVED, HOLD_PENDING_CV, DISBURSED
    approved_by_engineer_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    
    submitted_at = Column(DateTime, default=datetime.utcnow)
    approved_at = Column(DateTime, nullable=True)

    case = relationship("Case")
    work_order = relationship("WorkOrder")
    ward = relationship("Ward")
    contractor = relationship("Contractor")
