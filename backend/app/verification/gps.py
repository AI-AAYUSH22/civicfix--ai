from typing import Dict, Any, Optional
from app.core.config import settings
from app.services.geo_service import haversine_distance_meters

def verify_gps(
    wo_lat: float,
    wo_lng: float,
    after_lat: float,
    after_lng: float,
    before_lat: Optional[float] = None,
    before_lng: Optional[float] = None
) -> Dict[str, Any]:
    """
    Compares assigned work order GPS and AFTER capture GPS (and optional BEFORE capture GPS).
    Returns check result dictionary conforming to verification check schema.
    """
    distance_to_wo = haversine_distance_meters(wo_lat, wo_lng, after_lat, after_lng)
    
    distance_before_after = None
    if before_lat is not None and before_lng is not None:
        distance_before_after = haversine_distance_meters(before_lat, before_lng, after_lat, after_lng)

    pass_threshold = settings.GPS_PASS_DISTANCE_METERS
    review_threshold = settings.GPS_REVIEW_DISTANCE_METERS

    if distance_to_wo <= pass_threshold:
        status = "PASS"
        # Score scales linearly from 100 at 0m to 85 at pass_threshold
        score = max(85.0, 100.0 - (distance_to_wo / pass_threshold) * 15.0)
        confidence = 0.95
        message = f"Capture GPS is within {distance_to_wo:.1f}m of assigned location."
    elif distance_to_wo <= review_threshold:
        status = "REVIEW"
        score = max(50.0, 85.0 - ((distance_to_wo - pass_threshold) / (review_threshold - pass_threshold)) * 35.0)
        confidence = 0.80
        message = f"Capture GPS is {distance_to_wo:.1f}m away (threshold: {pass_threshold}m). Requires engineer review."
    else:
        status = "FAIL"
        score = max(10.0, 50.0 - (distance_to_wo - review_threshold) * 2.0)
        confidence = 0.95
        message = f"Location mismatch: Capture GPS is {distance_to_wo:.1f}m from assigned work order location."

    return {
        "check_type": "GPS",
        "status": status,
        "score": round(score, 1),
        "confidence": confidence,
        "distance_m": round(distance_to_wo, 2),
        "distance_before_after_m": round(distance_before_after, 2) if distance_before_after is not None else None,
        "details": {
            "assigned_gps": {"lat": wo_lat, "lng": wo_lng},
            "after_gps": {"lat": after_lat, "lng": after_lng},
            "distance_meters": round(distance_to_wo, 2),
            "threshold_pass": pass_threshold,
            "threshold_review": review_threshold,
            "message": message,
        }
    }
