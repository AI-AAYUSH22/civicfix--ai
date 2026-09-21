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

    # Focus on the road surface ROI: bottom 60% of the frame, center 70% width
    roi1 = img1_res[int(h * 0.35):int(h * 0.95), int(w * 0.15):int(w * 0.85)]
    roi2 = img2_res[int(h * 0.35):int(h * 0.95), int(w * 0.15):int(w * 0.85)]

    gray1 = cv2.cvtColor(roi1, cv2.COLOR_BGR2GRAY)
    gray2 = cv2.cvtColor(roi2, cv2.COLOR_BGR2GRAY)

    blur1 = cv2.GaussianBlur(gray1, (9, 9), 0)
    blur2 = cv2.GaussianBlur(gray2, (9, 9), 0)

    # Calculate road surface baseline statistics
    mean1, std1 = cv2.meanStdDev(blur1)
    mean2, std2 = cv2.meanStdDev(blur2)
    m1, s1 = float(mean1[0][0]), float(std1[0][0])
    m2, s2 = float(mean2[0][0]), float(std2[0][0])

    # Cavity detection: pixels significantly darker than the road background
    # A true pothole crater has deep shadow cavity: pixel values < (mean - 1.2 * std)
    thresh_val1 = max(10, m1 - 1.2 * s1)
    _, cavity_mask1 = cv2.threshold(blur1, thresh_val1, 255, cv2.THRESH_BINARY_INV)

    thresh_val2 = max(10, m2 - 1.2 * s2)
    _, cavity_mask2 = cv2.threshold(blur2, thresh_val2, 255, cv2.THRESH_BINARY_INV)

    # Morphological cleanup (remove isolated noise specks)
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
    clean_mask1 = cv2.morphologyEx(cavity_mask1, cv2.MORPH_OPEN, kernel)
    clean_mask2 = cv2.morphologyEx(cavity_mask2, cv2.MORPH_OPEN, kernel)

    total_pixels = roi1.shape[0] * roi1.shape[1]
    cavity_pixels1 = int(np.count_nonzero(clean_mask1))
    cavity_pixels2 = int(np.count_nonzero(clean_mask2))

    pothole_pct_before = round((cavity_pixels1 / total_pixels) * 100.0, 2)
    pothole_pct_after = round((cavity_pixels2 / total_pixels) * 100.0, 2)

    # Edge texture / roughness in cavity region (Sobel gradient)
    sobel1 = cv2.Sobel(blur1, cv2.CV_64F, 1, 1, ksize=3)
    sobel2 = cv2.Sobel(blur2, cv2.CV_64F, 1, 1, ksize=3)
    var1 = float(np.var(sobel1))
    var2 = float(np.var(sobel2))

    # Evaluate state change:
    # If before had a detected pothole cavity (> 1.5% of ROI)
    if pothole_pct_before >= 1.5:
        cavity_reduction = (cavity_pixels1 - cavity_pixels2) / max(cavity_pixels1, 1)
        state_change_percent = min(99.0, max(0.0, cavity_reduction * 100.0))
    else:
        # Pothole was shallow, compare texture smoothing / roughness reduction
        smooth_ratio = max(0.0, min(1.0, (var1 - var2) / max(var1, 1e-4)))
        state_change_percent = 85.0 if smooth_ratio > 0.1 else 45.0

    state_change_percent = round(state_change_percent, 1)

    # Decision thresholding
    if state_change_percent >= 65.0:
        status = "PASS"
        score = min(100.0, 70.0 + (state_change_percent - 65.0) * 0.85)
        confidence = 0.95
        message = f"Pothole cavity filled and asphalt surface restored. Cavity reduction: {state_change_percent}%."
    elif state_change_percent >= 35.0:
        status = "REVIEW"
        score = 55.0
        confidence = 0.75
        message = f"Partial surface change detected ({state_change_percent}%). Crater may not be fully levelled."
    else:
        status = "FAIL"
        score = max(5.0, state_change_percent * 0.5)
        confidence = 0.92
        message = f"Pothole still clearly visible in AFTER capture (cavity reduction: {state_change_percent}%)."

    return {
        "check_type": "POTHOLE",
        "status": status,
        "score": round(score, 1),
        "confidence": confidence,
        "details": {
            "before_pothole_area_pct": pothole_pct_before,
            "after_pothole_area_pct": pothole_pct_after,
            "state_change_percent": state_change_percent,
            "roughness_before": round(var1, 2),
            "roughness_after": round(var2, 2),
            "message": message
        }
    }
