import cv2
import numpy as np
import os
from typing import Dict, Any

def verify_landmarks(
    before_image_path: str,
    after_image_path: str
) -> Dict[str, Any]:
    """
    Analyzes stable peripheral surroundings (curbs, buildings, poles, dividers, road lines)
    outside the immediate repair zone.
    """
    if not os.path.exists(before_image_path) or not os.path.exists(after_image_path):
        return {
            "check_type": "LANDMARK",
            "status": "REVIEW",
            "score": 50.0,
            "confidence": 0.5,
            "details": {"error": "Image file not found for landmark analysis"}
        }

    img1 = cv2.imread(before_image_path)
    img2 = cv2.imread(after_image_path)

    if img1 is None or img2 is None:
        return {
            "check_type": "LANDMARK",
            "status": "REVIEW",
            "score": 50.0,
            "confidence": 0.5,
            "details": {"error": "Failed to load images"}
        }

    h, w = 600, 800
    img1_res = cv2.resize(img1, (w, h))
    img2_res = cv2.resize(img2, (w, h))

    # Mask out the bottom-center region (where the pothole / repair is located)
    # to focus strictly on stable peripheral surroundings: top 45%, left 25%, right 25%
    mask = np.ones((h, w), dtype=np.uint8) * 255
    # Mask center-bottom zone: y from 40% to 90%, x from 25% to 75%
    mask[int(h * 0.40):int(h * 0.90), int(w * 0.25):int(w * 0.75)] = 0

    gray1 = cv2.cvtColor(img1_res, cv2.COLOR_BGR2GRAY)
    gray2 = cv2.cvtColor(img2_res, cv2.COLOR_BGR2GRAY)

    # Detect edge structural landmarks using Canny
    edges1 = cv2.Canny(gray1, 80, 180)
    edges2 = cv2.Canny(gray2, 80, 180)

    masked_edges1 = cv2.bitwise_and(edges1, edges1, mask=mask)
    masked_edges2 = cv2.bitwise_and(edges2, edges2, mask=mask)

    # Feature matching in peripheral landmark zones
    orb = cv2.ORB_create(nfeatures=800)
    kp1, des1 = orb.detectAndCompute(gray1, mask=mask)
    kp2, des2 = orb.detectAndCompute(gray2, mask=mask)

    matched_landmarks = 0
    if des1 is not None and des2 is not None and len(kp1) >= 5 and len(kp2) >= 5:
        bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
        matches = bf.match(des1, des2)
        # Filter matches with reasonable distance
        good = [m for m in matches if m.distance < 55]
        matched_landmarks = len(good)

    # Edge correlation in peripheral regions
    edge_density_diff = abs(np.mean(masked_edges1) - np.mean(masked_edges2)) / 255.0

    if matched_landmarks >= 15 and edge_density_diff < 0.15:
        status = "PASS"
        score = min(100.0, 80.0 + matched_landmarks)
        confidence = 0.90
        message = f"Strong peripheral landmark matches ({matched_landmarks} structural points). Confirms identical street surroundings."
    elif matched_landmarks >= 6:
        status = "PASS"
        score = 65.0 + (matched_landmarks / 15.0) * 15.0
        confidence = 0.80
        message = f"Moderate landmark consistency ({matched_landmarks} peripheral points matched)."
    elif matched_landmarks >= 2:
        status = "REVIEW"
        score = 45.0 + matched_landmarks * 5.0
        confidence = 0.65
        message = "Partial landmark matches. Potential obstruction or altered background."
    else:
        status = "FAIL"
        score = 15.0
        confidence = 0.85
        message = "Zero peripheral landmarks match. Different physical environment."

    return {
        "check_type": "LANDMARK",
        "status": status,
        "score": round(score, 1),
        "confidence": confidence,
        "details": {
            "peripheral_matches": matched_landmarks,
            "edge_density_difference": round(edge_density_diff, 4),
            "message": message
        }
    }
