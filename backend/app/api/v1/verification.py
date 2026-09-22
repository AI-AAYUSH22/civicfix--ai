from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
import json

from app.core.database import get_db
from app.api.deps import get_current_user, require_municipal
from app.models.user import User
from app.models.work_order import WorkOrder
from app.models.case import Case
from app.models.verification import VerificationResult
from app.schemas.verification import VerificationResponse, VerificationReviewRequest
from app.services.state_machine import validate_state_transition
from app.services.audit_service import log_audit_event, create_notification

router = APIRouter()

@router.get("/{work_order_id}", response_model=dict)
def get_verification_details(work_order_id: str, db: Session = Depends(get_db)):
    vr = (
        db.query(VerificationResult)
        .filter(VerificationResult.work_order_id == work_order_id)
        .order_by(VerificationResult.completed_at.desc())
        .first()
    )
    if not vr:
        raise HTTPException(status_code=404, detail="No verification record found for this work order")

    return {
        "id": vr.id,
        "case_id": vr.case_id,
        "work_order_id": vr.work_order_id,
        "overall_score": vr.overall_score,
        "status": vr.status,
        "summary": vr.summary,
        "started_at": vr.started_at,
        "completed_at": vr.completed_at,
        "checks": [
            {
                "check_type": ch.check_type,
                "status": ch.status,
                "score": ch.score,
                "confidence": ch.confidence,
                "details": json.loads(ch.details_json) if ch.details_json else {}
            }
            for ch in vr.checks
        ]
    }

@router.post("/{work_order_id}/review", response_model=dict)
def review_verification(
    work_order_id: str,
    req: VerificationReviewRequest,
    current_user: User = Depends(require_municipal),
    db: Session = Depends(get_db)
):
    """
    Ward engineer human review for cases with status 'NEEDS_REVIEW' or disputed verification.
    """
    wo = db.query(WorkOrder).filter(WorkOrder.id == work_order_id).first()
    if not wo:
        raise HTTPException(status_code=404, detail="Work order not found")

    case = wo.case
    vr = (
        db.query(VerificationResult)
        .filter(VerificationResult.work_order_id == work_order_id)
        .order_by(VerificationResult.completed_at.desc())
        .first()
    )

    is_approved = req.decision.upper() in ["APPROVE", "APPROVED"]

    engineer_name = current_user.full_name or "Ward Engineer"

    if is_approved:
        # Transition case to VERIFIED then CLOSED
        validate_state_transition(case.status, "VERIFIED")
        case.status = "CLOSED"
        wo.status = "Verified"
        wo.completed_at = datetime.utcnow()
        if vr:
            vr.status = "VERIFIED"
            vr.summary = f"Approved by Ward Engineer ({engineer_name}): {req.notes or 'Repair verified satisfactory.'}"

        log_audit_event(
            db=db,
            action="ENGINEER_VERIFICATION_APPROVED",
            entity_type="Case",
            entity_id=case.id,
            actor_id=current_user.id,
            actor_name=engineer_name,
            actor_role=getattr(current_user.role, "value", "WARD_ENGINEER"),
            details={"work_order_id": wo.id, "notes": req.notes}
        )
        create_notification(
            db=db,
            title="Repair Approved & Case Closed",
            message=f"Ward Engineer {engineer_name} approved repair for Case {case.id}. Case is now closed.",
            event_type="CASE_VERIFIED"
        )
    else:
        validate_state_transition(case.status, "NOT_VERIFIED")
        case.status = "NOT_VERIFIED"
        wo.status = "Not Verified"
        if vr:
            vr.status = "NOT_VERIFIED"
            vr.summary = f"Rejected by Ward Engineer ({engineer_name}): {req.notes or 'Repair deemed incomplete or incorrect.'}"

        log_audit_event(
            db=db,
            action="ENGINEER_VERIFICATION_REJECTED",
            entity_type="Case",
            entity_id=case.id,
            actor_id=current_user.id,
            actor_name=engineer_name,
            actor_role=getattr(current_user.role, "value", "WARD_ENGINEER"),
            details={"work_order_id": wo.id, "notes": req.notes}
        )
        create_notification(
            db=db,
            title="Repair Rejected",
            message=f"Ward Engineer {engineer_name} rejected repair for Case {case.id}. Rework required.",
            event_type="CASE_REJECTED"
        )

    db.commit()

    return {
        "case_id": case.id,
        "case_status": case.status,
        "work_order_status": wo.status,
        "engineer_decision": req.decision,
        "message": f"Review saved successfully. Case is now {case.status}."
    }
