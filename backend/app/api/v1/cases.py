from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
import json

from app.core.database import get_db
from app.api.deps import get_current_user, require_municipal
from app.models.user import User
from app.models.case import Case, CaseLocation
from app.models.ward import Ward, Road
from app.models.evidence import EvidenceFile
from app.models.audit import AuditLog
from app.schemas.case import CaseResponse, CaseValidateRequest
from app.services.geo_service import find_nearest_ward_and_road, check_nearby_duplicates
from app.services.state_machine import validate_state_transition
from app.services.storage_service import save_upload_file
from app.services.audit_service import log_audit_event, create_notification
from app.services.ai_service import analyze_pothole_image, analyze_repaired_road_image

router = APIRouter()

def serialize_case(case: Case) -> dict:
    return {
        "id": case.id,
        "title": case.title or f"Pothole on {case.road.name if case.road else 'Local Road'}",
        "description": case.description,
        "severity": case.severity,
        "status": case.status,
        "channel": getattr(case, "channel", "PORTAL"),
        "source_id": getattr(case, "source_id", None),
        "source_username": getattr(case, "source_username", None),
        "source_url": getattr(case, "source_url", None),
        "location_status": getattr(case, "location_status", "RESOLVED"),
        "location_confidence": getattr(case, "location_confidence", 1.0),
        "ward_id": case.ward_id,
        "ward_name": case.ward.name if case.ward else None,
        "road_id": case.road_id,
        "road_name": case.road.name if case.road else None,
        "location": {
            "latitude": case.location.latitude if case.location else 0.0,
            "longitude": case.location.longitude if case.location else 0.0,
            "address": case.location.address if case.location else "",
            "landmark": case.location.landmark if case.location else "",
        } if case.location else None,
        "evidence_files": [
            {
                "id": ev.id,
                "capture_type": ev.capture_type,
                "storage_path": ev.storage_path,
                "file_name": ev.file_name,
                "captured_at": ev.captured_at.isoformat() if ev.captured_at else None,
            }
            for ev in case.evidence_files
        ],
        "created_at": case.created_at,
        "updated_at": case.updated_at,
    }


