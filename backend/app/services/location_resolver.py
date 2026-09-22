import re
import logging
from typing import Optional, Tuple, Dict, Any, List
from datetime import datetime
import httpx
from sqlalchemy.orm import Session

from app.models.case import Case, CaseLocation
from app.services.social_ingestion import parse_unstructured_social_post, KNOWN_MUNICIPAL_ZONES
from app.services.geo_service import find_nearest_ward_and_road

logger = logging.getLogger("civicfix.location_resolver")

# Confidence thresholds
CONFIDENCE_RESOLVED_MIN = 0.80
CONFIDENCE_CLARIFY_MIN = 0.50

# Regex patterns for Google Maps URLs
GOOGLE_MAPS_REGEX = re.compile(
    r'(https?://(?:maps\.google\.com|goo\.gl/maps|maps\.app\.goo\.gl)/[^\s]+)',
    re.IGNORECASE
)
COORDS_IN_URL_REGEX = re.compile(
    r'(?:@|q=|ll=|loc:)?(-?\d{1,2}\.\d{4,8}),\s*(-?\d{1,3}\.\d{4,8})'
)


async def unshorten_url(url: str) -> str:
    """Follows HTTP 301/302 redirects to retrieve the canonical destination URL."""
    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=5.0) as client:
            resp = await client.head(url)
            return str(resp.url)
    except Exception as e:
        logger.warning(f"Could not unshorten URL {url}: {e}")
        return url


def extract_google_maps_coordinates(text: str) -> Optional[Tuple[float, float]]:
    """
    Synchronously extracts latitude and longitude from Google Maps URLs embedded in text.
    Handles standard URL structures with coordinates in query parameters or path segments.
    """
    match = GOOGLE_MAPS_REGEX.search(text)
    if not match:
        return None

    url = match.group(1)
    coord_match = COORDS_IN_URL_REGEX.search(url)
    if coord_match:
        try:
            lat = float(coord_match.group(1))
            lng = float(coord_match.group(2))
            if -90 <= lat <= 90 and -180 <= lng <= 180:
                return (lat, lng)
        except ValueError:
            pass

    return None


async def extract_google_maps_coordinates_async(text: str) -> Optional[Tuple[float, float]]:
    """
    Asynchronously extracts coordinates from Google Maps URLs, expanding shortlinks if necessary.
    """
    coords = extract_google_maps_coordinates(text)
    if coords:
        return coords

    match = GOOGLE_MAPS_REGEX.search(text)
    if not match:
        return None

    short_url = match.group(1)
    expanded = await unshorten_url(short_url)
    coord_match = COORDS_IN_URL_REGEX.search(expanded)
    if coord_match:
        try:
            lat = float(coord_match.group(1))
            lng = float(coord_match.group(2))
            if -90 <= lat <= 90 and -180 <= lng <= 180:
                return (lat, lng)
        except ValueError:
            pass

    return None


def extract_landmark(text: str) -> Optional[str]:
    """
    Extracts landmark or street name referenced in user text.
    """
    landmark_match = re.search(
        r'(?:near|past|opposite|opp\.|at|behind|front of|junction of)\s+([a-zA-Z0-9\s,\.\-#]+?)(?:\.|$|and|near|in|\n)',
        text,
        re.IGNORECASE
    )
    if landmark_match:
        return landmark_match.group(1).strip()
    return None


