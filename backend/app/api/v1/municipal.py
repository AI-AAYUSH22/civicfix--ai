from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from datetime import datetime
import json

from app.core.database import get_db
from app.api.deps import require_municipal
from app.models.user import User
from app.models.case import Case
from app.models.ward import Ward, Contractor
from app.models.audit import AuditLog

router = APIRouter()

@router.get("/stats", response_model=Dict[str, int])
def get_municipal_stats(
    current_user: User = Depends(require_municipal),
    db: Session = Depends(get_db)
):
    """
    Computes live dashboard statistics directly from the database.
    """
    total_active = db.query(Case).filter(Case.status.in_(["REPORTED", "VALIDATED", "ASSIGNED", "REPAIRING"])).count()
    pending_verification = db.query(Case).filter(Case.status.in_(["VERIFICATION", "NEEDS_REVIEW"])).count()
    under_repair = db.query(Case).filter(Case.status == "REPAIRING").count()
    resolved_this_month = db.query(Case).filter(Case.status.in_(["VERIFIED", "CLOSED"])).count()

    return {
        "totalActive": total_active,
        "pendingVerification": pending_verification,
        "underRepair": under_repair,
        "resolvedThisMonth": resolved_this_month
    }

@router.get("/wards", response_model=List[Dict[str, Any]])
def list_wards_with_counts(db: Session = Depends(get_db)):
    wards = db.query(Ward).all()
    results = []
    for w in wards:
        pending_cases = (
            db.query(Case)
            .filter(
                Case.ward_id == w.id,
                Case.status.in_(["REPORTED", "VALIDATED", "ASSIGNED", "REPAIRING", "VERIFICATION", "NEEDS_REVIEW"])
            )
            .count()
        )
        results.append({
            "id": w.id,
            "name": w.name,
            "city": w.city,
            "code": w.code,
            "center_lat": w.center_lat,
            "center_lng": w.center_lng,
            "pendingCount": pending_cases
        })
    return results

@router.get("/contractors", response_model=List[Dict[str, Any]])
def list_contractors(db: Session = Depends(get_db)):
    contractors = db.query(Contractor).all()
    return [
        {
            "id": c.id,
            "name": c.name,
            "company_name": c.company_name,
            "phone": c.phone,
            "email": c.email,
            "rating": c.rating,
            "active_orders": c.active_orders
        }
        for c in contractors
    ]

@router.get("/audit-logs", response_model=List[Dict[str, Any]])
def get_global_audit_logs(
    limit: int = 50,
    current_user: User = Depends(require_municipal),
    db: Session = Depends(get_db)
):
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(limit).all()
    return [
        {
            "id": l.id,
            "actor_name": l.actor_name or "System",
            "actor_role": l.actor_role or "SYSTEM",
            "action": l.action,
            "entity_type": l.entity_type,
            "entity_id": l.entity_id,
            "timestamp": l.timestamp.isoformat(),
            "details": json.loads(l.details_json) if l.details_json else {}
        }
        for l in logs
    ]


@router.get("/assignments", response_model=List[Dict[str, Any]])
def list_ward_assignments(
    employee_id: str | None = None,
    current_user: User = Depends(require_municipal),
    db: Session = Depends(get_db)
):
    """
    Municipal Employee Registry: Returns ward assignment history.
    Enforces accountability across transitions while preserving historical records.
    """
    from app.models.audit import EngineerWardAssignment
    query = db.query(EngineerWardAssignment)
    if employee_id:
        query = query.filter(EngineerWardAssignment.employee_id == employee_id)
    elif current_user.employee_id:
        query = query.filter(EngineerWardAssignment.employee_id == current_user.employee_id)
    
    records = query.order_by(EngineerWardAssignment.start_date.desc()).all()
    return [
        {
            "id": r.id,
            "employee_id": r.employee_id,
            "engineer_name": r.engineer_name,
            "engineer_email": r.engineer_email,
            "ward_id": r.ward_id,
            "ward_name": r.ward_name,
            "assigned_by": r.assigned_by,
            "is_current": r.is_current,
            "start_date": r.start_date.isoformat() if r.start_date else None,
            "end_date": r.end_date.isoformat() if r.end_date else None,
            "notes": r.notes,
        }
        for r in records
    ]

