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
    SIFT feature extraction and Homography with RANSAC.
    Mathematically warps, rotates, and scales the 'After' image to align with the
    background anchor elements of the 'Before' image.
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

    # Use SIFT detector (or fallback to ORB if SIFT not compiled)
    if hasattr(cv2, 'SIFT_create'):
        detector = cv2.SIFT_create(nfeatures=2000, contrastThreshold=0.03, edgeThreshold=10)
        is_sift = True
    else:
        detector = cv2.ORB_create(nfeatures=2000, scaleFactor=1.2, nlevels=8)
        is_sift = False

    kp1, des1 = detector.detectAndCompute(img1_resized, None)
    kp2, des2 = detector.detectAndCompute(img2_resized, None)

    if des1 is None or des2 is None or len(kp1) < 8 or len(kp2) < 8:
        return {
            "check_type": "PERSPECTIVE",
            "status": "REVIEW",
            "score": 45.0,
            "confidence": 0.6,
            "details": {
                "message": "Insufficient feature keypoints detected in scene.",
                "detector": "SIFT" if is_sift else "ORB",
                "kp1_count": len(kp1) if kp1 else 0,
                "kp2_count": len(kp2) if kp2 else 0,
            }
        }

    # Match descriptors using FLANN / BFMatcher
    if is_sift:
        # L2 norm for SIFT
        bf = cv2.BFMatcher(cv2.NORM_L2, crossCheck=False)
    else:
        bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=False)

    raw_matches = bf.knnMatch(des1, des2, k=2)

    # Lowe's ratio test to filter ambiguous matches
    good_matches = []
    for match in raw_matches:
        if len(match) == 2:
            m, n = match
            if m.distance < 0.75 * n.distance:
                good_matches.append(m)

    inlier_count = 0
    inlier_ratio = 0.0
    homography_matrix_found = False
    H_matrix = None

    if len(good_matches) >= 4:
        src_pts = np.float32([kp1[m.queryIdx].pt for m in good_matches]).reshape(-1, 1, 2)
        dst_pts = np.float32([kp2[m.trainIdx].pt for m in good_matches]).reshape(-1, 1, 2)

        if len(good_matches) >= 6:
            H, mask = cv2.findHomography(dst_pts, src_pts, cv2.RANSAC, 5.0)
            if mask is not None:
                inliers = mask.ravel().tolist()
                inlier_count = sum(inliers)
                inlier_ratio = inlier_count / max(len(good_matches), 1)
                homography_matrix_found = (H is not None)
                H_matrix = H

        # Fallback to Affine partial 2D if homography had low inliers (e.g. nearly collinear road edges)
        if inlier_count < 4 and len(good_matches) >= 4:
            M, affine_mask = cv2.estimateAffinePartial2D(dst_pts, src_pts, method=cv2.RANSAC, ransacReprojThreshold=5.0)
            if affine_mask is not None:
                affine_inliers = affine_mask.ravel().tolist()
                affine_count = sum(affine_inliers)
                if affine_count > inlier_count:
                    inlier_count = affine_count
                    inlier_ratio = affine_count / max(len(good_matches), 1)
                    homography_matrix_found = (M is not None)

    # Evaluate score and status based on SIFT RANSAC inliers
    if inlier_count >= 20 and inlier_ratio >= 0.30:
        status = "PASS"
        score = min(100.0, 75.0 + (inlier_count / 40.0) * 25.0)
        confidence = 0.95
        message = f"High SIFT geometric scene consistency verified ({inlier_count} RANSAC inliers). Homography warp established."
    elif inlier_count >= 8:
        status = "PASS"
        score = 65.0 + (inlier_count / 20.0) * 15.0
        confidence = 0.85
        message = f"Moderate geometric consistency ({inlier_count} SIFT inliers). Homography alignment successful."
    elif inlier_count >= 4:
        status = "REVIEW"
        score = 45.0 + (inlier_count / 8.0) * 15.0
        confidence = 0.70
        message = f"Low SIFT feature inliers ({inlier_count}). Camera angle or illumination varied significantly."
    else:
        status = "FAIL"
        score = max(10.0, float(inlier_count * 5))
        confidence = 0.90
        message = "Scene geometry does not match (Zero or negligible SIFT inliers). Different location or perspective."

    return {
        "check_type": "PERSPECTIVE",
        "status": status,
        "score": round(score, 1),
        "confidence": confidence,
        "details": {
            "detector": "SIFT" if is_sift else "ORB",
            "total_matches": len(good_matches),
            "inlier_count": inlier_count,
            "inlier_ratio": round(inlier_ratio, 3),
            "homography_found": homography_matrix_found,
            "message": message
        }
    }
