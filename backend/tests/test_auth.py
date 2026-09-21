import uuid
from datetime import datetime, timedelta, timezone

import jwt
import pytest
from fastapi import Depends
from fastapi.testclient import TestClient

from app.api.deps import require_municipal
from app.core.config import settings
from app.core.security import create_access_token
from app.main import app
from app.models.user import UserRole

BASE = "/api/v1/auth"
CREDS = {
    "citizen": ("citizen@civicfix.ai", "Citizen@123"),
    "contractor": ("contractor@civicfix.ai", "Contractor@123"),
    "engineer": ("engineer@civicfix.ai", "Engineer@123"),
    "admin": ("admin@civicfix.ai", "Admin@123"),
}


@app.get("/_test/municipal", dependencies=[Depends(require_municipal)])
def _municipal_only():
    return {"ok": True}


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:  # runs lifespan -> seeding
        yield c


def _login(client, who):
    email, pw = CREDS[who]
    return client.post(f"{BASE}/login", json={"email": email, "password": pw})


def _headers(client, who):
    return {"Authorization": f"Bearer {_login(client, who).json()['access_token']}"}


def test_login_ok(client):
    r = _login(client, "citizen")
    assert r.status_code == 200
    body = r.json()
    assert body["token_type"] == "bearer" and body["access_token"]
    assert body["user"]["role"] == "CITIZEN"
    assert "password" not in str(body).lower()


def test_login_wrong_password(client):
    r = client.post(f"{BASE}/login", json={"email": CREDS["citizen"][0], "password": "nope"})
    assert r.status_code == 401


def test_login_unknown_email(client):
    r = client.post(f"{BASE}/login", json={"email": "ghost@x.com", "password": "whatever1"})
    assert r.status_code == 401


def test_swagger_form_login(client):
    email, pw = CREDS["engineer"]
    r = client.post(f"{BASE}/token", data={"username": email, "password": pw})
    assert r.status_code == 200 and r.json()["access_token"]


def test_me_without_token(client):
    assert client.get(f"{BASE}/users/me").status_code == 401


def test_me_ok(client):
    r = client.get(f"{BASE}/users/me", headers=_headers(client, "engineer"))
    assert r.status_code == 200 and r.json()["email"] == CREDS["engineer"][0]


def test_garbage_token(client):
    r = client.get(f"{BASE}/users/me", headers={"Authorization": "Bearer abc.def.ghi"})
    assert r.status_code == 401


def test_expired_token(client):
    tok = create_access_token(1, UserRole.CITIZEN, expires_delta=timedelta(seconds=-10))
    r = client.get(f"{BASE}/users/me", headers={"Authorization": f"Bearer {tok}"})
    assert r.status_code == 401


def test_wrong_signature(client):
    now = datetime.now(timezone.utc)
    tok = jwt.encode(
        {"sub": "1", "role": "ADMIN", "iat": now, "exp": now + timedelta(hours=1)},
        "some-other-key-that-is-long-enough-1234567890",
        algorithm=settings.ALGORITHM,
    )
    r = client.get(f"{BASE}/users/me", headers={"Authorization": f"Bearer {tok}"})
    assert r.status_code == 401


@pytest.mark.parametrize(
    "who,status_code",
    [("citizen", 403), ("contractor", 403), ("engineer", 200), ("admin", 200)],
)
def test_role_guard(client, who, status_code):
    r = client.get("/_test/municipal", headers=_headers(client, who))
    assert r.status_code == status_code


def test_role_guard_no_token(client):
    assert client.get("/_test/municipal").status_code == 401


def test_register_and_duplicate(client):
    email = f"{uuid.uuid4().hex[:8]}@example.com"
    payload = {"name": "New Citizen", "email": email, "password": "Str0ngPass!", "role": "ADMIN"}
    r = client.post(f"{BASE}/register", json=payload)
    assert r.status_code == 201
    assert r.json()["user"]["role"] == "CITIZEN"  # injected role ignored
    assert client.post(f"{BASE}/register", json=payload).status_code == 409
    assert client.post(f"{BASE}/login", json={"email": email, "password": "Str0ngPass!"}).status_code == 200