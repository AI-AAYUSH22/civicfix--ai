# CivicFix AI — Architecture & Technical Design

## 1. System Overview

CivicFix AI verifies whether the **same pothole assigned in a municipal work order was actually repaired**.

```text
Citizen App ───────┐
Contractor App ────┼──→ FastAPI Gateway → PostgreSQL / SQLite
Municipal Web ─────┘                      ├→ Object Storage (Local/S3)
                                           └→ AI Verification Pipeline
                                                ├→ 1. GPS Proximity Verification
                                                ├→ 2. Perspective Alignment (Homography + RANSAC)
                                                ├→ 3. Peripheral Landmark Matching
                                                ├→ 4. Pothole State & Surface Analysis
                                                └→ 5. Cryptographic Evidence Integrity
                                                      ↓
                                                Deterministic Decision Engine
                                                      ↓
                                        VERIFIED / NEEDS_REVIEW / NOT_VERIFIED
```

---

## 2. Core Components

### 2.1 Backend (`backend/app`)
- **FastAPI**: REST API service handling authentication, case intake, work order lifecycle, evidence uploads, and verification triggers.
- **SQLAlchemy ORM**: Relational models mapping users, wards, roads, contractors, cases, locations, work orders, evidence files, and verification results.
- **State Machine**: Enforces strict operational transitions (`REPORTED` -> `VALIDATED` -> `ASSIGNED` -> `REPAIRING` -> `VERIFICATION` -> `VERIFIED` / `NEEDS_REVIEW` -> `CLOSED`).

### 2.2 Computer Vision Verification Pipeline (`backend/app/verification`)
- **GPS Check**: Calculates Haversine distance between assigned work order coordinates and capture coordinates. Configurable thresholds: PASS (< 15m), REVIEW (15-35m), FAIL (> 35m).
- **Perspective Consistency**: ORB/AKAZE keypoint extraction with Lowe's ratio test and RANSAC Homography estimation to confirm identical camera viewpoint.
- **Peripheral Landmark Check**: Masks out the repair zone to match stable street infrastructure (curbs, road paint, building edges, poles).
- **Pothole State Analysis**: Segment crater cavity in BEFORE image and verify cavity reduction and smooth asphalt restoration in AFTER image.
- **Evidence Integrity**: SHA-256 hash deduplication, timestamp sanity, and metadata anti-spoofing.

### 2.3 Frontend (`src/`)
- **React 18 + Vite + TypeScript + Tailwind CSS**: Multi-surface architecture serving:
  - **Citizen Portal**: Photo capture, GPS geofencing, complaint submission, and live status tracking.
  - **Contractor Mobile View**: Assigned work orders, platform viewfinder camera, and immediate AI verification feedback.
  - **Municipal Dashboard**: Ward operational overview, GIS map, case directory, and human verification review queue.
