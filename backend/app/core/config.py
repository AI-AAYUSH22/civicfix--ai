import os
import json
from typing import List

from dotenv import load_dotenv

# backend/app/core/config.py -> backend/ -> project root
_BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
_ROOT_DIR = os.path.dirname(_BACKEND_DIR)

# Load .env from project root, then backend/ (doesn't override real env vars)
load_dotenv(os.path.join(_ROOT_DIR, ".env"))
load_dotenv(os.path.join(_BACKEND_DIR, ".env"))


def _require_secret_key() -> str:
    key = os.getenv("SECRET_KEY", "")
    if len(key) < 32 or key == "change-me":
        raise RuntimeError(
            "SECRET_KEY is missing or too weak. Generate one with: "
            'python -c "import secrets; print(secrets.token_urlsafe(64))" '
            "and set it in your .env"
        )
    return key


class Settings:
    API_V1_STR: str = os.getenv("API_V1_STR", "/api/v1")
    PROJECT_NAME: str = os.getenv("PROJECT_NAME", "CivicFix AI")

    # SQLite local default, seamlessly upgraded to PostgreSQL + PostGIS via env
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./civicfix.db")

    # --- Auth / JWT ---
    SECRET_KEY: str = _require_secret_key()  # no insecure default on purpose
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

    BASE_DIR: str = _BACKEND_DIR
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", os.path.join(BASE_DIR, "uploads"))

    # CORS
    raw_cors = os.getenv(
        "BACKEND_CORS_ORIGINS",
        '["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", "http://localhost:8000"]',
    )
    try:
        BACKEND_CORS_ORIGINS: List[str] = (
            json.loads(raw_cors) if isinstance(raw_cors, str) and raw_cors.startswith("[") else ["*"]
        )
    except Exception:
        BACKEND_CORS_ORIGINS: List[str] = ["*"]

    # Verification Engine Thresholds
    GPS_PASS_DISTANCE_METERS: float = float(os.getenv("GPS_PASS_DISTANCE_METERS", "15.0"))
    GPS_REVIEW_DISTANCE_METERS: float = float(os.getenv("GPS_REVIEW_DISTANCE_METERS", "35.0"))
    HOMOGRAPHY_INLIER_MIN: int = int(os.getenv("HOMOGRAPHY_INLIER_MIN", "10"))
    POTHOLE_REPAIRED_THRESHOLD: float = float(os.getenv("POTHOLE_REPAIRED_THRESHOLD", "0.65"))


settings = Settings()
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)