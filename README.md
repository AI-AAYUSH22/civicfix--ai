# CivicFix AI — Municipal Pothole Verification Platform

CivicFix AI verifies whether the **same pothole assigned in a municipal work order was actually repaired**.

```text
Citizen Complaint → Municipal Validation → Work Order → Contractor
→ BEFORE Capture → Repair → AFTER Capture → Evidence Validation
→ AI Verification → VERIFIED / NEEDS REVIEW / NOT VERIFIED
→ Case Closure → Citizen Notification
```

---

## Architecture & Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, React-Leaflet, Lucide React, Framer Motion
- **Backend**: FastAPI, SQLAlchemy, Pydantic, Python 3.12
- **Database**: SQLite (local zero-setup) / PostgreSQL + PostGIS (via `DATABASE_URL`)
- **Computer Vision**: OpenCV (ORB feature extraction, RANSAC Homography, Sobel texture analysis)
- **Multi-Surface UI**: Citizen Portal, Contractor Mobile App, Municipal Dashboard, Design System

---

## Getting Started

### 1. Start FastAPI Backend

```bash
cd backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --port 8000
```
API Documentation: `http://localhost:8000/api/v1/docs`

### 2. Start Frontend Dev Server

```bash
npm install
npm run dev
```
Open `http://localhost:5174/` (or printed Vite URL).

### 3. Run Backend Tests

```bash
python -m pytest backend/tests -v
```

---

## Documentation

- [Architecture & Design](docs/architecture.md)
- [Frontend Workflow Guide](docs/frontend-flow.md)
- [Backend APIs & State Machine](docs/backend-flow.md)
- [Verification Engine Deep Dive](docs/verification.md)
