import cv2
import numpy as np
import os
from typing import Dict, Any

def compute_ssim(img1: np.ndarray, img2: np.ndarray) -> float:
    """
    Computes Structural Similarity Index (SSIM) between two grayscale images using pure OpenCV/NumPy.
    """
    C1 = (0.01 * 255) ** 2
    C2 = (0.03 * 255) ** 2

    img1 = img1.astype(np.float64)
    img2 = img2.astype(np.float64)

    kernel = cv2.getGaussianKernel(11, 1.5)
    window = np.outer(kernel, kernel.transpose())

    mu1 = cv2.filter2D(img1, -1, window)[5:-5, 5:-5]
    mu2 = cv2.filter2D(img2, -1, window)[5:-5, 5:-5]

    mu1_sq = mu1 ** 2
    mu2_sq = mu2 ** 2
    mu1_mu2 = mu1 * mu2

    sigma1_sq = cv2.filter2D(img1 ** 2, -1, window)[5:-5, 5:-5] - mu1_sq
    sigma2_sq = cv2.filter2D(img2 ** 2, -1, window)[5:-5, 5:-5] - mu2_sq
    sigma12 = cv2.filter2D(img1 * img2, -1, window)[5:-5, 5:-5] - mu1_mu2

    ssim_map = ((2 * mu1_mu2 + C1) * (2 * sigma12 + C2)) / (
        (mu1_sq + mu2_sq + C1) * (sigma1_sq + sigma2_sq + C2)
    )
    return float(np.clip(ssim_map.mean(), 0.0, 1.0))

def verify_landmarks(
    before_image_path: str,
    after_image_path: str
) -> Dict[str, Any]:
    """
    Analyzes stable peripheral surroundings (curbs, buildings, poles, dividers, road lines)
    outside the active road patch.
    Applies CLAHE (Contrast Limited Adaptive Histogram Equalization) for lighting normalization
    (day vs. night flash robustness), then computes Structural Similarity (SSIM) on the background.
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

    # Mask out the active repair zone (bottom center 40%-90% y, 25%-75% x)
    # Focus exclusively on stable peripheral background anchors
    mask = np.ones((h, w), dtype=np.uint8) * 255
    mask[int(h * 0.40):int(h * 0.90), int(w * 0.25):int(w * 0.75)] = 0

    gray1 = cv2.cvtColor(img1_res, cv2.COLOR_BGR2GRAY)
    gray2 = cv2.cvtColor(img2_res, cv2.COLOR_BGR2GRAY)

    # 1. Apply CLAHE (Contrast Limited Adaptive Histogram Equalization) for lighting normalization
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    clahe1 = clahe.apply(gray1)
    clahe2 = clahe.apply(gray2)

    # Apply background mask to isolate peripheral structures
    bg1 = cv2.bitwise_and(clahe1, clahe1, mask=mask)
    bg2 = cv2.bitwise_and(clahe2, clahe2, mask=mask)

    # 2. Compute Structural Similarity (SSIM) on the lighting-normalized background
    ssim_val = compute_ssim(bg1, bg2)
    ssim_pct = round(ssim_val * 100.0, 1)

    # 3. Structural feature point matching in peripheral regions
    if hasattr(cv2, 'SIFT_create'):
        det = cv2.SIFT_create(nfeatures=800)
        norm_type = cv2.NORM_L2
    else:
        det = cv2.ORB_create(nfeatures=800)
        norm_type = cv2.NORM_HAMMING

    kp1, des1 = det.detectAndCompute(clahe1, mask=mask)
    kp2, des2 = det.detectAndCompute(clahe2, mask=mask)

    matched_landmarks = 0
    if des1 is not None and des2 is not None and len(kp1) >= 4 and len(kp2) >= 4:
        bf = cv2.BFMatcher(norm_type, crossCheck=True)
        matches = bf.match(des1, des2)
        # Filter high-quality matches
        max_dist = 60 if norm_type == cv2.NORM_HAMMING else 250
        good = [m for m in matches if m.distance < max_dist]
        matched_landmarks = len(good)

    # Decision criteria based on SSIM and landmark points
    # >85% structural identity verifies background identity mathematically
    if ssim_pct >= 85.0 and matched_landmarks >= 10:
        status = "PASS"
        score = min(100.0, 85.0 + (ssim_pct - 85.0) * 1.0)
        confidence = 0.95
        message = f"High background structural identity verified (SSIM: {ssim_pct}%, {matched_landmarks} landmark anchors). Identical physical location confirmed."
    elif ssim_pct >= 75.0 or matched_landmarks >= 6:
        status = "PASS"
        score = 70.0 + (ssim_pct / 100.0) * 20.0
        confidence = 0.85
        message = f"Consistent background identity (SSIM: {ssim_pct}%, {matched_landmarks} peripheral anchors)."
    elif ssim_pct >= 55.0 or matched_landmarks >= 2:
        status = "REVIEW"
        score = 50.0 + (matched_landmarks * 4.0)
        confidence = 0.70
        message = f"Borderline background similarity (SSIM: {ssim_pct}%). Potential heavy shadow or obstruction."
    else:
        status = "FAIL"
        score = max(10.0, ssim_pct * 0.4)
        confidence = 0.92
        message = f"Background landmark mismatch (SSIM: {ssim_pct}%). Completely distinct street surroundings."

    return {
        "check_type": "LANDMARK",
        "status": status,
        "score": round(score, 1),
        "confidence": confidence,
        "details": {
            "clahe_normalized": True,
            "background_ssim_pct": ssim_pct,
            "peripheral_matches": matched_landmarks,
            "message": message
        }
    }
