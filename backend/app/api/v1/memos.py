from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime
import json

from app.core.database import get_db
from app.models.case import Case
from app.models.work_order import WorkOrder
from app.models.expense_memo import ExpenseMemo
from app.models.audit import AuditLog
from app.services.dual_db_service import dual_write_memo
from app.services.audit_service import log_audit_event, create_notification

router = APIRouter()

@router.post("", response_model=dict)
async def submit_contractor_expense_memo(
    case_id: str = Form(...),
    work_order_id: str = Form(...),
    ward_id: str = Form(...),
    contractor_id: str = Form(...),
    material_cost: float = Form(...),
    labor_cost: float = Form(...),
    machinery_cost: float = Form(...),
    asphalt_tonnage: float = Form(...),
    patch_area_sqm: float = Form(...),
    itemized_breakdown: Optional[str] = Form(None),
    invoice_file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    """
    Contractor submits an itemized expense memo.
    Dual-writes the memo simultaneously to:
    1. Municipal Central Ledger (`civicfix_municipal.db`)
    2. Contractor's Ward-specific local database (`contractor_ward_x.db`)
    """
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    wo = db.query(WorkOrder).filter(WorkOrder.id == work_order_id).first()
    if not wo:
        raise HTTPException(status_code=404, detail="Work order not found")

    file_bytes = b""
    memo_path = "uploads/memos/memo_default.pdf"
    if invoice_file:
        file_bytes = await invoice_file.read()
        memo_path = f"uploads/memos/{case_id}_{invoice_file.filename}"
    else:
        # Generate synthetic memo payload bytes for hash consistency
        summary_payload = f"{case_id}|{work_order_id}|{material_cost}|{labor_cost}|{machinery_cost}|{asphalt_tonnage}"
        file_bytes = summary_payload.encode("utf-8")

    memo = dual_write_memo(
        municipal_db=db,
        case_id=case_id,
        work_order_id=work_order_id,
        ward_id=ward_id or case.ward_id or "w12",
        contractor_id=contractor_id or wo.contractor_id,
        material_cost=material_cost,
        labor_cost=labor_cost,
        machinery_cost=machinery_cost,
        asphalt_tonnage=asphalt_tonnage,
        patch_area_sqm=patch_area_sqm,
        memo_bytes=file_bytes,
        memo_pdf_path=memo_path,
        itemized_json=itemized_breakdown,
    )

    log_audit_event(
        db=db,
        action="CONTRACTOR_MEMO_SUBMITTED",
        entity_type="ExpenseMemo",
        entity_id=memo.id,
        actor_name="Contractor",
        actor_role="CONTRACTOR",
        details={
            "case_id": case_id,
            "total_amount": memo.total_amount,
            "payment_status": memo.payment_status,
            "memo_hash": memo.memo_hash,
            "dual_database_sync": "SYNCED_TO_WARD_DB"
        }
    )

    return {
        "id": memo.id,
        "case_id": memo.case_id,
        "work_order_id": memo.work_order_id,
        "ward_id": memo.ward_id,
        "total_amount": memo.total_amount,
        "material_cost": memo.material_cost,
        "labor_cost": memo.labor_cost,
        "machinery_cost": memo.machinery_cost,
        "asphalt_tonnage": memo.asphalt_tonnage,
        "patch_area_sqm": memo.patch_area_sqm,
        "memo_hash": memo.memo_hash,
        "payment_status": memo.payment_status,
        "ai_verified": memo.ai_verified,
        "dual_replicated": True,
        "message": "Expense memo submitted & dual-replicated in Contractor Ward DB and Municipal Treasury."
    }

@router.get("/{case_id}", response_model=dict)
def get_expense_memo_for_case(case_id: str, db: Session = Depends(get_db)):
    memo = (
        db.query(ExpenseMemo)
        .filter(ExpenseMemo.case_id == case_id)
        .order_by(ExpenseMemo.submitted_at.desc())
        .first()
    )
    if not memo:
        return {"exists": False, "memo": None}

    return {
        "exists": True,
        "memo": {
            "id": memo.id,
            "case_id": memo.case_id,
            "work_order_id": memo.work_order_id,
            "ward_id": memo.ward_id,
            "material_cost": memo.material_cost,
            "labor_cost": memo.labor_cost,
            "machinery_cost": memo.machinery_cost,
            "total_amount": memo.total_amount,
            "asphalt_tonnage": memo.asphalt_tonnage,
            "patch_area_sqm": memo.patch_area_sqm,
            "memo_hash": memo.memo_hash,
            "payment_status": memo.payment_status,
            "ai_verified": memo.ai_verified,
            "submitted_at": memo.submitted_at.isoformat() if memo.submitted_at else None,
            "approved_at": memo.approved_at.isoformat() if memo.approved_at else None,
        }
    }

@router.patch("/{memo_id}/approve", response_model=dict)
def approve_memo_payout(
    memo_id: str,
    engineer_name: str = "Er. Rajesh Kulkarni",
    db: Session = Depends(get_db)
):
    """
    Municipal engineer approves treasury payment release.
    """
    memo = db.query(ExpenseMemo).filter(ExpenseMemo.id == memo_id).first()
    if not memo:
        raise HTTPException(status_code=404, detail="Expense memo not found")

    memo.payment_status = "APPROVED"
    memo.approved_at = datetime.utcnow()
    db.commit()

    return {
        "id": memo.id,
        "status": "APPROVED",
        "message": f"Expense memo {memo.id} approved for payment disbursement by {engineer_name}."
    }
