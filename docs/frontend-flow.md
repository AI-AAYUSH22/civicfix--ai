# CivicFix AI — Frontend Workflows & State Lifecycle

## 1. Multi-Surface Switcher
The top navigation bar provides instant switching between 4 distinct surfaces:
1. **Municipal Dashboard**: Ward operations, case management, and verification approval.
2. **Contractor Mobile**: Ground crew job board, platform camera, and AI verification results.
3. **Citizen Portal**: Complaint submission flow and live progress tracking.
4. **Design System Showcase**: Atomic design tokens, UI components, and badges.

---

## 2. Citizen Flow
```text
Citizen Portal
  ↓
"+ Report a Pothole Now" (Modal)
  ↓
Step 1: Description & Overview
  ↓
Step 2: Camera Viewfinder (Live Camera / File Upload)
  ↓
Step 3: GPS Geofence Lock (Latitude/Longitude + Street + Landmark)
  ↓
Step 4: Severity Selection (Low / Medium / High)
  ↓
Step 5: Submission & Real-time Case Registration (CF-XXXX)
  ↓
Citizen Tracks Case Timeline through Verification & Closure
```

---

## 3. Contractor Flow
```text
Contractor Mobile Surface
  ↓
Assigned Work Orders List (Filter by High, In Progress, Review)
  ↓
1. "Capture BEFORE" → In-App Viewfinder → Live Cryptographic Overlay → Upload
  (Case status transitions to REPAIRING)
  ↓
Asphalt Repair Executed On Ground
  ↓
2. "Capture AFTER" → In-App Viewfinder → Live Cryptographic Overlay → Upload
  (Case status transitions to VERIFICATION)
  ↓
Immediate AI Verification Drawer: Confidence Score, Check Matrix, and Status
```

---

## 4. Municipal Engineer Flow
```text
Municipal Dashboard
  ↓
Overview / Case Directory
  ↓
Validate Complaint (REPORTED → VALIDATED)
  ↓
Assign Contractor (VALIDATED → ASSIGNED + Work Order WO-XXXX)
  ↓
AI Verification Review Queue
  (Side-by-side BEFORE vs AFTER alignment with 5-check breakdown)
  ↓
Approve Repair (VERIFIED → CLOSED)  OR  Reject Evidence (Sent for rework)
```
