# CivicFix AI — Verification Engine Deep Dive

The CivicFix verification pipeline resolves the critical civic-tech challenge: **guaranteeing the same assigned pothole was actually repaired**, preventing false claims, reused photos, and incorrect repair locations.

---

## 1. Pipeline Architecture

```text
BEFORE Capture (Image + GPS + Timestamp)
                 +
AFTER Capture (Image + GPS + Timestamp)
                 +
Assigned Work Order GPS
                 ↓
┌────────────────────────────────────────────────────────┐
│ 1. GPS Proximity Verification (Haversine Distance)      │
├────────────────────────────────────────────────────────┤
│ 2. Perspective Alignment (OpenCV ORB + Homography)     │
├────────────────────────────────────────────────────────┤
│ 3. Peripheral Landmark Matching (Background Masking)   │
├────────────────────────────────────────────────────────┤
│ 4. Pothole State Analysis (Cavity Reduction & Texture) │
├────────────────────────────────────────────────────────┤
│ 5. Cryptographic Evidence Integrity (SHA-256 & Exif)   │
└────────────────────────────────────────────────────────┘
                 ↓
      Multi-Factor Decision Engine
                 ↓
   VERIFIED / NEEDS_REVIEW / NOT_VERIFIED
```

---

## 2. Check Specifications

### Check 1: GPS Proximity Verification (`gps.py`)
- Calculates the great-circle distance between the assigned work order coordinates and the contractor's capture coordinates.
- **PASS**: distance $\le$ 15.0m (Score 85–100%).
- **REVIEW**: 15.0m $<$ distance $\le$ 35.0m (Score 50–85%).
- **FAIL**: distance $>$ 35.0m (Score $\le$ 50% - Location Mismatch).

### Check 2: Perspective Alignment (`perspective.py`)
- Extracts keypoint descriptors using OpenCV ORB (1500 features).
- Matches descriptors via KNN with Lowe's ratio test ($0.78$).
- Computes Homography with RANSAC ($5.0$ pixel threshold).
- Evaluates inliers count and inlier ratio to verify consistent viewpoint.

### Check 3: Peripheral Landmark Matching (`landmarks.py`)
- Masks the central road surface where the repair occurs.
- Evaluates keypoints and Canny edge structures in the surrounding perimeter (curbs, road paint, poles, buildings).
- Confirms the repair took place in the identical physical surroundings.

### Check 4: Pothole State Analysis (`pothole.py`)
- Focuses on the road asphalt ROI.
- Evaluates dark cavity depth: pixel intensities below $(\mu - 1.2\sigma)$.
- Compares BEFORE crater area with AFTER leveled asphalt patch.
- Quantifies asphalt smoothing using Sobel variance reduction.
- **PASS**: Cavity reduction $\ge$ 65% with smoothed bitumen.
- **FAIL**: Crater remains visible in AFTER photo ($< 35\%$ reduction).

### Check 5: Evidence Integrity (`integrity.py`)
- Computes SHA-256 cryptographic hashes for both images.
- Rejects identical duplicate images submitted for BEFORE and AFTER.
- Verifies chronological ordering: AFTER timestamp $>$ BEFORE timestamp.

---

## 3. Decision Engine Logic

| Condition | Outcome | Rationale |
|---|---|---|
| Integrity Check FAIL (e.g. duplicate hash) | `NOT_VERIFIED` | Fraud alert: identical photo submitted. |
| GPS Check FAIL ($> 35$m) | `NOT_VERIFIED` | Contractor photographed the wrong site. |
| Pothole State FAIL | `NOT_VERIFIED` | Pothole crater remains open/unrepaired. |
| Perspective & Landmark FAIL | `NOT_VERIFIED` | Different street or physical location. |
| Borderline score ($< 72\%$) or any REVIEW check | `NEEDS_REVIEW` | Flagged for Ward Engineer human inspection. |
| All checks PASS (Score $\ge 72\%$) | `VERIFIED` | Repair automatically validated and approved. |
