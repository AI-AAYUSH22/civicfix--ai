import uuid
import json
import logging
from datetime import datetime
from typing import Optional, Tuple, Dict, Any, List
from sqlalchemy.orm import Session

from app.models.case import Case, CaseLocation
from app.models.evidence import EvidenceFile
from app.models.conversation_state import ConversationState
from app.services.location_resolver import (
    resolve_coordinates,
    find_pending_case_by_source,
    mark_location_resolved,
    mark_location_pending,
    extract_google_maps_coordinates,
    extract_landmark,
)
from app.services.geo_service import find_nearest_ward_and_road, check_nearby_duplicates
from app.services.audit_service import log_audit_event, create_notification
from app.core.config import settings

logger = logging.getLogger("civicfix.social_intake")


class SocialIntakeService:
    """
    Unified Single Entry Point for all social intake pipelines (Reddit & WhatsApp).
    Handles deduplication, location resolution, evidence persistence, conversation state,
    and outbound response messaging.
    """

    @staticmethod
    def get_or_create_conversation_state(
        db: Session,
        channel: str,
        user_identifier: str
    ) -> ConversationState:
        """
        Retrieves active conversation state for user or creates a new one.
        """
        state = (
            db.query(ConversationState)
            .filter(
                ConversationState.channel == channel.upper(),
                ConversationState.user_identifier == user_identifier
            )
            .first()
        )
        if not state:
            state = ConversationState(
                channel=channel.upper(),
                user_identifier=user_identifier,
                current_step="INIT",
                last_interaction_at=datetime.utcnow()
            )
            db.add(state)
            db.commit()
            db.refresh(state)
        return state

    @classmethod
    def ingest_submission(
        cls,
        db: Session,
        channel: str,
        source_id: str,
        username: str,
        text: str,
        media_files: Optional[List[Tuple[str, str, str]]] = None,
        location_pin: Optional[Tuple[float, float]] = None,
        source_url: Optional[str] = None,
        raw_metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Ingests a new social report (from Reddit post or initial WhatsApp message).
        Normalizes data, resolves coordinates with confidence scoring, attaches media,
        creates the Case record, and updates ConversationState.
        """
        media_files = media_files or []
        channel = channel.upper()

        # 1. Check for duplicate submission by source_id
        existing_case = db.query(Case).filter(
            Case.channel == channel,
            Case.source_id == source_id
        ).first()
        if existing_case:
            logger.info(f"Duplicate social intake ignored for {channel} source_id: {source_id}")
            return {
                "status": "DUPLICATE",
                "case_id": existing_case.id,
                "location_status": existing_case.location_status,
                "message": "Submission already processed."
            }

        # 2. Run deterministic Location Resolver
        loc_res = resolve_coordinates(text, location_pin=location_pin, channel=channel)
        lat = loc_res["latitude"]
        lng = loc_res["longitude"]
        confidence = loc_res["confidence"]
        loc_status = loc_res["location_status"]
        landmark = loc_res.get("landmark")
        address = loc_res.get("address")

        # 3. Check physical nearby duplicate potholes within 20m if location is high confidence
        duplicate_warning = None
        if loc_status == "RESOLVED":
            duplicates = check_nearby_duplicates(db, lat, lng, radius_meters=20.0)
            if duplicates:
                duplicate_warning = f"Notice: Existing active case {duplicates[0].id} found within 20m."

        # 4. Map GPS to Ward and Road
        ward, road = find_nearest_ward_and_road(db, lat, lng)

        # 5. Determine severity from text
        lower_text = text.lower()
        if any(k in lower_text for k in ["critical", "accident", "huge", "dangerous", "deep", "severely"]):
            severity = "High"
        elif any(k in lower_text for k in ["minor", "small", "shallow"]):
            severity = "Low"
        else:
            severity = "Medium"

        # 6. Construct Case Title
        title_loc = landmark if landmark else (address or "Road Surface Defect")
        title = f"[{channel}] Pothole near {title_loc}"

        # 7. Create Case in database
        case_id = f"CF-{uuid.uuid4().hex[:6].upper()}"
        new_case = Case(
            id=case_id,
            channel=channel,
            source_id=source_id,
            citizen_name=f"{channel.capitalize()} Citizen ({username})",
            source_username=username,
            source_url=source_url,
            title=title,
            description=f"[{channel} Report by {username}]\n{text}",
            severity=severity,
            status="REPORTED",
            location_status=loc_status,
            location_confidence=confidence,
            location_requested_at=datetime.utcnow() if loc_status != "RESOLVED" else None,
            location_resolved_at=datetime.utcnow() if loc_status == "RESOLVED" else None,
            ward_id=ward.id if ward else None,
            road_id=road.id if road else None,
            created_at=datetime.utcnow()
        )
        db.add(new_case)
        db.flush()

        # 8. Create CaseLocation
        case_loc = CaseLocation(
            case_id=case_id,
            latitude=lat,
            longitude=lng,
            address=address,
            landmark=landmark
        )
        db.add(case_loc)

        # 9. Attach evidence files
        for rel_path, orig_name, file_hash in media_files:
            ev = EvidenceFile(
                case_id=case_id,
                capture_type="CITIZEN",
                storage_path=rel_path,
                file_name=orig_name,
                file_hash=file_hash,
                latitude=lat,
                longitude=lng,
                validation_status="VALID"
            )
            db.add(ev)

        # 10. Update Conversation State
        conv_state = cls.get_or_create_conversation_state(db, channel, source_id or username)
        conv_state.active_case_id = case_id

        if loc_status == "RESOLVED":
            conv_state.current_step = "COMPLETED"
        elif loc_status == "NEEDS_CLARIFICATION":
            conv_state.current_step = "WAITING_CLARIFICATION"
        else:
            conv_state.current_step = "WAITING_LOCATION"
        conv_state.session_data_json = json.dumps({
            "case_id": case_id,
            "channel": channel,
            "text": text,
            "confidence": confidence,
            "media_count": len(media_files)
        })
        conv_state.last_interaction_at = datetime.utcnow()

        db.commit()
        db.refresh(new_case)

        # 11. Audit Logging & In-App Notification
        log_audit_event(
            db=db,
            action="SOCIAL_COMPLAINT_INGESTED",
            entity_type="Case",
            entity_id=new_case.id,
            actor_name=f"{channel} ({username})",
            actor_role="SOCIAL_BOT",
            details={
                "channel": channel,
                "source_id": source_id,
                "location_status": loc_status,
                "confidence": confidence,
                "tier": loc_res.get("tier"),
                "duplicate_warning": duplicate_warning
            }
        )

        create_notification(
            db=db,
            title=f"New {channel.capitalize()} Complaint Ingested",
            message=f"Case {new_case.id} created from {channel} ({username}). Location: {loc_status}.",
            event_type="SOCIAL_CASE_INGESTED"
        )

        # 12. Build Outbound Messaging Guidance
        reply_message = cls._generate_reply_text(channel, new_case, loc_status, confidence, landmark)

        return {
            "status": "CREATED",
            "case_id": new_case.id,
            "channel": channel,
            "location_status": loc_status,
            "location_confidence": confidence,
            "reply_message": reply_message,
            "needs_reply": loc_status != "RESOLVED" or channel == "WHATSAPP",
            "duplicate_warning": duplicate_warning
        }

    @classmethod
    def ingest_followup(
        cls,
        db: Session,
        channel: str,
        source_id: str,
        username: str,
        text: str,
        location_pin: Optional[Tuple[float, float]] = None,
        media_files: Optional[List[Tuple[str, str, str]]] = None
    ) -> Dict[str, Any]:
        """
        Handles follow-up messages (e.g. WhatsApp live location sent after initial prompt,
        or Reddit comment reply with Google Maps link).
        Matches to existing pending case, updates coordinates, marks location RESOLVED,
        and transitions conversation state to COMPLETED.
        """
        media_files = media_files or []
        channel = channel.upper()

        # 1. Match active case via ConversationState or pending case query
        conv_state = cls.get_or_create_conversation_state(db, channel, source_id or username)
        pending_case = None

        if conv_state.active_case_id:
            pending_case = db.query(Case).filter(Case.id == conv_state.active_case_id).first()

        if not pending_case:
            pending_case = find_pending_case_by_source(db, channel, source_id)

        if not pending_case:
            # No pending case found; treat as a fresh submission
            return cls.ingest_submission(
                db=db,
                channel=channel,
                source_id=source_id,
                username=username,
                text=text,
                media_files=media_files,
                location_pin=location_pin
            )

        # 2. Resolve coordinates from follow-up payload
        loc_res = resolve_coordinates(text, location_pin=location_pin, channel=channel)
        lat = loc_res["latitude"]
        lng = loc_res["longitude"]
        confidence = loc_res["confidence"]
        loc_status = loc_res["location_status"]
        landmark = loc_res.get("landmark") or extract_landmark(text)
        address = loc_res.get("address")

        if loc_status == "RESOLVED":
            # Successfully resolved location
            mark_location_resolved(
                db=db,
                case=pending_case,
                lat=lat,
                lng=lng,
                landmark=landmark,
                address=address,
                confidence=confidence
            )

            # Attach any new media
            for rel_path, orig_name, file_hash in media_files:
                ev = EvidenceFile(
                    case_id=pending_case.id,
                    capture_type="CITIZEN",
                    storage_path=rel_path,
                    file_name=orig_name,
                    file_hash=file_hash,
                    latitude=lat,
                    longitude=lng,
                    validation_status="VALID"
                )
                db.add(ev)

            conv_state.current_step = "COMPLETED"
            conv_state.last_interaction_at = datetime.utcnow()
            db.commit()
            db.refresh(pending_case)

            log_audit_event(
                db=db,
                action="CASE_LOCATION_RESOLVED",
                entity_type="Case",
                entity_id=pending_case.id,
                actor_name=f"{channel} ({username})",
                actor_role="SOCIAL_BOT",
                details={
                    "channel": channel,
                    "strategy": loc_res.get("strategy"),
                    "confidence": confidence,
                    "latitude": lat,
                    "longitude": lng
                }
            )

            reply_message = (
                f"✅ Location verified! Case #{pending_case.id} has been mapped to {pending_case.ward.name if pending_case.ward else 'Municipal Ward'}. "
                f"Our ward road contractor is being dispatched."
            )
            return {
                "status": "LOCATION_RESOLVED",
                "case_id": pending_case.id,
                "location_status": "RESOLVED",
                "reply_message": reply_message,
                "needs_reply": True
            }

        else:
            # Still incomplete
            mark_location_pending(db, pending_case, confidence=confidence)
            reply_message = cls._generate_reply_text(channel, pending_case, loc_status, confidence, landmark)
            return {
                "status": "LOCATION_STILL_PENDING",
                "case_id": pending_case.id,
                "location_status": loc_status,
                "reply_message": reply_message,
                "needs_reply": True
            }

    @staticmethod
    def _generate_reply_text(
        channel: str,
        case: Case,
        loc_status: str,
        confidence: float,
        landmark: Optional[str]
    ) -> str:
        """
        Generates standard reply prompts for WhatsApp or Reddit.
        """
        if channel == "WHATSAPP":
            if loc_status == "RESOLVED":
                return (
                    f"✅ Thank you! Your pothole complaint has been registered.\n\n"
                    f"📍 Case ID: {case.id}\n"
                    f"🏛️ Ward: {case.ward.name if case.ward else 'Municipal Area'}\n"
                    f"📌 Landmark: {landmark or 'GPS Verified'}\n\n"
                    f"Our municipal contractor will inspect and repair the site."
                )
            elif loc_status == "NEEDS_CLARIFICATION":
                return (
                    f"📍 Case #{case.id} recorded, but the location is ambiguous near {landmark or 'this area'}. "
                    f"Please tap 📎 and share your exact Live Location or reply with a nearby street landmark."
                )
            else:
                return (
                    f"Thanks for reporting this defect! We couldn't identify the exact location. "
                    f"Please tap 📎 and share your Live Location so we can dispatch the road contractor."
                )
        else:  # REDDIT
            if loc_status == "RESOLVED":
                return (
                    f"Hi u/{case.source_username}, CivicFix AI has registered this report as Case **#{case.id}** "
                    f"in {case.ward.name if case.ward else 'Municipal Ward'}. Track progress at: https://civicfix.city/track/{case.id}"
                )
            else:
                return (
                    f"Hi u/{case.source_username}, we detected your pothole report (Case **#{case.id}**), but couldn't identify the exact location. "
                    f"Please reply with:\n• Google Maps link\n• Nearby landmark\n• Road name"
                )

    @classmethod
    def dispatch_resolution_notification(
        cls,
        db: Session,
        case_id: str,
        overall_score: float,
        comparison_image_url: str,
        summary: str = ""
    ) -> Dict[str, Any]:
        """
        Idempotent notification dispatcher called once AI Verification passes.
        Notifies original Reddit post or WhatsApp user with repair proof.
        """
        case = db.query(Case).filter(Case.id == case_id).first()
        if not case:
            return {"status": "ERROR", "detail": f"Case {case_id} not found."}

        # Assert notification idempotency
        if case.notification_sent:
            logger.info(f"Notification already sent for case {case_id}. Skipping.")
            return {"status": "SKIPPED", "detail": "Notification already dispatched."}

        channel = (case.channel or "PORTAL").upper()
        if channel not in ["WHATSAPP", "REDDIT"]:
            # Standard citizen portal notification
            case.notification_sent = True
            case.last_notification_platform = "PORTAL"
            case.last_notification_at = datetime.utcnow()
            case.last_notification_status = "DELIVERED"
            db.commit()
            return {"status": "DELIVERED", "platform": "PORTAL"}

        notification_text = (
            f"🎉 Issue Resolved & AI-Verified!\n"
            f"Case #{case.id} has been repaired.\n"
            f"Verification Score: {overall_score * 100:.1f}%\n"
            f"View before/after comparison: {comparison_image_url}"
        )

        delivery_status = "DELIVERED"
        # 1. Dispatch platform-specific message
        if channel == "WHATSAPP":
            if settings.WHATSAPP_ACCESS_TOKEN and settings.WHATSAPP_PHONE_NUMBER_ID and case.source_id:
                phone = case.source_id.replace("wa-", "").replace("+", "")
                try:
                    import httpx
                    url = f"https://graph.facebook.com/v20.0/{settings.WHATSAPP_PHONE_NUMBER_ID}/messages"
                    headers = {
                        "Authorization": f"Bearer {settings.WHATSAPP_ACCESS_TOKEN}",
                        "Content-Type": "application/json",
                    }
                    payload = {
                        "messaging_product": "whatsapp",
                        "to": phone,
                        "type": "text",
                        "text": {"body": notification_text}
                    }
                    with httpx.Client(timeout=5.0) as client:
                        client.post(url, json=payload, headers=headers)
                except Exception as e:
                    logger.error(f"Failed to dispatch WhatsApp outbound resolution: {e}")
                    delivery_status = "FAILED"

        elif channel == "REDDIT":
            if settings.REDDIT_CLIENT_ID and settings.REDDIT_CLIENT_SECRET:
                try:
                    import praw
                    reddit = praw.Reddit(
                        client_id=settings.REDDIT_CLIENT_ID,
                        client_secret=settings.REDDIT_CLIENT_SECRET,
                        username=settings.REDDIT_USERNAME,
                        password=settings.REDDIT_PASSWORD,
                        user_agent=settings.REDDIT_USER_AGENT
                    )
                    if case.source_id:
                        submission = reddit.submission(id=case.source_id.replace("t3_", ""))
                        submission.reply(
                            f"🎉 **CivicFix AI Repair Update**:\n\n"
                            f"Hi u/{case.source_username}, the reported pothole (**#{case.id}**) has been successfully repaired and verified by our computer vision engine (Confidence: **{overall_score * 100:.1f}%**).\n\n"
                            f"Proof Comparison: [View Repair Artifact]({comparison_image_url})"
                        )
                except Exception as e:
                    logger.error(f"Failed to post Reddit resolution comment: {e}")
                    delivery_status = "FAILED"

        # Update case idempotency record
        case.notification_sent = True
        case.last_notification_platform = channel
        case.last_notification_at = datetime.utcnow()
        case.last_notification_status = delivery_status
        db.commit()

        return {
            "status": delivery_status,
            "case_id": case.id,
            "channel": channel,
            "notification_at": case.last_notification_at.isoformat()
        }
