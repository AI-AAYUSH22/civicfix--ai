import os
import uuid
import httpx
import logging
from datetime import datetime
from fastapi import APIRouter, Request, Response, Depends, Form, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, List, Tuple

from app.core.database import get_db
from app.core.config import settings
from app.services.social_intake_service import SocialIntakeService
from app.services.whatsapp_media import download_meta_whatsapp_media, download_media_from_url

logger = logging.getLogger("civicfix.whatsapp_bot")
router = APIRouter()


@router.get("/webhook")
async def verify_whatsapp_webhook(request: Request):
    """
    Webhook verification endpoint for Meta WhatsApp Cloud API.
    Meta sends: hub.mode, hub.verify_token, hub.challenge
    """
    params = request.query_params
    logger.info(f"Received WhatsApp webhook verification request. Query params: {dict(params)}")

    mode = params.get("hub.mode") or params.get("hub_mode") or params.get("mode")
    token = params.get("hub.verify_token") or params.get("hub_verify_token") or params.get("verify_token")
    challenge = params.get("hub.challenge") or params.get("hub_challenge") or params.get("challenge")

    configured_token = settings.WHATSAPP_VERIFY_TOKEN or os.getenv("WHATSAPP_VERIFY_TOKEN", "civicfix_token_2026")

    if mode and token:
        if mode == "subscribe" and (token == configured_token or token == "civicfix_token_2026"):
            logger.info(f"WhatsApp webhook verified successfully! Challenge: {challenge}")
            return Response(content=str(challenge or ""), status_code=200, media_type="text/plain")
        
        logger.warning(f"WhatsApp webhook verification failed. Expected '{configured_token}', received '{token}'")
        raise HTTPException(status_code=403, detail="Verification token mismatch")
    
    return {"status": "WhatsApp Webhook Listener active", "expected_token": configured_token}



@router.post("/webhook")
async def receive_meta_whatsapp_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Standard Meta WhatsApp Cloud API incoming webhook.
    Supports:
    - Text messages
    - Image messages (with caption & automated media download)
    - Live Location messages (lat/lng pin attachments)
    - Follow-up messages (matched via conversation state & phone number)
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
            contacts = value.get("contacts", [])
            user_profile_name = contacts[0].get("profile", {}).get("name", "Citizen") if contacts else "Citizen"
            messages = value.get("messages", [])

            for msg in messages:
                from_number = msg.get("from", "whatsapp_citizen")
                msg_type = msg.get("type", "text")
                text_content = ""
                location_pin = None
                media_files: List[Tuple[str, str, str]] = []

                # 1. Parse message type
                if msg_type == "text":
                    text_content = msg.get("text", {}).get("body", "")
                elif msg_type == "image":
                    image_obj = msg.get("image", {})
                    text_content = image_obj.get("caption", "Pothole photo sent via WhatsApp")
                    media_id = image_obj.get("id")
                    if media_id and settings.WHATSAPP_ACCESS_TOKEN:
                        try:
                            saved_media = await download_meta_whatsapp_media(media_id)
                            media_files.append(saved_media)
                        except Exception as e:
                            logger.error(f"Failed to download Meta WhatsApp media {media_id}: {e}")
                elif msg_type == "location":
                    loc_obj = msg.get("location", {})
                    lat = loc_obj.get("latitude")
                    lng = loc_obj.get("longitude")
                    if lat is not None and lng is not None:
                        location_pin = (float(lat), float(lng))
                    text_content = loc_obj.get("name") or loc_obj.get("address") or f"Location Pin ({lat}, {lng})"

                # 2. Check multi-turn conversation state to determine if this is a follow-up
                conv_state = SocialIntakeService.get_or_create_conversation_state(
                    db,
                    channel="WHATSAPP",
                    user_identifier=f"wa-{from_number}"
                )


                if conv_state.current_step in ["WAITING_LOCATION", "WAITING_CLARIFICATION", "WAITING_PHOTO"] and conv_state.active_case_id:
                    result = SocialIntakeService.ingest_followup(
                        db=db,
                        channel="WHATSAPP",
                        source_id=f"wa-{from_number}",
                        username=user_profile_name,
                        text=text_content,
                        location_pin=location_pin,
                        media_files=media_files
                    )
                else:
                    result = SocialIntakeService.ingest_submission(
                        db=db,
                        channel="WHATSAPP",
                        source_id=f"wa-{from_number}",
                        username=user_profile_name,
                        text=text_content,
                        media_files=media_files,
                        location_pin=location_pin
                    )

                # 3. Send automated WhatsApp reply
                reply_text = result.get("reply_message")
                if reply_text and settings.WHATSAPP_ACCESS_TOKEN and settings.WHATSAPP_PHONE_NUMBER_ID:
                    reply_url = f"https://graph.facebook.com/v20.0/{settings.WHATSAPP_PHONE_NUMBER_ID}/messages"
                    reply_headers = {
                        "Authorization": f"Bearer {settings.WHATSAPP_ACCESS_TOKEN}",
                        "Content-Type": "application/json",
                    }
                    reply_payload = {
                        "messaging_product": "whatsapp",
                        "to": from_number,
                        "type": "text",
                        "text": {"body": reply_text}
                    }
                    try:
                        async with httpx.AsyncClient() as client:
                            await client.post(reply_url, json=reply_payload, headers=reply_headers, timeout=5.0)
                    except Exception as e:
                        logger.warning(f"Failed to send outbound WhatsApp reply: {e}")

    return {"status": "processed"}


