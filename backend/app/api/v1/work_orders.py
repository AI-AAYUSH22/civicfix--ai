from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta

from app.core.database import get_db
from app.api.deps import get_current_user, require_municipal, require_contractor
from app.models.user import User
from app.models.case import Case
from app.models.work_order import WorkOrder
from app.models.ward import Ward, Contractor
from app.schemas.work_order import WorkOrderCreate, WorkOrderResponse, WorkOrderStatusUpdate
from app.services.state_machine import validate_state_transition
from app.services.audit_service import log_audit_event, create_notification

router = APIRouter()

def serialize_work_order(wo: WorkOrder) -> dict:
    case = wo.case
    before_ev = next((ev for ev in wo.evidence_files if ev.capture_type == "BEFORE"), None)
    after_ev = next((ev for ev in wo.evidence_files if ev.capture_type == "AFTER"), None)
    citizen_ev = next((ev for ev in case.evidence_files if ev.capture_type == "CITIZEN"), None) if case else None

    ward_id_val = case.ward_id if case else None
    ward_code_val = case.ward.code if (case and case.ward) else None
    ward_db_map = {
        "w12": "contractor_ward_a.db",
        "w07": "contractor_ward_b.db",
        "w18": "contractor_ward_c.db",
        "G/N": "contractor_ward_a.db",
        "H/W": "contractor_ward_b.db",
        "K/E": "contractor_ward_c.db",
    }
    ward_db_name = ward_db_map.get(ward_id_val, ward_db_map.get(ward_code_val, "contractor_default.db"))

    return {
        "id": wo.id,
        "case_id": wo.case_id,
        "contractor_id": wo.contractor_id,
        "contractor_name": wo.contractor.name if wo.contractor else None,
        "contractor_company": wo.contractor.company_name if wo.contractor else None,
        "assigned_latitude": wo.assigned_latitude,
        "assigned_longitude": wo.assigned_longitude,
        "priority": wo.priority,
        "status": wo.status,
        "assigned_at": wo.assigned_at,
        "deadline": wo.deadline,
        "completed_at": wo.completed_at,
        "case_title": case.title if case else None,
        "case_description": case.description if case else None,
        "case_location": case.location.address if (case and case.location) else None,
        "road_name": case.road.name if (case and case.road) else None,
        "ward_id": case.ward_id if case else None,
        "ward_name": case.ward.name if (case and case.ward) else None,
        "ward_code": case.ward.code if (case and case.ward) else None,
        "city": case.ward.city if (case and case.ward) else None,
        "ward_db": ward_db_name,
        "before_photo_captured": before_ev is not None,
        "before_photo_url": before_ev.storage_path if before_ev else None,
        "after_photo_captured": after_ev is not None,
        "after_photo_url": after_ev.storage_path if after_ev else None,
        "citizen_photo_url": citizen_ev.storage_path if citizen_ev else None,
    }

