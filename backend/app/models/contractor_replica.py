import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, Text, Boolean, Integer
from app.core.database import Base

class ContractorReplicaRecord(Base):
    """
    Synchronized mirror record stored in Contractor's Ward-specific local database.
    (contractor_ward_a.db, contractor_ward_b.db, contractor_ward_c.db)
    """
    __tablename__ = "contractor_replica_records"

    id = Column(String(36), primary_key=True, default=lambda: f"JOB-{uuid.uuid4().hex[:6].upper()}")
    civicfix_case_id = Column(String(36), nullable=False, index=True)
    civicfix_work_order_id = Column(String(36), nullable=False, index=True)
    ward_id = Column(String(36), nullable=False)
    
    evidence_type = Column(String(20), nullable=False)  # BEFORE or AFTER
    storage_path = Column(String(500), nullable=False)
    file_sha256_hash = Column(String(64), nullable=False)
    
    gps_lat = Column(Float, nullable=False)
    gps_lng = Column(Float, nullable=False)
    captured_at = Column(DateTime, default=datetime.utcnow)
    
    sync_status = Column(String(50), default="SYNCED", nullable=False)
    sync_transaction_id = Column(String(64), nullable=True)
    civicfix_verified_score = Column(Float, nullable=True)
    synced_at = Column(DateTime, default=datetime.utcnow)


class ContractorInvoiceRecord(Base):
    """
    Itemized contractor expense invoice saved locally in the contractor's database.
    """
    __tablename__ = "contractor_invoice_records"

    id = Column(String(36), primary_key=True, default=lambda: f"INV-{uuid.uuid4().hex[:6].upper()}")
    municipal_memo_id = Column(String(36), nullable=False, index=True)
    civicfix_case_id = Column(String(36), nullable=False)
    ward_id = Column(String(36), nullable=False)
    
    client_name = Column(String(255), default="Municipal Corporation")
    material_cost = Column(Float, nullable=False, default=0.0)
    labor_cost = Column(Float, nullable=False, default=0.0)
    machinery_cost = Column(Float, nullable=False, default=0.0)
    total_amount = Column(Float, nullable=False)
    
    asphalt_tonnage = Column(Float, nullable=True)
    patch_area_sqm = Column(Float, nullable=True)
    memo_sha256_hash = Column(String(64), nullable=False)
    
    payment_status = Column(String(50), default="SUBMITTED", nullable=False)
    synced_at = Column(DateTime, default=datetime.utcnow)