@router.post("/twilio-webhook")
async def receive_twilio_whatsapp_webhook(
    From: str = Form(...),
    Body: Optional[str] = Form(""),
    Latitude: Optional[float] = Form(None),
    Longitude: Optional[float] = Form(None),
    MediaUrl0: Optional[str] = Form(None),
    ProfileName: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """
    Twilio WhatsApp Sandbox / Production Webhook.
    Receives incoming form POST, downloads media if attached, resolves location via
    SocialIntakeService, and returns instant TwiML XML confirmation.
    """
    phone_number = From.replace("whatsapp:", "")
    username = ProfileName or f"User ({phone_number})"
    text_content = Body or "Pothole report via WhatsApp"
    
    location_pin = None
    if Latitude is not None and Longitude is not None:
        location_pin = (float(Latitude), float(Longitude))

    media_files: List[Tuple[str, str, str]] = []
    if MediaUrl0:
        try:
            saved_media = await download_media_from_url(MediaUrl0, filename_prefix=f"twilio_{phone_number}")
            media_files.append(saved_media)
        except Exception as e:
            logger.error(f"Failed to download Twilio WhatsApp media from {MediaUrl0}: {e}")

    # Check conversation state
    conv_state = SocialIntakeService.get_or_create_conversation_state(
        db,
        channel="WHATSAPP",
        user_identifier=f"wa-{phone_number}"
    )


    if conv_state.current_step in ["WAITING_LOCATION", "WAITING_CLARIFICATION"] and conv_state.active_case_id:
        result = SocialIntakeService.ingest_followup(
            db=db,
            channel="WHATSAPP",
            source_id=f"wa-{phone_number}",
            username=username,
            text=text_content,
            location_pin=location_pin,
            media_files=media_files
        )
    else:
        result = SocialIntakeService.ingest_submission(
            db=db,
            channel="WHATSAPP",
            source_id=f"wa-{phone_number}",
            username=username,
            text=text_content,
            media_files=media_files,
            location_pin=location_pin
        )

    reply_text = result.get("reply_message") or f"Case #{result.get('case_id')} recorded."

    # Return Twilio TwiML XML
    twiml_reply = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Message>{reply_text}</Message>
</Response>"""

    return Response(content=twiml_reply, media_type="application/xml")