@router.post("", response_model=dict)
def create_work_order(
    req: WorkOrderCreate,
    current_user: User = Depends(require_municipal),
    db: Session = Depends(get_db)
):
    """
    Municipal engineer creates a work order from a validated case,
    assigns a contractor and establishes the assigned GPS anchor.
    """
    case = db.query(Case).filter(Case.id == req.case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    if case.status not in ["VALIDATED", "REPORTED"]:
        raise HTTPException(status_code=400, detail=f"Case status is '{case.status}'. Only VALIDATED cases can be assigned a work order.")

    contractor = db.query(Contractor).filter(Contractor.id == req.contractor_id).first()
    if not contractor:
        raise HTTPException(status_code=404, detail="Contractor not found")

    # Transition case to ASSIGNED
    validate_state_transition(case.status, "ASSIGNED")
    case.status = "ASSIGNED"

    deadline_date = datetime.utcnow() + timedelta(days=req.deadline_days or 3)
    assigned_lat = case.location.latitude if case.location else 19.0178
    assigned_lng = case.location.longitude if case.location else 72.8478

    engineer_name = current_user.full_name or "Ward Engineer"
    work_order = WorkOrder(
        case_id=case.id,
        contractor_id=contractor.id,
        engineer_id=current_user.id,
        assigned_latitude=assigned_lat,
        assigned_longitude=assigned_lng,
        priority=req.priority or "Medium",
        status="Assigned",
        assigned_at=datetime.utcnow(),
        deadline=deadline_date
    )
    contractor.active_orders = (contractor.active_orders or 0) + 1

    db.add(work_order)
    db.commit()
    db.refresh(work_order)

    log_audit_event(
        db=db,
        action="WORK_ORDER_ASSIGNED",
        entity_type="WorkOrder",
        entity_id=work_order.id,
        actor_id=current_user.id,
        actor_name=engineer_name,
        actor_role=getattr(current_user.role, "value", "WARD_ENGINEER"),
        details={
            "case_id": case.id,
            "contractor": contractor.name,
            "priority": req.priority,
            "deadline": deadline_date.isoformat()
        }
    )
    create_notification(
        db=db,
        title="Contractor Assigned",
        message=f"Work Order {work_order.id} for case {case.id} assigned to {contractor.name}.",
        event_type="CONTRACTOR_ASSIGNED"
    )

    return serialize_work_order(work_order)

@router.get("", response_model=List[dict])
def list_work_orders(
    status: Optional[str] = None,
    ward_id: Optional[str] = None,
    contractor_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(WorkOrder)
    if status:
        query = query.filter(WorkOrder.status == status)
    if contractor_id:
        query = query.filter(WorkOrder.contractor_id == contractor_id)
    if ward_id:
        query = query.join(Case).filter((Case.ward_id == ward_id) | (Case.ward.has(Ward.code == ward_id)))
    orders = query.order_by(WorkOrder.assigned_at.desc()).all()
    return [serialize_work_order(wo) for wo in orders]

@router.get("/my", response_model=List[dict])
def get_my_work_orders(
    contractor_id: Optional[str] = None,
    ward_id: Optional[str] = None,
    current_user: User = Depends(require_contractor),
    db: Session = Depends(get_db)
):
    """
    Returns work orders assigned to the logged-in contractor.
    """
    query = db.query(WorkOrder)
    if contractor_id:
        query = query.filter(WorkOrder.contractor_id == contractor_id)
    if ward_id:
        query = query.join(Case).filter((Case.ward_id == ward_id) | (Case.ward.has(Ward.code == ward_id)))
    orders = query.order_by(WorkOrder.assigned_at.desc()).all()
    return [serialize_work_order(wo) for wo in orders]

@router.get("/{work_order_id}", response_model=dict)
def get_work_order_detail(work_order_id: str, db: Session = Depends(get_db)):
    wo = db.query(WorkOrder).filter(WorkOrder.id == work_order_id).first()
    if not wo:
        raise HTTPException(status_code=404, detail="Work order not found")
    return serialize_work_order(wo)

@router.patch("/{work_order_id}/status", response_model=dict)
def update_work_order_status(
    work_order_id: str,
    req: WorkOrderStatusUpdate,
    current_user: User = Depends(require_contractor),
    db: Session = Depends(get_db)
):
    wo = db.query(WorkOrder).filter(WorkOrder.id == work_order_id).first()
    if not wo:
        raise HTTPException(status_code=404, detail="Work order not found")

    wo.status = req.status
    if req.status.lower() in ["in progress", "repairing"]:
        if wo.case.status in ["ASSIGNED", "VALIDATED"]:
            validate_state_transition(wo.case.status, "REPAIRING")
            wo.case.status = "REPAIRING"

    db.commit()
    db.refresh(wo)

    contractor_name = current_user.full_name or "Contractor"
    log_audit_event(
        db=db,
        action="REPAIR_STATUS_UPDATED",
        entity_type="WorkOrder",
        entity_id=wo.id,
        actor_id=current_user.id,
        actor_name=contractor_name,
        actor_role=getattr(current_user.role, "value", "CONTRACTOR"),
        details={"new_status": req.status}
    )

    return serialize_work_order(wo)
