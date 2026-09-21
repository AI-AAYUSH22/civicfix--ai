import os
import json
from typing import List

class Settings:
    API_V1_STR: str = os.getenv("API_V1_STR", "/api/v1")
    PROJECT_NAME: str = os.getenv("PROJECT_NAME", "CivicFix AI")
    
    # SQLite local default, seamlessly upgraded to PostgreSQL + PostGIS via env
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./civicfix.db")
    
    SECRET_KEY: str = os.getenv("SECRET_KEY", "civicfix-secret-key-change-in-production-2026-hackathon")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
    
    BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", os.path.join(BASE_DIR, "uploads"))
    
    # CORS
    raw_cors = os.getenv("BACKEND_CORS_ORIGINS", '["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", "http://localhost:8000"]')
    try:
        BACKEND_CORS_ORIGINS: List[str] = json.loads(raw_cors) if isinstance(raw_cors, str) and raw_cors.startswith("[") else ["*"]
    except Exception:
        BACKEND_CORS_ORIGINS: List[str] = ["*"]
        
    # Verification Engine Thresholds
    GPS_PASS_DISTANCE_METERS: float = float(os.getenv("GPS_PASS_DISTANCE_METERS", "15.0"))
    GPS_REVIEW_DISTANCE_METERS: float = float(os.getenv("GPS_REVIEW_DISTANCE_METERS", "35.0"))
    HOMOGRAPHY_INLIER_MIN: int = int(os.getenv("HOMOGRAPHY_INLIER_MIN", "10"))
    POTHOLE_REPAIRED_THRESHOLD: float = float(os.getenv("POTHOLE_REPAIRED_THRESHOLD", "0.65"))

settings = Settings()
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
