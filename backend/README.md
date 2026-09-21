# CivicFix AI — FastAPI Backend & Verification Engine

Backend service for CivicFix AI. Handles municipal case tracking, work order assignment, image evidence storage, and automated computer vision verification.

## Tech Stack
- Python 3.12
- FastAPI + Uvicorn
- SQLAlchemy + SQLite (PostgreSQL compatible)
- OpenCV (ORB, Homography, RANSAC, Sobel)
- NumPy, Pillow
- Pytest

## Setup & Run Locally

```bash
cd backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

The API docs are available at:
- Swagger UI: `http://localhost:8000/api/v1/docs`
- ReDoc: `http://localhost:8000/api/v1/redoc`

## Run Tests

```bash
python -m pytest tests -v
```
