import pytest
import os
from datetime import datetime, timedelta

from app.core.config import settings
from app.verification.gps import verify_gps
from app.verification.integrity import verify_evidence_integrity
from app.verification.decision_engine import evaluate_decision, run_verification_pipeline
from app.seed.demo_data import create_synthetic_demo_images

@pytest.fixture(scope="module")
def demo_images():
    return create_synthetic_demo_images(settings.BASE_DIR)

def test_gps_verification_pass():
    # Lat/Lng difference within 5 meters
    result = verify_gps(
        wo_lat=19.0178,
        wo_lng=72.8478,
        after_lat=19.01783,
        after_lng=72.84782
    )
    assert result["status"] == "PASS"
    assert result["score"] >= 85.0
    assert result["distance_m"] < 15.0

def test_gps_verification_fail_mismatch():
    # Assigned in Dadar, captured 500m away
    result = verify_gps(
        wo_lat=19.0178,
        wo_lng=72.8478,
        after_lat=19.0230,
        after_lng=72.8520
    )
    assert result["status"] == "FAIL"
    assert result["score"] <= 50.0
    assert result["distance_m"] > 35.0

def test_evidence_integrity_duplicate_hash_fails():
    # Same hash submitted for BEFORE and AFTER (fraud attempt)
    result = verify_evidence_integrity(
        before_hash="abc123456",
        after_hash="abc123456",
        before_time=datetime.utcnow(),
        after_time=datetime.utcnow() + timedelta(minutes=30)
    )
    assert result["status"] == "FAIL"
    assert result["score"] == 0.0

def test_decision_engine_rules():
    # Case with GPS fail must yield NOT_VERIFIED
    checks = [
        {"check_type": "GPS", "status": "FAIL", "score": 20.0, "details": {"message": "Location mismatch"}},
        {"check_type": "PERSPECTIVE", "status": "PASS", "score": 90.0},
        {"check_type": "LANDMARK", "status": "PASS", "score": 90.0},
        {"check_type": "POTHOLE", "status": "PASS", "score": 95.0},
        {"check_type": "INTEGRITY", "status": "PASS", "score": 100.0},
    ]
    decision = evaluate_decision(checks)
    assert decision["status"] == "NOT_VERIFIED"

def test_full_pipeline_with_synthetic_images(demo_images):
    before_path = os.path.join(settings.BASE_DIR, demo_images["before"])
    after_path = os.path.join(settings.BASE_DIR, demo_images["after_verified"])

    result = run_verification_pipeline(
        assigned_lat=19.0178,
        assigned_lng=72.8478,
        before_img_path=before_path,
        after_img_path=after_path,
        after_lat=19.01782,
        after_lng=72.84781,
        before_lat=19.01780,
        before_lng=72.84780,
        before_hash="hash_b_1",
        after_hash="hash_a_2",
        before_time=datetime.utcnow() - timedelta(hours=2),
        after_time=datetime.utcnow()
    )
    assert result["status"] == "VERIFIED"
    assert result["overall_score"] >= 80.0
    assert len(result["checks"]) == 5

def test_pothole_still_present_fails(demo_images):
    # Tests the scenario where contractor captured AFTER image but didn't repair the cavity
    before_path = os.path.join(settings.BASE_DIR, demo_images["before"])
    after_path = os.path.join(settings.BASE_DIR, demo_images["after_unrepaired"])

    result = run_verification_pipeline(
        assigned_lat=19.0178,
        assigned_lng=72.8478,
        before_img_path=before_path,
        after_img_path=after_path,
        after_lat=19.01782,
        after_lng=72.84781,
        before_lat=19.01780,
        before_lng=72.84780,
        before_hash="hash_b_orig",
        after_hash="hash_a_unrepaired",
        before_time=datetime.utcnow() - timedelta(hours=2),
        after_time=datetime.utcnow()
    )
    # Decision engine MUST reject unrepaired potholes
    assert result["status"] == "NOT_VERIFIED"
    pothole_check = next(c for c in result["checks"] if c["check_type"] == "POTHOLE")
    assert pothole_check["status"] == "FAIL"

def test_different_camera_angle_triggers_review():
    # If perspective or landmarks are borderline (e.g. angle altered), decision engine flags for engineer review
    checks = [
        {"check_type": "GPS", "status": "PASS", "score": 90.0, "details": {"message": "GPS OK"}},
        {"check_type": "PERSPECTIVE", "status": "REVIEW", "score": 55.0, "details": {"message": "Camera angle varied"}},
        {"check_type": "LANDMARK", "status": "REVIEW", "score": 55.0, "details": {"message": "Partial landmarks"}},
        {"check_type": "POTHOLE", "status": "PASS", "score": 85.0, "details": {"message": "Filled"}},
        {"check_type": "INTEGRITY", "status": "PASS", "score": 100.0, "details": {"message": "Valid"}},
    ]
    decision = evaluate_decision(checks)
    assert decision["status"] == "NEEDS_REVIEW"

