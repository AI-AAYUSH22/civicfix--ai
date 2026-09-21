import pytest
from fastapi.testclient import TestClient
import io
from PIL import Image

from app.main import app

@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c

def _get_auth_headers(client, email, password):
    resp = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert resp.status_code == 200
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_health_endpoint(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_municipal_stats(client):
    headers = _get_auth_headers(client, "engineer@civicfix.ai", "Engineer@123")
    response = client.get("/api/v1/municipal/stats", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "totalActive" in data
    assert "pendingVerification" in data

def test_list_wards(client):
    response = client.get("/api/v1/municipal/wards")
    assert response.status_code == 200
    assert len(response.json()) > 0

def test_end_to_end_complaint_and_validation(client):
    citizen_headers = _get_auth_headers(client, "citizen@civicfix.ai", "Citizen@123")
    engineer_headers = _get_auth_headers(client, "engineer@civicfix.ai", "Engineer@123")
    contractor_headers = _get_auth_headers(client, "contractor@civicfix.ai", "Contractor@123")

    # 1. Citizen submits complaint
    payload = {
        "description": "Hazardous road pothole near school gate",
        "latitude": 19.0178,
        "longitude": 72.8478,
        "severity": "High",
        "landmark": "Near Victoria School",
        "address": "Dadar West"
    }
    create_resp = client.post("/api/v1/cases", data=payload, headers=citizen_headers)
    assert create_resp.status_code == 200
    case_data = create_resp.json()
    case_id = case_data["id"]
    assert case_data["status"] == "REPORTED"

    # 2. Municipal engineer validates case
    val_resp = client.patch(
        f"/api/v1/cases/{case_id}/validate",
        json={"action": "VALIDATE", "notes": "Verified by ward patrol."},
        headers=engineer_headers
    )
    assert val_resp.status_code == 200
    assert val_resp.json()["status"] == "VALIDATED"

    # 3. Municipal engineer creates work order
    contractors = client.get("/api/v1/municipal/contractors").json()
    assert len(contractors) > 0
    contractor_id = contractors[0]["id"]

    wo_resp = client.post(
        "/api/v1/work-orders",
        json={"case_id": case_id, "contractor_id": contractor_id, "priority": "High"},
        headers=engineer_headers
    )
    assert wo_resp.status_code == 200
    wo_data = wo_resp.json()
    wo_id = wo_data["id"]
    assert wo_data["status"] == "Assigned"

    # 4. Contractor submits BEFORE capture
    img_bytes = io.BytesIO()
    im = Image.new("RGB", (300, 300), color=(70, 70, 70))
    im.save(img_bytes, format="JPEG")
    img_bytes.seek(0)

    before_resp = client.post(
        "/api/v1/evidence/upload",
        data={"work_order_id": wo_id, "capture_type": "BEFORE", "latitude": 19.0178, "longitude": 72.8478},
        files={"file": ("before.jpg", img_bytes.getvalue(), "image/jpeg")},
        headers=contractor_headers
    )
    assert before_resp.status_code == 200
    assert before_resp.json()["case_status"] == "REPAIRING"

    # 5. Check timeline has recorded all actions
    timeline_resp = client.get(f"/api/v1/cases/{case_id}/timeline")
    assert timeline_resp.status_code == 200
    timeline = timeline_resp.json()
    actions = [item["action"] for item in timeline]
    assert "CASE_CREATED" in actions
    assert "CASE_VALIDATED" in actions
    assert "WORK_ORDER_ASSIGNED" in actions
    assert "BEFORE_EVIDENCE_CAPTURED" in actions
