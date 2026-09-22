import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.main import app
from app.models.case import Case, CaseLocation
from app.models.ward import Ward, Road
from app.models.conversation_state import ConversationState
from app.services.location_resolver import (
    extract_google_maps_coordinates,
    resolve_coordinates,
    needs_location_request,
    mark_location_resolved
)
from app.services.social_intake_service import SocialIntakeService

# Set up test database
TEST_DATABASE_URL = "sqlite:///:memory:"
test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(bind=test_engine)
    db = TestingSessionLocal()
    
    # Seed initial test ward and road
    ward = Ward(
        id="w07",
        name="Ward 7 - Bandra West",
        code="W07",
        city="Mumbai",
        center_lat=19.0596,
        center_lng=72.8295
    )
    db.add(ward)
    db.flush()

    road = Road(
        id="r01",
        name="Linking Road",
        ward_id=ward.id,
        road_type="Asphalt"
    )
    db.add(road)
    db.commit()


    yield db
    db.close()
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


# ==========================================
# 1. Google Maps & Location Resolver Unit Tests
# ==========================================

def test_extract_google_maps_coordinates():
    # URL with @lat,lng
    text1 = "Look at this pothole https://maps.google.com/@19.0596,72.8295,17z dangerous crater"
    coords1 = extract_google_maps_coordinates(text1)
    assert coords1 is not None
    assert coords1 == pytest.approx((19.0596, 72.8295))

    # URL with query ?q=lat,lng
    text2 = "Check location https://maps.google.com/maps?q=19.1136,72.8697"
    coords2 = extract_google_maps_coordinates(text2)
    assert coords2 is not None
    assert coords2 == pytest.approx((19.1136, 72.8697))

    # No URL in text
    text3 = "Pothole near Bandra station"
    coords3 = extract_google_maps_coordinates(text3)
    assert coords3 is None


def test_location_resolver_deterministic_waterfall():
    # Tier 1: Live GPS Pin
    res_tier1 = resolve_coordinates("Bad road", location_pin=(19.0596, 72.8295))
    assert res_tier1["tier"] == 1
    assert res_tier1["confidence"] == 1.00
    assert res_tier1["location_status"] == "RESOLVED"
    assert res_tier1["strategy"] == "LIVE_GPS_PIN"

    # Tier 2: Google Maps Link in text
    res_tier2 = resolve_coordinates("Pothole at https://maps.google.com/?q=19.1904,72.9723")
    assert res_tier2["tier"] == 2
    assert res_tier2["confidence"] == 0.95
    assert res_tier2["location_status"] == "RESOLVED"

    # Tier 3: Geocoded Municipal Zone (High confidence keyword)
    res_tier3 = resolve_coordinates("Dangerous pothole on Linking Road near Starbucks Bandra")
    assert res_tier3["tier"] == 3
    assert res_tier3["confidence"] >= 0.75
    assert "Bandra" in res_tier3["address"]

    # Tier 4: Unverified text fallback
    res_tier4 = resolve_coordinates("There is a bump somewhere on my road")
    assert res_tier4["tier"] == 4
    assert res_tier4["confidence"] < 0.50
    assert res_tier4["location_status"] == "PENDING"
    assert needs_location_request(res_tier4["confidence"]) == "REQUEST_LOCATION"


# ==========================================
# 2. Social Intake Service Integration Tests
# ==========================================

def test_social_intake_submission_with_gps(db_session):
    result = SocialIntakeService.ingest_submission(
        db=db_session,
        channel="WHATSAPP",
        source_id="wa-919876543210",
        username="Citizen Jane",
        text="Deep crater after heavy rain",
        location_pin=(19.0596, 72.8295)
    )

    assert result["status"] == "CREATED"
    assert result["location_status"] == "RESOLVED"
    assert result["location_confidence"] == 1.00

    # Verify database record
    case = db_session.query(Case).filter(Case.id == result["case_id"]).first()
    assert case is not None
    assert case.channel == "WHATSAPP"
    assert case.source_id == "wa-919876543210"
    assert case.location_status == "RESOLVED"
    assert case.location.latitude == pytest.approx(19.0596)
    assert case.ward_id == "w07"


def test_social_intake_deduplication(db_session):
    # First submission
    res1 = SocialIntakeService.ingest_submission(
        db=db_session,
        channel="REDDIT",
        source_id="reddit_t3_abc123",
        username="u/commuter",
        text="Huge pothole on Linking Road Bandra",
        source_url="https://reddit.com/r/mumbai/comments/abc123"
    )
    assert res1["status"] == "CREATED"

    # Duplicate submission with same source_id
    res2 = SocialIntakeService.ingest_submission(
        db=db_session,
        channel="REDDIT",
        source_id="reddit_t3_abc123",
        username="u/commuter",
        text="Duplicate post"
    )
    assert res2["status"] == "DUPLICATE"
    assert res2["case_id"] == res1["case_id"]


