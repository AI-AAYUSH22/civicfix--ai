import hashlib
from datetime import datetime
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session

from app.core.multi_db import get_contractor_session
from app.models.contractor_replica import ContractorReplicaRecord, ContractorInvoiceRecord
from app.models.expense_memo import ExpenseMemo
from app.models.verification import VerificationResult

def dual_write_evidence_to_contractor(
    ward_id: str,
    case_id: str,
    work_order_id: str,
    capture_type: str,
    storage_path: str,
    file_hash: str,
    latitude: float,
    longitude: float,
    captured_at: Optional[datetime] = None,
    verified_score: Optional[float] = None,
) -> Dict[str, Any]:
    """
    Simultaneously writes uploaded evidence into the assigned contractor's local ward database
    (e.g., contractor_ward_a.db, contractor_ward_b.db, contractor_ward_c.db).
    """
    captured_at = captured_at or datetime.utcnow()
    c_session = get_contractor_session(ward_id)
    try:
        replica = ContractorReplicaRecord(
            civicfix_case_id=case_id,
            civicfix_work_order_id=work_order_id,
            ward_id=ward_id,
            evidence_type=capture_type,
            storage_path=storage_path,
            file_sha256_hash=file_hash,
            gps_lat=latitude,
            gps_lng=longitude,
            captured_at=captured_at,
            sync_status="SYNCED",
            sync_transaction_id=f"TX-{file_hash[:12]}",
            civicfix_verified_score=verified_score,
            synced_at=datetime.utcnow(),
        )
        c_session.add(replica)
        c_session.commit()
        return {
            "replicated": True,
            "contractor_job_id": replica.id,
            "ward_db": f"contractor_ward_{ward_id}.db",
            "file_hash": file_hash,
            "sync_status": "SYNCED",
        }
    except Exception as e:
        c_session.rollback()
        return {"replicated": False, "error": str(e)}
    finally:
        c_session.close()

def dual_write_memo(
    municipal_db: Session,
    case_id: str,
    work_order_id: str,
    ward_id: str,
    contractor_id: str,
    material_cost: float,
    labor_cost: float,
    machinery_cost: float,
    asphalt_tonnage: float,
    patch_area_sqm: float,
    memo_bytes: bytes,
    memo_pdf_path: Optional[str] = None,
    itemized_json: Optional[str] = None,
) -> ExpenseMemo:
    """
    Simultaneously writes contractor expense memo into:
    1. Municipal Central Ledger (`civicfix_municipal.db`)
    2. Assigned Contractor's Ward local database (`contractor_ward_x.db`)
    """
    memo_hash = hashlib.sha256(memo_bytes).hexdigest()
    total_amount = round(material_cost + labor_cost + machinery_cost, 2)

    # Check if case is already verified by AI
    vr = (
        municipal_db.query(VerificationResult)
        .filter(VerificationResult.work_order_id == work_order_id)
        .order_by(VerificationResult.completed_at.desc())
        .first()
    )
    is_verified = (vr is not None and vr.status in ["VERIFIED", "VERIFIED_CLOSED"])
    payment_status = "APPROVED" if is_verified else "HOLD_PENDING_CV"

    # 1. Primary write: Municipal DB
    memo = ExpenseMemo(
        case_id=case_id,
        work_order_id=work_order_id,
        ward_id=ward_id,
        contractor_id=contractor_id,
        material_cost=material_cost,
        labor_cost=labor_cost,
        machinery_cost=machinery_cost,
        total_amount=total_amount,
        asphalt_tonnage=asphalt_tonnage,
        patch_area_sqm=patch_area_sqm,
        itemized_breakdown_json=itemized_json,
        memo_hash=memo_hash,
        memo_pdf_path=memo_pdf_path,
        ai_verified=is_verified,
        payment_status=payment_status,
        approved_at=datetime.utcnow() if is_verified else None,
    )
    municipal_db.add(memo)
    municipal_db.commit()
    municipal_db.refresh(memo)

    # 2. Replicated write: Contractor Ward DB
    c_session = get_contractor_session(ward_id)
    try:
        c_invoice = ContractorInvoiceRecord(
            municipal_memo_id=memo.id,
            civicfix_case_id=case_id,
            ward_id=ward_id,
            material_cost=material_cost,
            labor_cost=labor_cost,
            machinery_cost=machinery_cost,
            total_amount=total_amount,
            asphalt_tonnage=asphalt_tonnage,
            patch_area_sqm=patch_area_sqm,
            memo_sha256_hash=memo_hash,
            payment_status="APPROVED_BY_AI" if is_verified else "SUBMITTED",
            synced_at=datetime.utcnow(),
        )
        c_session.add(c_invoice)
        c_session.commit()
    except Exception:
        c_session.rollback()
    finally:
        c_session.close()

    return memo
