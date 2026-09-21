import re
from typing import Dict, Any, Optional

# Known Mumbai / Thane neighbourhoods and landmarks dictionary for fallback regex-based NER
KNOWN_MUNICIPAL_ZONES = [
    {"neighborhood": "Dadar West", "ward": "w12", "lat": 19.0178, "lng": 72.8478, "keywords": ["dadar", "gokhale road", "plaza cinema", "ranade road", "senapati bapat"]},
    {"neighborhood": "Bandra West", "ward": "w07", "lat": 19.0596, "lng": 72.8295, "keywords": ["bandra", "hill road", "linking road", "turner road", "pali hill", "starbucks"]},
    {"neighborhood": "Andheri East", "ward": "w18", "lat": 19.1136, "lng": 72.8697, "keywords": ["andheri", "sahar road", "chakala", "marol", "metro pillar", "jb nagar"]},
    {"neighborhood": "Kurla West", "ward": "w05", "lat": 19.0726, "lng": 72.8845, "keywords": ["kurla", "cst road", "kamani", "phoenix marketcity", "lbs marg"]},
    {"neighborhood": "Thane Naupada", "ward": "w03", "lat": 19.1904, "lng": 72.9723, "keywords": ["naupada", "thane", "gokhale road thane", "talao pali", "vandana cinema"]},
    {"neighborhood": "Ghodbunder Road", "ward": "w08", "lat": 19.2482, "lng": 72.9558, "keywords": ["ghodbunder", "kasarvadavali", "waghbil", "manpada", "brahmand"]},
]

def parse_unstructured_social_post(raw_text: str, channel: str = "REDDIT") -> Dict[str, Any]:
    """
    Pass 1: Named Entity Recognition (NER) & Contextual Parsing.
    Converts unstructured posts (Reddit r/mumbai or WhatsApp forwarded reports)
    into structured entities: Neighborhood, Landmark, Intersection, and Confidence_Score.
    """
    lower_text = raw_text.lower()

    matched_zone = None
    matched_keyword = None
    confidence = 0.50

    for zone in KNOWN_MUNICIPAL_ZONES:
        for kw in zone["keywords"]:
            if re.search(r'\b' + re.escape(kw) + r'\b', lower_text):
                matched_zone = zone
                matched_keyword = kw
                confidence = 0.88 if len(kw.split()) > 1 else 0.75
                break
        if matched_zone:
            break

    # Extract landmark if mentioned after "near", "past", "opp", "opposite", "at"
    landmark_match = re.search(r'(?:near|past|opposite|opp\.|at|behind)\s+([a-zA-Z0-9\s,\.]+?)(?:\.|$|and|near|in)', raw_text, re.IGNORECASE)
    landmark = landmark_match.group(1).strip() if landmark_match else None

    if matched_zone:
        return {
            "neighborhood": matched_zone["neighborhood"],
            "ward_id": matched_zone["ward"],
            "landmark": landmark or f"Near {matched_keyword.title()}",
            "latitude": matched_zone["lat"],
            "longitude": matched_zone["lng"],
            "confidence_score": confidence,
            "status": "GEOCODED_SUCCESS" if confidence >= 0.70 else "PENDING_VERIFICATION",
            "extracted_entities": {
                "channel": channel,
                "detected_keyword": matched_keyword,
                "raw_text": raw_text
            }
        }

    # Pass 2 Fallback: If entities are ambiguous or below 70% confidence, hold in PENDING_VERIFICATION
    return {
        "neighborhood": "Unverified Municipal Zone",
        "ward_id": "w12",  # default fallback
        "landmark": landmark or "Unspecified Street",
        "latitude": 19.0178,
        "longitude": 72.8478,
        "confidence_score": 0.45,
        "status": "PENDING_VERIFICATION",
        "extracted_entities": {
            "channel": channel,
            "detected_keyword": None,
            "raw_text": raw_text
        }
    }
