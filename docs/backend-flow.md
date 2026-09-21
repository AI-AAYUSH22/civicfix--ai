# CivicFix AI — Backend API & Data Pipeline

## 1. API Endpoints Reference

### Cases (`/api/v1/cases`)
- `POST /`: Submit new complaint (multipart: photo, lat, lng, description, severity, landmark).
- `GET /`: List cases with optional filters (`status`, `ward_id`, `city`).
- `GET /my`: Fetch complaints submitted by logged-in citizen.
- `GET /{case_id}`: Detailed case record including location, evidence, and verification.
- `GET /{case_id}/timeline`: Chronological audit trail for the case.
- `PATCH /{case_id}/validate`: Engineer validation/rejection (`REPORTED` -> `VALIDATED` or `REJECTED`).

### Work Orders (`/api/v1/work-orders`)
- `POST /`: Create work order for validated case (`VALIDATED` -> `ASSIGNED`).
- `GET /`: List all work orders.
- `GET /my`: List work orders assigned to current contractor.
- `PATCH /{work_order_id}/status`: Update repair status.

### Evidence & Verification (`/api/v1/evidence` & `/api/v1/verification`)
- `POST /api/v1/evidence/upload`: Submit `BEFORE` or `AFTER` capture with live GPS coordinates. Submitting `AFTER` automatically executes the AI Verification Pipeline.
- `GET /api/v1/verification/{work_order_id}`: Fetch verification result and 5-check breakdown.
- `POST /api/v1/verification/{work_order_id}/review`: Ward engineer review (`decision`: `APPROVE` or `REJECT`).

### Municipal Operations (`/api/v1/municipal`)
- `GET /stats`: Real-time dashboard KPI counts.
- `GET /wards`: Ward jurisdiction list with pending counts.
- `GET /contractors`: Registered contractors list with ratings and active orders.
- `GET /audit-logs`: System audit trail feed.

---

## 2. State Transition Rules

| Initial State | Allowed Target State | Triggering Actor / Event |
|---|---|---|
| `REPORTED` | `VALIDATED`, `REJECTED`, `CLOSED` | Ward Engineer review |
| `VALIDATED` | `ASSIGNED` | Work Order creation |
| `ASSIGNED` | `REPAIRING` | Contractor captures BEFORE evidence |
| `REPAIRING` | `VERIFICATION` | Contractor captures AFTER evidence |
| `VERIFICATION` | `VERIFIED`, `NEEDS_REVIEW`, `NOT_VERIFIED` | AI Decision Engine |
| `NEEDS_REVIEW` | `VERIFIED`, `NOT_VERIFIED`, `REPAIRING` | Ward Engineer human review |
| `VERIFIED` | `CLOSED` | Case closure |
