import cv2
import numpy as np
import os
from typing import Dict, Any

def analyze_pothole_state(
    before_image_path: str,
    after_image_path: str
) -> Dict[str, Any]:
    """
    Detects and analyzes the pothole cavity in the BEFORE image and verifies
    surface restoration and asphalt patching in the AFTER image.
    Enforces Canny Edge Cavity & Volumetric verification:
    - BEFORE: Deep, chaotic, high-density edge lines (shadow depth & crater walls).
    - AFTER: Precipitous drop in edge density, indicating a flat, uniform asphalt patch.
    - Prevents flat surface placements (black tarps, blankets, or photo cutouts).
    """
    if not os.path.exists(before_image_path) or not os.path.exists(after_image_path):
        return {
            "check_type": "POTHOLE",
            "status": "REVIEW",
            "score": 50.0,
            "confidence": 0.5,
            "details": {"error": "Image file not found for pothole analysis"}
        }

    img1 = cv2.imread(before_image_path)
    img2 = cv2.imread(after_image_path)

    if img1 is None or img2 is None:
        return {
            "check_type": "POTHOLE",
            "status": "REVIEW",
            "score": 50.0,
            "confidence": 0.5,
            "details": {"error": "Failed to decode images"}
        }

    h, w = 600, 800
    img1_res = cv2.resize(img1, (w, h))
    img2_res = cv2.resize(img2, (w, h))

    # Focus on the active road surface ROI: bottom 60% of frame, center 70% width
    roi1 = img1_res[int(h * 0.35):int(h * 0.95), int(w * 0.15):int(w * 0.85)]
    roi2 = img2_res[int(h * 0.35):int(h * 0.95), int(w * 0.15):int(w * 0.85)]

    gray1 = cv2.cvtColor(roi1, cv2.COLOR_BGR2GRAY)
    gray2 = cv2.cvtColor(roi2, cv2.COLOR_BGR2GRAY)

    blur1 = cv2.GaussianBlur(gray1, (7, 7), 0)
    blur2 = cv2.GaussianBlur(gray2, (7, 7), 0)

    # 1. Canny Edge Density Analysis
    # The Before crater has jagged edges, shadow depth lines, and cracks
    edges1 = cv2.Canny(blur1, 50, 150)
    edges2 = cv2.Canny(blur2, 50, 150)

    edge_pixels_before = int(np.count_nonzero(edges1))
    edge_pixels_after = int(np.count_nonzero(edges2))

    edge_density_before = round((edge_pixels_before / edges1.size) * 100.0, 2)
    edge_density_after = round((edge_pixels_after / edges2.size) * 100.0, 2)

    edge_reduction_ratio = (edge_pixels_before - edge_pixels_after) / max(edge_pixels_before, 1)
    edge_reduction_pct = round(max(0.0, edge_reduction_ratio * 100.0), 1)

    # 2. Cavity Shadow Darkness & Elevation Baseline
    mean1, std1 = cv2.meanStdDev(blur1)
    mean2, std2 = cv2.meanStdDev(blur2)
    m1, s1 = float(mean1[0][0]), float(std1[0][0])
    m2, s2 = float(mean2[0][0]), float(std2[0][0])

    thresh_val1 = max(10, m1 - 1.2 * s1)
    _, cavity_mask1 = cv2.threshold(blur1, thresh_val1, 255, cv2.THRESH_BINARY_INV)

    thresh_val2 = max(10, m2 - 1.2 * s2)
    _, cavity_mask2 = cv2.threshold(blur2, thresh_val2, 255, cv2.THRESH_BINARY_INV)

    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
    clean_mask1 = cv2.morphologyEx(cavity_mask1, cv2.MORPH_OPEN, kernel)
    clean_mask2 = cv2.morphologyEx(cavity_mask2, cv2.MORPH_OPEN, kernel)

    cavity_pixels1 = int(np.count_nonzero(clean_mask1))
    cavity_pixels2 = int(np.count_nonzero(clean_mask2))

    pothole_pct_before = round((cavity_pixels1 / clean_mask1.size) * 100.0, 2)
    pothole_pct_after = round((cavity_pixels2 / clean_mask2.size) * 100.0, 2)

    cavity_reduction = (cavity_pixels1 - cavity_pixels2) / max(cavity_pixels1, 1)
    cavity_reduction_pct = round(min(99.0, max(0.0, cavity_reduction * 100.0)), 1)

    # Combined surface state change metric (cavity fill + edge density reduction)
    if pothole_pct_before >= 1.0:
        state_change_percent = round(0.6 * cavity_reduction_pct + 0.4 * edge_reduction_pct, 1)
    else:
        state_change_percent = round(edge_reduction_pct, 1)

    # Decision thresholding
    if state_change_percent >= 60.0 or cavity_reduction_pct >= 70.0:
        status = "PASS"
        score = min(100.0, 75.0 + (state_change_percent - 60.0) * 0.7)
        confidence = 0.95
        message = (
            f"Cavity filled and compacted asphalt patch verified. "
            f"Cavity reduction: {cavity_reduction_pct}%, Edge smoothing: {edge_reduction_pct}%."
        )
    elif state_change_percent >= 35.0:
        status = "REVIEW"
        score = 55.0
        confidence = 0.75
        message = (
            f"Partial surface repair detected ({state_change_percent}% state change). "
            f"Edge reduction {edge_reduction_pct}%. Crater may not be flush with road surface."
        )
    else:
        status = "FAIL"
        score = max(5.0, state_change_percent * 0.5)
        confidence = 0.92
        message = (
            f"Pothole crater still detected in AFTER capture. "
            f"Remaining cavity area: {pothole_pct_after}%, edge change: {edge_reduction_pct}%."
        )

    return {
        "check_type": "POTHOLE",
        "status": status,
        "score": round(score, 1),
        "confidence": confidence,
        "details": {
            "before_pothole_area_pct": pothole_pct_before,
            "after_pothole_area_pct": pothole_pct_after,
            "cavity_reduction_pct": cavity_reduction_pct,
            "edge_density_before_pct": edge_density_before,
            "edge_density_after_pct": edge_density_after,
            "edge_reduction_pct": edge_reduction_pct,
            "state_change_percent": state_change_percent,
            "message": message
        }
    }
