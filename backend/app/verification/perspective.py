import cv2
import numpy as np
import os
from typing import Dict, Any, Optional

def verify_perspective(
    before_image_path: str,
    after_image_path: str
) -> Dict[str, Any]:
    """
    Computes geometric perspective alignment between BEFORE and AFTER images using
    ORB feature extraction and Homography with RANSAC.
    """
    if not os.path.exists(before_image_path) or not os.path.exists(after_image_path):
        return {
            "check_type": "PERSPECTIVE",
            "status": "REVIEW",
            "score": 50.0,
            "confidence": 0.5,
            "details": {"error": "Image file not found for perspective analysis"}
        }

    img1 = cv2.imread(before_image_path, cv2.IMREAD_GRAYSCALE)
    img2 = cv2.imread(after_image_path, cv2.IMREAD_GRAYSCALE)

    if img1 is None or img2 is None:
        return {
            "check_type": "PERSPECTIVE",
            "status": "REVIEW",
            "score": 50.0,
            "confidence": 0.5,
            "details": {"error": "Failed to decode image"}
        }

    # Normalize resolution for consistent feature scale
    target_dim = (800, 600)
    img1_resized = cv2.resize(img1, target_dim)
    img2_resized = cv2.resize(img2, target_dim)

    # Initialize ORB detector
    orb = cv2.ORB_create(nfeatures=1500, scaleFactor=1.2, nlevels=8)
    kp1, des1 = orb.detectAndCompute(img1_resized, None)
    kp2, des2 = orb.detectAndCompute(img2_resized, None)

    if des1 is None or des2 is None or len(kp1) < 10 or len(kp2) < 10:
        return {
            "check_type": "PERSPECTIVE",
            "status": "REVIEW",
            "score": 45.0,
            "confidence": 0.6,
            "details": {
                "message": "Insufficient feature keypoints detected in scene.",
                "kp1_count": len(kp1) if kp1 else 0,
                "kp2_count": len(kp2) if kp2 else 0,
            }
        }

    # BFMatcher with Hamming distance and k-nearest neighbors
    bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=False)
    raw_matches = bf.knnMatch(des1, des2, k=2)

    # Lowe's ratio test to filter ambiguous matches
    good_matches = []
    for match in raw_matches:
        if len(match) == 2:
            m, n = match
            if m.distance < 0.78 * n.distance:
                good_matches.append(m)

    inlier_count = 0
    inlier_ratio = 0.0
    homography_matrix_found = False

    if len(good_matches) >= 8:
        src_pts = np.float32([kp1[m.queryIdx].pt for m in good_matches]).reshape(-1, 1, 2)
        dst_pts = np.float32([kp2[m.trainIdx].pt for m in good_matches]).reshape(-1, 1, 2)

        H, mask = cv2.findHomography(src_pts, dst_pts, cv2.RANSAC, 5.0)
        if mask is not None:
            inliers = mask.ravel().tolist()
            inlier_count = sum(inliers)
            inlier_ratio = inlier_count / len(good_matches)
            homography_matrix_found = (H is not None)

    # Scoring logic
    if inlier_count >= 25 and inlier_ratio >= 0.35:
        status = "PASS"
        score = min(100.0, 75.0 + (inlier_count / 50.0) * 25.0)
        confidence = 0.92
        message = f"High geometric scene consistency verified ({inlier_count} RANSAC inliers)."
    elif inlier_count >= 10:
        status = "PASS"
        score = 65.0 + (inlier_count / 25.0) * 15.0
        confidence = 0.82
        message = f"Moderate geometric consistency ({inlier_count} inliers). Scene matches the perspective."
    elif inlier_count >= 5:
        status = "REVIEW"
        score = 45.0 + (inlier_count / 10.0) * 15.0
        confidence = 0.70
        message = f"Low feature inliers ({inlier_count}). Camera angle or scene lighting varied significantly."
    else:
        status = "FAIL"
        score = max(10.0, float(inlier_count * 5))
        confidence = 0.88
        message = "Scene geometry does not match. Likely a completely different location or perspective."

    return {
        "check_type": "PERSPECTIVE",
        "status": status,
        "score": round(score, 1),
        "confidence": confidence,
        "details": {
            "total_matches": len(good_matches),
            "inlier_count": inlier_count,
            "inlier_ratio": round(inlier_ratio, 3),
            "homography_found": homography_matrix_found,
            "message": message
        }
    }
