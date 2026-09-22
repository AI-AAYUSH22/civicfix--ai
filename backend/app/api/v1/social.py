from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from pydantic import BaseModel

from app.core.database import get_db
from app.core.config import settings
from app.models.case import Case, CaseLocation
from app.models.conversation_state import ConversationState
from app.services.location_resolver import (
    resolve_coordinates,
    mark_location_resolved,
    extract_google_maps_coordinates
)

router = APIRouter()


class ResolveLocationRequest(BaseModel):
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    google_maps_url: Optional[str] = None
    address: Optional[str] = None
    landmark: Optional[str] = None


@router.get("/pending-location", response_model=List[dict])
def list_pending_location_cases(
    channel: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """
    Returns all social complaints that are pending location clarification or coordinates.
    """
    query = db.query(Case).filter(Case.location_status.in_(["PENDING", "NEEDS_CLARIFICATION"]))
    if channel:
        query = query.filter(Case.channel == channel.upper())

    cases = query.order_by(Case.created_at.desc()).limit(limit).all()
    return [
        {
            "id": c.id,
            "title": c.title,
            "channel": c.channel,
            "source_id": c.source_id,
            "source_username": c.source_username,
            "source_url": c.source_url,
            "description": c.description,
            "severity": c.severity,
            "location_status": c.location_status,
            "location_confidence": c.location_confidence,
            "location_requested_at": c.location_requested_at.isoformat() if c.location_requested_at else None,
            "created_at": c.created_at.isoformat() if c.created_at else None,
        }
        for c in cases
    ]


@router.post("/resolve-location/{case_id}", response_model=dict)
def manually_resolve_location(
    case_id: str,
    payload: ResolveLocationRequest,
    db: Session = Depends(get_db)
):
    """
    Manually resolves coordinates for a case via explicit GPS coordinates or a Google Maps URL.
    """
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    lat = payload.latitude
    lng = payload.longitude
    confidence = 1.0

    if payload.google_maps_url:
        extracted = extract_google_maps_coordinates(payload.google_maps_url)
        if extracted:
            lat, lng = extracted
            confidence = 0.95

    if lat is None or lng is None:
        raise HTTPException(
            status_code=400,
            detail="Valid latitude/longitude or parseable Google Maps URL must be provided."
        )

    mark_location_resolved(
        db=db,
        case=case,
        lat=lat,
        lng=lng,
        landmark=payload.landmark,
        address=payload.address,
        confidence=confidence
    )

    # Update conversation state if active
    if case.source_username or case.source_id:
        user_id = case.source_username or case.source_id
        state = db.query(ConversationState).filter(ConversationState.user_identifier == user_id).first()
        if state:
            state.current_step = "COMPLETED"
            db.commit()

    return {
        "status": "SUCCESS",
        "case_id": case.id,
        "location_status": case.location_status,
        "location_confidence": case.location_confidence,
        "ward_id": case.ward_id,
        "latitude": case.location.latitude if case.location else lat,
        "longitude": case.location.longitude if case.location else lng,
    }


@router.get("/location-status/{case_id}", response_model=dict)
def get_case_location_status(case_id: str, db: Session = Depends(get_db)):
    """
    Returns full location telemetry and confidence for a specific case.
    """
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    return {
        "case_id": case.id,
        "channel": case.channel,
        "location_status": case.location_status,
        "location_confidence": case.location_confidence,
        "location_requested_at": case.location_requested_at.isoformat() if case.location_requested_at else None,
        "location_resolved_at": case.location_resolved_at.isoformat() if case.location_resolved_at else None,
        "latitude": case.location.latitude if case.location else None,
        "longitude": case.location.longitude if case.location else None,
        "address": case.location.address if case.location else None,
        "landmark": case.location.landmark if case.location else None,
        "ward_id": case.ward_id,
        "road_id": case.road_id,
        "notification_sent": case.notification_sent,
        "last_notification_platform": case.last_notification_platform,
    }


@router.get("/reddit-health", response_model=dict)
def get_reddit_health():
    """
    Returns the operational status of the Reddit PRAW ingestion daemon.
    """
    is_auth_configured = bool(settings.REDDIT_CLIENT_ID and settings.REDDIT_CLIENT_SECRET)
    return {
        "status": "configured" if is_auth_configured else "standby_unconfigured",
        "client_id_present": bool(settings.REDDIT_CLIENT_ID),
        "username": settings.REDDIT_USERNAME or None,
        "monitored_subreddits": settings.REDDIT_SUBREDDITS.split(","),
        "user_agent": settings.REDDIT_USER_AGENT
    }


@router.get("/whatsapp-health", response_model=dict)
def get_whatsapp_health():
    """
    Returns the operational status of the Meta and Twilio WhatsApp ingestion services.
    """
    is_meta_configured = bool(settings.WHATSAPP_ACCESS_TOKEN and settings.WHATSAPP_PHONE_NUMBER_ID)
    return {
        "meta_cloud_api": "active" if is_meta_configured else "webhook_listener_only",
        "phone_number_id": settings.WHATSAPP_PHONE_NUMBER_ID or None,
        "verify_token_configured": bool(settings.WHATSAPP_VERIFY_TOKEN),
        "twilio_webhook_endpoint": f"{settings.API_V1_STR}/whatsapp/twilio-webhook",
        "meta_webhook_endpoint": f"{settings.API_V1_STR}/whatsapp/webhook",
    }