def test_multi_turn_whatsapp_conversation_flow(db_session):
    # Step 1: User sends text without location
    res1 = SocialIntakeService.ingest_submission(
        db=db_session,
        channel="WHATSAPP",
        source_id="wa-919111222333",
        username="John Doe",
        text="Pothole damaged my tire please fix"
    )
    assert res1["status"] == "CREATED"
    assert res1["location_status"] == "PENDING"

    conv_state = db_session.query(ConversationState).filter(
        ConversationState.user_identifier == "wa-919111222333"
    ).first()
    assert conv_state is not None

    assert conv_state.current_step == "WAITING_LOCATION"
    assert conv_state.active_case_id == res1["case_id"]

    # Step 2: User responds with live location pin
    res2 = SocialIntakeService.ingest_followup(
        db=db_session,
        channel="WHATSAPP",
        source_id="wa-919111222333",
        username="John Doe",
        text="Here is the location pin",
        location_pin=(19.0596, 72.8295)
    )
    assert res2["status"] == "LOCATION_RESOLVED"
    assert res2["case_id"] == res1["case_id"]

    # Verify updated case
    case = db_session.query(Case).filter(Case.id == res1["case_id"]).first()
    assert case.location_status == "RESOLVED"
    assert case.location.latitude == pytest.approx(19.0596)
    assert conv_state.current_step == "COMPLETED"


def test_notification_idempotency(db_session):
    res = SocialIntakeService.ingest_submission(
        db=db_session,
        channel="WHATSAPP",
        source_id="wa-919999888777",
        username="Alice",
        text="Pothole near Bandra",
        location_pin=(19.0596, 72.8295)
    )
    case_id = res["case_id"]

    # First dispatch
    disp1 = SocialIntakeService.dispatch_resolution_notification(
        db=db_session,
        case_id=case_id,
        overall_score=0.92,
        comparison_image_url="/uploads/comp_123.jpg"
    )
    assert disp1["status"] in ["DELIVERED", "FAILED"]

    case = db_session.query(Case).filter(Case.id == case_id).first()
    assert case.notification_sent is True

    # Second dispatch should be safely skipped (idempotent)
    disp2 = SocialIntakeService.dispatch_resolution_notification(
        db=db_session,
        case_id=case_id,
        overall_score=0.92,
        comparison_image_url="/uploads/comp_123.jpg"
    )
    assert disp2["status"] == "SKIPPED"


# ==========================================
# 3. Social API Endpoints Tests
# ==========================================

def test_social_api_endpoints(client, db_session):
    # Ingest a pending case
    SocialIntakeService.ingest_submission(
        db=db_session,
        channel="REDDIT",
        source_id="reddit_test_001",
        username="u/reporter",
        text="Unspecified road has a crater"
    )

    # 1. GET /api/v1/social/pending-location
    resp1 = client.get("/api/v1/social/pending-location")
    assert resp1.status_code == 200
    pending_list = resp1.json()
    assert len(pending_list) >= 1
    target_case_id = pending_list[0]["id"]

    # 2. POST /api/v1/social/resolve-location/{id} via Google Maps URL
    resp2 = client.post(
        f"/api/v1/social/resolve-location/{target_case_id}",
        json={
            "google_maps_url": "https://maps.google.com/?q=19.0596,72.8295",
            "landmark": "Near Linking Road Junction"
        }
    )
    assert resp2.status_code == 200
    res2_data = resp2.json()
    assert res2_data["status"] == "SUCCESS"
    assert res2_data["location_status"] == "RESOLVED"
    assert res2_data["latitude"] == pytest.approx(19.0596)

    # 3. GET /api/v1/social/location-status/{id}
    resp3 = client.get(f"/api/v1/social/location-status/{target_case_id}")
    assert resp3.status_code == 200
    res3_data = resp3.json()
    assert res3_data["location_status"] == "RESOLVED"
    assert res3_data["ward_id"] == "w07"

    # 4. GET /api/v1/social/reddit-health
    resp4 = client.get("/api/v1/social/reddit-health")
    assert resp4.status_code == 200
    assert "monitored_subreddits" in resp4.json()

    # 5. GET /api/v1/social/whatsapp-health
    resp5 = client.get("/api/v1/social/whatsapp-health")
    assert resp5.status_code == 200
    assert "twilio_webhook_endpoint" in resp5.json()
