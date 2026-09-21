import os
from typing import Dict, Any, List, Optional
from datetime import datetime
from app.verification.gps import verify_gps
from app.verification.perspective import verify_perspective
from app.verification.landmarks import verify_landmarks
from app.verification.pothole import analyze_pothole_state
from app.verification.integrity import verify_evidence_integrity

WEIGHTS = {
    "GPS": 0.25,
    "PERSPECTIVE": 0.25,
    "LANDMARK": 0.20,
    "POTHOLE": 0.20,
    "INTEGRITY": 0.10,
}

def evaluate_decision(checks: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Evaluates verification checks against deterministic anti-gaming rules.
    Yields VERIFIED_CLOSED (or VERIFIED for backward-compat), FLAGGED_ANOMALY / NOT_VERIFIED,
    or NEEDS_REVIEW for borderline cases.
    """
    total_score = 0.0
    check_statuses = {}
    fail_reasons = []
    review_reasons = []

    for c in checks:
        ctype = c["check_type"]
        weight = WEIGHTS.get(ctype, 0.20)
        total_score += c["score"] * weight
        status = c["status"]
        check_statuses[ctype] = status

        if status == "FAIL":
            fail_reasons.append(f"{ctype}: {c.get('details', {}).get('message', 'Check failed')}")
        elif status == "REVIEW":
            review_reasons.append(f"{ctype}: {c.get('details', {}).get('message', 'Flagged for review')}")

    total_score = round(total_score, 1)

    # Deterministic Rule 1: Integrity failure (reused/duplicate photo hash or illegal timestamps)
    if check_statuses.get("INTEGRITY") == "FAIL":
        decision_status = "FLAGGED_ANOMALY"
        summary = f"REJECTED & FLAGGED: Photographic evidence integrity compromised: {'; '.join(fail_reasons)}"
    # Deterministic Rule 2: GPS location mismatch (>35m from assigned location)
    elif check_statuses.get("GPS") == "FAIL":
        decision_status = "FLAGGED_ANOMALY"
        summary = f"REJECTED & FLAGGED: Severe geospatial mismatch: {'; '.join(fail_reasons)}"
    # Deterministic Rule 3: Pothole cavity still open or tarp spoofing detected
    elif check_statuses.get("POTHOLE") == "FAIL":
        decision_status = "NOT_VERIFIED"
        summary = f"REJECTED: Surface repair not detected or cavity remaining: {'; '.join(fail_reasons)}"
    # Deterministic Rule 4: Visual scene geometry & landmark SSIM both failed (completely different site)
    elif check_statuses.get("PERSPECTIVE") == "FAIL" and check_statuses.get("LANDMARK") == "FAIL":
        decision_status = "FLAGGED_ANOMALY"
        summary = "REJECTED & FLAGGED: Visual perspective and background SSIM completely mismatched (unrelated location)."
    # Deterministic Rule 5: Borderline score or single review flag
    elif len(review_reasons) > 0 or total_score < 72.0:
        decision_status = "NEEDS_REVIEW"
        summary = f"Flagged for Sub-Engineer Inspection (Score: {total_score}/100). Details: {'; '.join(review_reasons or fail_reasons)}"
    else:
        decision_status = "VERIFIED_CLOSED"
        summary = (
            f"Repair successfully verified by AI (Confidence: {total_score}/100). "
            f"SIFT homography aligned, CLAHE background SSIM passed, and asphalt leveling confirmed."
        )

    return {
        "overall_score": total_score,
        "status": decision_status,
        "summary": summary,
        "checks": checks
    }

def run_verification_pipeline(
    assigned_lat: float,
    assigned_lng: float,
    before_img_path: str,
    after_img_path: str,
    after_lat: float,
    after_lng: float,
    before_lat: Optional[float] = None,
    before_lng: Optional[float] = None,
    before_hash: Optional[str] = None,
    after_hash: Optional[str] = None,
    before_time: Optional[datetime] = None,
    after_time: Optional[datetime] = None,
) -> Dict[str, Any]:
    """
    Executes the hardened 5-stage verification pipeline and returns the decision engine outcome.
    """
    # 1. GPS Geofence Check
    gps_result = verify_gps(
        wo_lat=assigned_lat,
        wo_lng=assigned_lng,
        after_lat=after_lat,
        after_lng=after_lng,
        before_lat=before_lat,
        before_lng=before_lng
    )

    # 2. SIFT + Homography Perspective Check
    perspective_result = verify_perspective(before_img_path, after_img_path)

    # 3. CLAHE Light-Normalized Background SSIM Check
    landmark_result = verify_landmarks(before_img_path, after_img_path)

    # 4. Pothole Cavity & Canny Edge Volumetric Check
    pothole_result = analyze_pothole_state(before_img_path, after_img_path)

    # 5. Evidence Integrity Check (SHA-256 hash & timestamp chronology)
    integrity_result = verify_evidence_integrity(
        before_hash=before_hash,
        after_hash=after_hash,
        before_time=before_time,
        after_time=after_time
    )

    checks = [gps_result, perspective_result, landmark_result, pothole_result, integrity_result]
    return evaluate_decision(checks)