@router.post("", response_model=dict)
async def create_case(
    description: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    severity: str = Form("Medium"),
    landmark: Optional[str] = Form(None),
    address: Optional[str] = Form(None),
    reporter_email: Optional[str] = Form(None),
    photo: Optional[UploadFile] = File(None),
    ward_id: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Citizen reports a pothole with GPS coordinates, description, and optional photo.
    Automatically assigns nearest ward/road and checks for duplicates.
    """
    # 1. Check nearby duplicates
    duplicates = check_nearby_duplicates(db, latitude, longitude, radius_meters=20.0)
    duplicate_warning = None
    if duplicates:
        duplicate_warning = f"Notice: Found {len(duplicates)} existing active complaint(s) within 20m ({duplicates[0].id})."

    # 2. Map GPS to Ward and Road
    ward, road = find_nearest_ward_and_road(db, latitude, longitude)
    if ward_id:
        custom_ward = db.query(Ward).filter(Ward.id == ward_id).first()
        if custom_ward:
            ward = custom_ward

    # 3. Create Case
    title = f"Pothole near {landmark}" if landmark else (f"Pothole on {road.name}" if road else "Road surface defect")
    new_case = Case(
        description=description,
        severity=severity,
        status="REPORTED",
        title=title,
        ward_id=ward.id if ward else None,
        road_id=road.id if road else None,
        reported_by=current_user.id,
    )
    db.add(new_case)
    db.flush()

    # 4. Create Location Record
    loc = CaseLocation(
        case_id=new_case.id,
        latitude=latitude,
        longitude=longitude,
        address=address or (f"{road.name}, {ward.name}" if road and ward else "Street location"),
        landmark=landmark
    )
    db.add(loc)

    # 5. Handle initial citizen photo if provided
    evidence_record = None
    if photo and photo.filename:
        rel_path, orig_name, file_hash = await save_upload_file(photo, subfolder="complaints")
        evidence_record = EvidenceFile(
            case_id=new_case.id,
            capture_type="CITIZEN",
            storage_path=rel_path,
            file_name=orig_name,
            file_hash=file_hash,
            latitude=latitude,
            longitude=longitude,
            validation_status="VALID"
        )
        db.add(evidence_record)

    db.commit()
    db.refresh(new_case)

    # 6. Log Audit Event & Create Notification
    actor_identifier = current_user.full_name or current_user.email
    actor_role_str = getattr(current_user.role, "value", str(current_user.role))
    log_audit_event(
        db=db,
        action="CASE_CREATED",
        entity_type="Case",
        entity_id=new_case.id,
        actor_id=current_user.id,
        actor_name=actor_identifier,
        actor_role=actor_role_str,
        details={"latitude": latitude, "longitude": longitude, "severity": severity, "duplicate_warning": duplicate_warning}
    )
    create_notification(
        db=db,
        title="Complaint Submitted",
        message=f"Case {new_case.id} has been recorded in {ward.name if ward else 'Ward'} and queued for municipal validation.",
        event_type="CASE_CREATED",
        user_id=current_user.id
    )

    response = serialize_case(new_case)
    if duplicate_warning:
        response["duplicate_notice"] = duplicate_warning
    return response

@router.post("/analyze-photo", response_model=dict)
async def analyze_photo(photo: UploadFile = File(...)):
    """
    Analyzes an uploaded photo using OpenCV AI service to detect pothole and estimate size.
    """
    image_bytes = await photo.read()
    result = analyze_pothole_image(image_bytes)
    return result

@router.post("/analyze-repair-photo", response_model=dict)
async def analyze_repair_photo(photo: UploadFile = File(...)):
    """
    Analyzes an uploaded photo using OpenCV AI service to verify it is a fully constructed/repaired road.
    """
    image_bytes = await photo.read()
    result = analyze_repaired_road_image(image_bytes)
    return result

@router.get("", response_model=List[dict])
def list_cases(
    status: Optional[str] = None,
    ward_id: Optional[str] = None,
    city: Optional[str] = None,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    List cases with optional filtering.
    """
    query = db.query(Case)
    if status:
        query = query.filter(Case.status == status.upper())
    if ward_id:
        query = query.filter(Case.ward_id == ward_id)
    if city:
        query = query.join(Ward).filter(Ward.city.ilike(f"%{city}%"))

    cases = query.order_by(Case.created_at.desc()).limit(limit).all()
    return [serialize_case(c) for c in cases]

@router.get("/my", response_model=List[dict])
def get_my_cases(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns complaints reported by the authenticated citizen.
    """
    cases = (
        db.query(Case)
        .filter(Case.reported_by == current_user.id)
        .order_by(Case.created_at.desc())
        .limit(50)
        .all()
    )
    if not cases:
        # Fallback for demo showcase if no complaints linked specifically to this user
        cases = db.query(Case).order_by(Case.created_at.desc()).limit(50).all()
    return [serialize_case(c) for c in cases]

@router.get("/{case_id}", response_model=dict)
def get_case_detail(case_id: str, db: Session = Depends(get_db)):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    data = serialize_case(case)
    # Include work order and verification info if present
    if case.work_orders:
        wo = case.work_orders[0]
        data["work_order"] = {
            "id": wo.id,
            "status": wo.status,
            "contractor_id": wo.contractor_id,
            "contractor_name": wo.contractor.name if wo.contractor else None,
            "deadline": wo.deadline.isoformat() if wo.deadline else None,
        }
    if case.verifications:
        vr = case.verifications[-1]
        data["verification"] = {
            "id": vr.id,
            "status": vr.status,
            "score": vr.overall_score,
            "summary": vr.summary,
            "checks": [
                {
                    "check_type": ch.check_type,
                    "status": ch.status,
                    "score": ch.score,
                    "details": json.loads(ch.details_json) if ch.details_json else {}
                }
                for ch in vr.checks
            ]
        }
    return data

@router.get("/{case_id}/timeline", response_model=List[dict])
def get_case_timeline(case_id: str, db: Session = Depends(get_db)):
    """
    Returns complete audit trail history for this case, including work order and evidence events.
    """
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    associated_ids = {case_id}
    for wo in case.work_orders:
        associated_ids.add(wo.id)
    for ev in case.evidence_files:
        associated_ids.add(ev.id)

    logs = (
        db.query(AuditLog)
        .filter(AuditLog.entity_id.in_(list(associated_ids)))
        .order_by(AuditLog.timestamp.asc())
        .all()
    )
    return [
        {
            "id": log.id,
            "action": log.action,
            "actor_name": log.actor_name or "System",
            "actor_role": log.actor_role or "SYSTEM",
            "timestamp": log.timestamp.isoformat(),
            "details": json.loads(log.details_json) if log.details_json else {}
        }
        for log in logs
    ]

@router.patch("/{case_id}/validate", response_model=dict)
def validate_case(
    case_id: str,
    req: CaseValidateRequest,
    current_user: User = Depends(require_municipal),
    db: Session = Depends(get_db)
):
    """
    Municipal engineer validates or rejects a reported case.
    """
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    target_status = "VALIDATED" if req.action.upper() == "VALIDATE" else "REJECTED"
    validate_state_transition(case.status, target_status)

    case.status = target_status
    db.commit()
    db.refresh(case)

    engineer_name = current_user.full_name or "Ward Engineer"
    log_audit_event(
        db=db,
        action=f"CASE_{target_status}",
        entity_type="Case",
        entity_id=case.id,
        actor_id=current_user.id,
        actor_name=engineer_name,
        actor_role=getattr(current_user.role, "value", "WARD_ENGINEER"),
        details={"notes": req.notes, "action": req.action}
    )
    create_notification(
        db=db,
        title=f"Case {target_status.capitalize()}",
        message=f"Case {case.id} was {target_status.lower()} by municipal engineer {engineer_name}.",
        event_type=f"CASE_{target_status}"
    )

    return serialize_case(case)

@router.post("/social-ingest", response_model=dict)
async def ingest_social_report(
    raw_text: str = Form(...),
    channel: str = Form("REDDIT"), # REDDIT or WHATSAPP
    reporter_handle: Optional[str] = Form("u/mumbai_commuter"),
    photo: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    """
    Module A: Ingests unstructured social posts from Reddit or WhatsApp.
    Runs Two-Pass Geocoding NER to extract Neighborhood, Landmark, and confidence score.
    """
    from app.services.social_ingestion import parse_unstructured_social_post
    parsed = parse_unstructured_social_post(raw_text, channel=channel)

    latitude = parsed["latitude"]
    longitude = parsed["longitude"]
    landmark = parsed["landmark"]
    neighborhood = parsed["neighborhood"]
    confidence = parsed["confidence_score"]
    status = "REPORTED" if confidence >= 0.70 else "REPORTED"

    ward, road = find_nearest_ward_and_road(db, latitude, longitude)

    new_case = Case(
        description=f"[{channel} INGEST] {raw_text}",
        severity="High" if "ruined" in raw_text.lower() or "dangerous" in raw_text.lower() else "Medium",
        status=status,
        title=f"Pothole reported on {channel}: {neighborhood}",
        ward_id=ward.id if ward else None,
        road_id=road.id if road else None,
    )
    db.add(new_case)
    db.flush()

    loc = CaseLocation(
        case_id=new_case.id,
        latitude=latitude,
        longitude=longitude,
        address=f"{neighborhood}, {ward.name if ward else 'Municipal Zone'}",
        landmark=landmark
    )
    db.add(loc)

    if photo and photo.filename:
        rel_path, orig_name, file_hash = await save_upload_file(photo, subfolder="social_ingest")
        ev = EvidenceFile(
            case_id=new_case.id,
            capture_type="CITIZEN",
            storage_path=rel_path,
            file_name=orig_name,
            file_hash=file_hash,
            latitude=latitude,
            longitude=longitude,
            validation_status="VALID"
        )
        db.add(ev)

    db.commit()
    db.refresh(new_case)

    log_audit_event(
        db=db,
        action="SOCIAL_DATA_NORMALIZED",
        entity_type="Case",
        entity_id=new_case.id,
        actor_name=reporter_handle,
        actor_role="SOCIAL_INGESTION_BOT",
        details={
            "channel": channel,
            "ner_confidence": confidence,
            "geocoded_zone": neighborhood,
            "landmark": landmark
        }
    )

    serialized = serialize_case(new_case)
    serialized["ner_analysis"] = parsed
    return serialized