def resolve_coordinates(
    raw_text: str,
    location_pin: Optional[Tuple[float, float]] = None,
    channel: str = "WHATSAPP"
) -> Dict[str, Any]:
    """
    Deterministic 4-Tier Waterfall Location Resolver:
    1. Tier 1: Live GPS Pin -> Confidence = 1.00 (Status: RESOLVED)
    2. Tier 2: Google Maps URL -> Confidence = 0.95 (Status: RESOLVED)
    3. Tier 3: Geocoded Landmark / Known Municipal Zone -> Confidence = 0.60 - 0.88
       (If >= 0.80 -> RESOLVED, else NEEDS_CLARIFICATION)
    4. Tier 4: Unverified Text Fallback -> Confidence = 0.40 (Status: PENDING)
    """
    # Tier 1: Live GPS Pin
    if location_pin and location_pin[0] != 0.0 and location_pin[1] != 0.0:
        lat, lng = location_pin
        landmark = extract_landmark(raw_text) or "Live GPS Pin"
        return {
            "latitude": lat,
            "longitude": lng,
            "landmark": landmark,
            "address": f"GPS Pin ({lat:.4f}, {lng:.4f})",
            "confidence": 1.00,
            "tier": 1,
            "strategy": "LIVE_GPS_PIN",
            "location_status": "RESOLVED",
        }

    # Tier 2: Google Maps Link in text
    maps_coords = extract_google_maps_coordinates(raw_text)
    if maps_coords:
        lat, lng = maps_coords
        landmark = extract_landmark(raw_text) or "Google Maps Pin"
        return {
            "latitude": lat,
            "longitude": lng,
            "landmark": landmark,
            "address": f"Google Maps Pin ({lat:.4f}, {lng:.4f})",
            "confidence": 0.95,
            "tier": 2,
            "strategy": "GOOGLE_MAPS_LINK",
            "location_status": "RESOLVED",
        }

    # Tier 3 & Tier 4: Fallback to NER and Known Municipal Zones
    ner_result = parse_unstructured_social_post(raw_text, channel=channel)
    confidence = ner_result.get("confidence_score", 0.40)
    landmark = ner_result.get("landmark") or extract_landmark(raw_text) or "Unspecified Street"
    neighborhood = ner_result.get("neighborhood", "Unverified Municipal Zone")

    if confidence >= CONFIDENCE_RESOLVED_MIN:
        loc_status = "RESOLVED"
        tier = 3
        strategy = "GEOCODED_MUNICIPAL_ZONE"
    elif confidence >= CONFIDENCE_CLARIFY_MIN:
        loc_status = "NEEDS_CLARIFICATION"
        tier = 3
        strategy = "AMBIGUOUS_ZONE_MATCH"
    else:
        loc_status = "PENDING"
        tier = 4
        strategy = "UNVERIFIED_TEXT_FALLBACK"

    return {
        "latitude": ner_result.get("latitude", 19.0178),
        "longitude": ner_result.get("longitude", 72.8478),
        "landmark": landmark,
        "address": f"{neighborhood}, Mumbai",
        "ward_id": ner_result.get("ward_id", "w12"),
        "confidence": confidence,
        "tier": tier,
        "strategy": strategy,
        "location_status": loc_status,
    }


def needs_location_request(confidence: float) -> str:
    """
    Returns action required based on confidence score:
    - >= 0.80: RESOLVE (automatic proceed)
    - 0.50 - 0.79: CLARIFY (ask clarification)
    - < 0.50: REQUEST_LOCATION (request live location / link)
    """
    if confidence >= CONFIDENCE_RESOLVED_MIN:
        return "RESOLVE"
    elif confidence >= CONFIDENCE_CLARIFY_MIN:
        return "CLARIFY"
    return "REQUEST_LOCATION"


def find_pending_case_by_source(db: Session, channel: str, source_id: str) -> Optional[Case]:
    """
    Finds the most recent case with PENDING or NEEDS_CLARIFICATION location status
    for a given channel and source_id.
    """
    return (
        db.query(Case)
        .filter(
            Case.channel == channel.upper(),
            Case.source_id == source_id,
            Case.location_status.in_(["PENDING", "NEEDS_CLARIFICATION"]),
        )
        .order_by(Case.created_at.desc())
        .first()
    )


def mark_location_pending(db: Session, case: Case, confidence: float = 0.40):
    """
    Marks a case's location sub-state as PENDING.
    """
    case.location_status = "PENDING"
    case.location_confidence = confidence
    case.location_requested_at = datetime.utcnow()
    db.commit()


def mark_location_resolved(
    db: Session,
    case: Case,
    lat: float,
    lng: float,
    landmark: Optional[str] = None,
    address: Optional[str] = None,
    confidence: float = 1.00
):
    """
    Marks a case's location sub-state as RESOLVED, updates CaseLocation,
    and maps the case to the nearest municipal ward and road.
    """
    case.location_status = "RESOLVED"
    case.location_confidence = confidence
    case.location_resolved_at = datetime.utcnow()

    # Map to nearest ward and road
    ward, road = find_nearest_ward_and_road(db, lat, lng)
    if ward:
        case.ward_id = ward.id
    if road:
        case.road_id = road.id

    if case.location:
        case.location.latitude = lat
        case.location.longitude = lng
        if landmark:
            case.location.landmark = landmark
        if address:
            case.location.address = address
    else:
        loc = CaseLocation(
            case_id=case.id,
            latitude=lat,
            longitude=lng,
            landmark=landmark,
            address=address or f"Coordinates ({lat:.4f}, {lng:.4f})"
        )
        db.add(loc)

    db.commit()
    db.refresh(case)
