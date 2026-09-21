import json
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.audit import AuditLog, Notification

def log_audit_event(
    db: Session,
    action: str,
    entity_type: str,
    entity_id: str,
    actor_id: Optional[str] = None,
    actor_name: Optional[str] = None,
    actor_role: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None
) -> AuditLog:
    """
    Records an immutable audit event for any significant system or user mutation.
    """
    audit = AuditLog(
        actor_id=actor_id,
        actor_name=actor_name,
        actor_role=actor_role,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        details_json=json.dumps(details) if details else None
    )
    db.add(audit)
    db.commit()
    db.refresh(audit)
    return audit

def create_notification(
    db: Session,
    title: str,
    message: str,
    event_type: str,
    user_id: Optional[str] = None
) -> Notification:
    """
    Creates an in-app notification for citizens, contractors, or engineers.
    """
    notif = Notification(
        user_id=user_id,
        title=title,
        message=message,
        event_type=event_type
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return notif
