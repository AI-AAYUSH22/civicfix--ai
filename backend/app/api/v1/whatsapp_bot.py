import os
import uuid
import httpx
from datetime import datetime
from fastapi import APIRouter, Request, Response, Depends, Form, HTTPException
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.models.case import Case, CaseLocation
from app.models.evidence import EvidenceFile
from app.services.social_ingestion import parse_unstructured_social_post
from app.services.audit_service import log_audit_event
from app.core.config import settings

router = APIRouter()

# Meta WhatsApp Cloud API Verification Token (can be configured in .env)
WHATSAPP_VERIFY_TOKEN = os.getenv("WHATSAPP_VERIFY_TOKEN", "civicfix_token_2026")
WHATSAPP_ACCESS_TOKEN = os.getenv("WHATSAPP_ACCESS_TOKEN", "")
WHATSAPP_PHONE_NUMBER_ID = os.getenv("WHATSAPP_PHONE_NUMBER_ID", "")

@router.get("/webhook")
async def verify_whatsapp_webhook(request: Request):
    """
    Webhook verification endpoint for Meta WhatsApp Cloud API.
    Meta sends: hub.mode, hub.verify_token, hub.challenge
    """
    params = request.query_params
    mode = params.get("hub.mode")
    token = params.get("hub.verify_token")
    challenge = params.get("hub.challenge")

    if mode and token:
        if mode == "subscribe" and token == WHATSAPP_VERIFY_TOKEN:
            return Response(content=challenge, media_type="text/plain")
        raise HTTPException(status_code=403, detail="Verification token mismatch")
    return {"status": "WhatsApp Webhook Listener active"}


@router.post("/webhook")
async def receive_meta_whatsapp_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Standard Meta WhatsApp Cloud API incoming webhook.
    Extracts text, sender phone, and media (photos) sent to the bot,
    runs NER extraction, and writes the case directly to the database.
    """
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON")

    entries = body.get("entry", [])
    for entry in entries:
        changes = entry.get("changes", [])
        for change in changes:
            value = change.get("value", {})
            messages = value.get("messages", [])
            for msg in messages:
                from_number = msg.get("from", "whatsapp_citizen")
                msg_type = msg.get("type", "text")
                text_content = ""

                if msg_type == "text":
                    text_content = msg.get("text", {}).get("body", "")
                elif msg_type == "image":
                    text_content = msg.get("image", {}).get("caption", "Pothole photo sent via WhatsApp")

                if text_content:
                    # Run 2-pass geocoding NER
                    loc_data = parse_unstructured_social_post(text_content, channel="WHATSAPP")
                    
                    case_id = f"CF-{uuid.uuid4().hex[:6].upper()}"
                    new_case = Case(
                        id=case_id,
                        channel="WHATSAPP",
                        source_id=f"wa-{from_number}",
                        citizen_name=f"WhatsApp User (+{from_number})",
                        description=f"{text_content} [Reported via Personal WhatsApp Bot]",
                        severity="High" if any(w in text_content.lower() for w in ["deep", "huge", "dangerous", "accident"]) else "Medium",
                        status="REPORTED",
                        ward_id=loc_data["ward_id"],
                        created_at=datetime.utcnow(),
                    )
                    db.add(new_case)
                    db.flush()

                    case_loc = CaseLocation(
                        case_id=case_id,
                        address=f"{loc_data['neighborhood']}, Mumbai",
                        landmark=loc_data["landmark"],
                        latitude=loc_data["latitude"],
                        longitude=loc_data["longitude"],
                    )
                    db.add(case_loc)
                    db.commit()
                    db.refresh(new_case)

                    log_audit_event(
                        db=db,
                        action="WHATSAPP_COMPLAINT_RECEIVED",
                        entity_type="Case",
                        entity_id=new_case.id,
                        actor_name=f"WhatsApp (+{from_number})",
                        actor_role="CITIZEN",
                        details={
                            "channel": "WHATSAPP",
                            "address": loc_data["neighborhood"],
                            "ward": loc_data["ward_id"],
                            "phone": from_number,
                        }
                    )

                    # Send back automated confirmation message if Meta token provided
                    if WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID:
                        reply_url = f"https://graph.facebook.com/v19.0/{WHATSAPP_PHONE_NUMBER_ID}/messages"
                        reply_headers = {
                            "Authorization": f"Bearer {WHATSAPP_ACCESS_TOKEN}",
                            "Content-Type": "application/json",
                        }
                        reply_payload = {
                            "messaging_product": "whatsapp",
                            "to": from_number,
                            "type": "text",
                            "text": {
                                "body": f"✅ Thank you! Your pothole complaint has been registered in CivicFix.\n\n📍 Case ID: {case_id}\n🏛️ Ward: {loc_data['ward_id']}\n📌 Landmark: {loc_data['landmark']}\n\nOur ward road contractor will be dispatched soon."
                            }
                        }
                        try:
                            async with httpx.AsyncClient() as client:
                                await client.post(reply_url, json=reply_payload, headers=reply_headers, timeout=5.0)
                        except Exception:
                            pass

    return {"status": "processed"}


@router.post("/twilio-webhook")
async def receive_twilio_whatsapp_webhook(
    From: str = Form(...),
    Body: str = Form(...),
    Latitude: Optional[float] = Form(None),
    Longitude: Optional[float] = Form(None),
    MediaUrl0: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """
    Twilio WhatsApp Sandbox / Production Webhook.
    Twilio formats incoming WhatsApp messages as standard form post fields:
    - From: 'whatsapp:+919876543210'
    - Body: 'Pothole on Linking Road Bandra'
    - MediaUrl0: Optional attached image URL
    - Latitude/Longitude: Optional shared location pin
    """
    phone_number = From.replace("whatsapp:", "")
    loc_data = parse_unstructured_social_post(Body, channel="WHATSAPP")

    # If user sent native WhatsApp location pin, override NER coordinates
    final_lat = Latitude if Latitude else loc_data["latitude"]
    final_lng = Longitude if Longitude else loc_data["longitude"]

    case_id = f"CF-{uuid.uuid4().hex[:6].upper()}"
    new_case = Case(
        id=case_id,
        channel="WHATSAPP",
        source_id=f"wa-{phone_number}",
        citizen_name=f"WhatsApp Citizen ({phone_number})",
        description=f"{Body} [Reported via Twilio WhatsApp]",
        severity="High" if any(w in Body.lower() for w in ["deep", "huge", "dangerous", "accident"]) else "Medium",
        status="REPORTED",
        ward_id=loc_data["ward_id"],
        created_at=datetime.utcnow(),
    )
    db.add(new_case)
    db.flush()

    case_loc = CaseLocation(
        case_id=case_id,
        address=f"{loc_data['neighborhood']}, Mumbai",
        landmark=loc_data["landmark"],
        latitude=final_lat,
        longitude=final_lng,
    )
    db.add(case_loc)
    db.commit()
    db.refresh(new_case)

    # Return Twilio TwiML XML response so WhatsApp sends instant text receipt back to citizen
    twiml_reply = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Message>✅ CivicFix Alert: Pothole report received!
Case ID: {case_id}
Ward: {loc_data['ward_id'].upper()}
Location: {loc_data['address']}
Status: Sent to Municipal Ward Engineer</Message>
</Response>"""

    return Response(content=twiml_reply, media_type="application/xml")
