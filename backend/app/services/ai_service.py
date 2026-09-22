import cv2
import numpy as np

def analyze_pothole_image(image_bytes: bytes) -> dict:
    """
    Analyzes an image to detect potholes using OpenCV.
    Uses edge density, structural variance, and contour detection.
    Returns a dictionary with is_pothole (bool), confidence (float), and estimated_size_sqm (float).
    """
    try:
        # Convert bytes to numpy array and decode image
        np_arr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        
        if img is None:
            raise ValueError("Invalid image format")

        # --- NEW: Indoor/Selfie Detection via Color Variance ---
        # A road is usually uniform in hue/saturation. A selfie or room has many different colors.
        hsv_for_variance = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        # Calculate standard deviation of Hue and Saturation
        _, stddev = cv2.meanStdDev(hsv_for_variance)
        hue_stddev = stddev[0][0]
        sat_stddev = stddev[1][0]
        
        # If the image has high color variance, it's likely a complex scene (like a person/room), not a road surface
        if hue_stddev > 30 or sat_stddev > 40:
            return {
                "is_pothole": False,
                "confidence": 95.0,
                "estimated_size_sqm": 0.0,
                "message": "Invalid: Complex scene detected (possible selfie or indoor photo). Please capture the road."
            }

        height, width = img.shape[:2]
        total_pixels = height * width

        # Global Check: A road image should not be overly saturated/colorful
        hsv_img = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        global_mean_val = cv2.mean(hsv_img)
        global_saturation = global_mean_val[1]
        
        # If the overall image is very colorful (like a room, grass, sky), it's not a road
        if global_saturation > 60:
            return {
                "is_pothole": False,
                "confidence": 10.0,
                "estimated_size_sqm": 0.0,
                "message": "Invalid: Background is too colorful to be an asphalt/dirt road."
            }

        # Convert to grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        # 1. Edge Density - Potholes and damaged roads have high texture variance
        edges = cv2.Canny(gray, 50, 150)
        edge_density = np.sum(edges > 0) / edges.size

        # 2. Contour Detection for cavities/anomalies
        blurred = cv2.GaussianBlur(gray, (15, 15), 0)
        # We use a very localized adaptive threshold to find depressions/cracks
        thresh = cv2.adaptiveThreshold(
            blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 21, 5
        )

        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        max_score = 0
        best_area = 0

        for cnt in contours:
            area = cv2.contourArea(cnt)
            # Filter out tiny specks and massive background contours
            if area < (total_pixels * 0.005) or area > (total_pixels * 0.5):
                continue

            # Calculate a generic roughness score (perimeter relative to area)
            perimeter = cv2.arcLength(cnt, True)
            if perimeter == 0:
                continue
                
            roughness = (perimeter * perimeter) / area
            
            # Potholes and road damage are usually rough/jagged (high roughness)
            if roughness < 5: 
                continue # Too perfectly smooth

            score = (area / total_pixels) * 100
            
            if score > max_score:
                max_score = score
                best_area = area

        # Decision Logic:
        # A pothole image either has a significant detected cavity contour OR very high edge density (completely shattered road)
        if max_score > 0.5 or edge_density > 0.05:
            # Calculate confidence based on how much structural damage was found
            confidence = min(99.0, 75.0 + (max_score * 2) + (edge_density * 200))
            
            # Estimate size
            area_ratio = best_area / total_pixels if best_area > 0 else (edge_density * 0.5)
            estimated_size_sqm = round(max(0.1, area_ratio * 4.0), 2)
            
            return {
                "is_pothole": True,
                "confidence": round(confidence, 1),
                "estimated_size_sqm": estimated_size_sqm,
                "message": "Structural anomaly detected matching asphalt deterioration."
            }
        else:
            return {
                "is_pothole": False,
                "confidence": 15.0,
                "estimated_size_sqm": 0.0,
                "message": "Low confidence: Surface appears too smooth or lacks defined cavities."
            }
    except Exception as e:
        return {
            "is_pothole": False,
            "confidence": 10.0,
            "estimated_size_sqm": 0.0,
            "message": f"Analysis failed: {str(e)}"
        }

def analyze_repaired_road_image(image_bytes: bytes) -> dict:
    """
    Analyzes an image to strictly verify it is a fully constructed/repaired road.
    Rejects anything that has high structural variance, is highly colorful, or contains pothole-like contours.
    """
    try:
        np_arr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        
        if img is None:
            raise ValueError("Invalid image format")

        # 1. Color Check - Must be largely grey/dark (Asphalt/Concrete)
        hsv_img = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        mean_val = cv2.mean(hsv_img)
        mean_saturation = mean_val[1]
        
        # If the image is highly saturated (colorful), reject it immediately.
        if mean_saturation > 60:
            return {
                "is_repaired": False,
                "confidence": 15.0,
                "message": "Invalid: Image contains colors not consistent with a repaired road."
            }

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # 2. Edge Density Check - Repaired roads should be relatively smooth
        edges = cv2.Canny(gray, 50, 150)
        edge_density = np.sum(edges > 0) / edges.size
        
        if edge_density > 0.15:
            # Too many edges = highly textured, complex background, or extreme damage
            return {
                "is_repaired": False,
                "confidence": 20.0,
                "message": "Invalid: High structural variance detected. Surface is not smooth."
            }

        # 3. Contour Check - Ensure no dark cavities exist
        blur = cv2.GaussianBlur(gray, (9, 9), 0)
        thresh = cv2.adaptiveThreshold(blur, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 11, 2)
        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        total_pixels = img.shape[0] * img.shape[1]
        
        for cnt in contours:
            area = cv2.contourArea(cnt)
            if area < (total_pixels * 0.01) or area > (total_pixels * 0.4):
                continue
                
            perimeter = cv2.arcLength(cnt, True)
            if perimeter == 0:
                continue
                
            circularity = 4 * np.pi * (area / (perimeter * perimeter))
            
            # If we find a significantly large and somewhat circular dark spot -> it's a pothole, NOT repaired
            if circularity > 0.3:
                return {
                    "is_repaired": False,
                    "confidence": 10.0,
                    "message": "Invalid: Pothole cavity detected. Road is not fully repaired."
                }
                
        # If it passes color, edge density, and contour checks, it is a smooth, repaired road
        confidence = 98.0 - (edge_density * 100) # Smoother = higher confidence
        
        return {
            "is_repaired": True,
            "confidence": round(confidence, 1),
            "message": "Valid: Smooth, uniform repaired road surface detected."
        }

    except Exception as e:
        return {
            "is_repaired": False,
            "confidence": 5.0,
            "message": f"Analysis failed: {str(e)}"
        }
