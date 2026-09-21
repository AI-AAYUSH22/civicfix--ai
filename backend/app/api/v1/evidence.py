from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
import json
import os

from app.core.config import settings
from app.core.database import get_db
from app.models.work_order import WorkOrder
from app.models.case import Case
from app.models.evidence import EvidenceFile
from app.models.verification import VerificationResult, VerificationCheck
from app.services.storage_service import save_upload_file
from app.services.state_machine import validate_state_transition
from app.services.audit_service import log_audit_event, create_notification
from app.verification.decision_engine import run_verification_pipeline

router = APIRouter()

@router.post("/upload", response_model=dict)
async def upload_evidence(
    work_order_id: str = Form(...),
    capture_type: str = Form(...), # BEFORE or AFTER
    latitude: float = Form(...),
    longitude: float = Form(...),
    device_info: Optional[str] = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Contractor submits in-app BEFORE or AFTER camera capture with live GPS.
    Submitting AFTER automatically launches the 5-stage AI verification pipeline.
    """
    cap_type = capture_type.upper()
    if cap_type not in ["BEFORE", "AFTER"]:
        raise HTTPException(status_code=400, detail="capture_type must be either 'BEFORE' or 'AFTER'")

    wo = db.query(WorkOrder).filter(WorkOrder.id == work_order_id).first()
    if not wo:
        raise HTTPException(status_code=404, detail="Work order not found")

    case = wo.case

    # Save and validate image
    rel_path, orig_name, file_hash = await save_upload_file(file, subfolder=f"work_orders/{wo.id}")

    # Create Evidence File record
    evidence = EvidenceFile(
        case_id=case.id,
        work_order_id=wo.id,
        contractor_id=wo.contractor_id,
        capture_type=cap_type,
        storage_path=rel_path,
        file_name=orig_name,
        file_hash=file_hash,
        latitude=latitude,
        longitude=longitude,
        captured_at=datetime.utcnow(),
        validation_status="VALID",
        device_metadata=device_info
    )
    db.add(evidence)
    db.flush()

    verification_output = None

    if cap_type == "BEFORE":
        # Transition case to REPAIRING and WO to In Progress
        if case.status in ["ASSIGNED", "VALIDATED"]:
            validate_state_transition(case.status, "REPAIRING")
            case.status = "REPAIRING"
        wo.status = "In Progress"

        log_audit_event(
            db=db,
            action="BEFORE_EVIDENCE_CAPTURED",
            entity_type="EvidenceFile",
            entity_id=evidence.id,
            actor_name=wo.contractor.name if wo.contractor else "Contractor",
            actor_role="CONTRACTOR",
            details={"work_order_id": wo.id, "latitude": latitude, "longitude": longitude}
        )
        create_notification(
            db=db,
            title="Repair Started",
            message=f"Contractor captured BEFORE evidence for {wo.id}. Case transitioned to REPAIRING.",
            event_type="REPAIR_STARTED"
        )

    elif cap_type == "AFTER":
        # Find BEFORE evidence to compare against
        before_ev = (
            db.query(EvidenceFile)
            .filter(
                EvidenceFile.work_order_id == wo.id,
                EvidenceFile.capture_type == "BEFORE"
            )
            .first()
        )

        # Transition case to VERIFICATION
        validate_state_transition(case.status, "VERIFICATION")
        case.status = "VERIFICATION"
        wo.status = "Evidence Submitted"

        log_audit_event(
            db=db,
            action="AFTER_EVIDENCE_CAPTURED",
            entity_type="EvidenceFile",
            entity_id=evidence.id,
            actor_name=wo.contractor.name if wo.contractor else "Contractor",
            actor_role="CONTRACTOR",
            details={"work_order_id": wo.id, "latitude": latitude, "longitude": longitude}
        )

        # Execute AI Verification Pipeline
        before_abs_path = os.path.join(settings.BASE_DIR, before_ev.storage_path) if before_ev else os.path.join(settings.BASE_DIR, rel_path)
        after_abs_path = os.path.join(settings.BASE_DIR, rel_path)

        ai_result = run_verification_pipeline(
            assigned_lat=wo.assigned_latitude,
            assigned_lng=wo.assigned_longitude,
            before_img_path=before_abs_path,
            after_img_path=after_abs_path,
            after_lat=latitude,
            after_lng=longitude,
            before_lat=before_ev.latitude if before_ev else None,
            before_lng=before_ev.longitude if before_ev else None,
            before_hash=before_ev.file_hash if before_ev else None,
            after_hash=file_hash,
            before_time=before_ev.captured_at if before_ev else None,
            after_time=evidence.captured_at
        )

        # Store Verification Result in DB
        vr = VerificationResult(
            case_id=case.id,
            work_order_id=wo.id,
            overall_score=ai_result["overall_score"],
            status=ai_result["status"], # VERIFIED, NEEDS_REVIEW, NOT_VERIFIED
            summary=ai_result["summary"],
            started_at=datetime.utcnow(),
            completed_at=datetime.utcnow()
        )
        db.add(vr)
        db.flush()

        # Save individual verification checks
        for ch in ai_result["checks"]:
            vcheck = VerificationCheck(
                verification_id=vr.id,
                check_type=ch["check_type"],
                status=ch["status"],
                score=ch["score"],
                confidence=ch.get("confidence", 1.0),
                details_json=json.dumps(ch.get("details", {}))
            )
            db.add(vcheck)

        # Update case status based on verification decision
        case_target_status = ai_result["status"]
        validate_state_transition(case.status, case_target_status)
        case.status = case_target_status

        if ai_result["status"] == "VERIFIED":
            wo.status = "Verified"
            wo.completed_at = datetime.utcnow()
        elif ai_result["status"] == "NEEDS_REVIEW":
            wo.status = "Needs Review"
        elif ai_result["status"] == "NOT_VERIFIED":
            wo.status = "Not Verified"

        log_audit_event(
            db=db,
            action=f"AI_VERIFICATION_{ai_result['status']}",
            entity_type="VerificationResult",
            entity_id=vr.id,
            actor_name="CivicFix AI Engine",
            actor_role="SYSTEM",
            details={
                "score": ai_result["overall_score"],
                "decision": ai_result["status"],
                "summary": ai_result["summary"]
            }
        )
        create_notification(
            db=db,
            title=f"Verification: {ai_result['status']}",
            message=f"Case {case.id} verification completed with decision '{ai_result['status']}' (Score: {ai_result['overall_score']}/100).",
            event_type="VERIFICATION_COMPLETED"
        )

        verification_output = {
            "id": vr.id,
            "status": vr.status,
            "overall_score": vr.overall_score,
            "summary": vr.summary,
            "checks": ai_result["checks"]
        }

    db.commit()
    db.refresh(evidence)

    return {
        "evidence_id": evidence.id,
        "capture_type": evidence.capture_type,
        "storage_path": evidence.storage_path,
        "case_status": case.status,
        "work_order_status": wo.status,
        "verification": verification_output
    }
