import cv2
import numpy as np

def analyze_pothole_image(image_bytes: bytes) -> dict:
    """
    Analyzes an image to detect potholes using OpenCV.
    Returns a dictionary with is_pothole (bool), confidence (float), and estimated_size_sqm (float).
    """
    try:
        # Convert bytes to numpy array and decode image
        np_arr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        
        if img is None:
            raise ValueError("Invalid image format")

        height, width = img.shape[:2]
        total_pixels = height * width

        # Convert to grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        # Apply Gaussian blur to reduce noise
        blurred = cv2.GaussianBlur(gray, (11, 11), 0)

        # Apply adaptive thresholding to find dark regions (potential potholes)
        thresh = cv2.adaptiveThreshold(
            blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 15, 5
        )

        # Find contours
        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        best_contour = None
        max_score = 0
        best_area = 0

        for cnt in contours:
            area = cv2.contourArea(cnt)
            # Filter out tiny specks and massive background contours
            if area < (total_pixels * 0.01) or area > (total_pixels * 0.4):
                continue

            # Calculate circularity/roughness score
            perimeter = cv2.arcLength(cnt, True)
            if perimeter == 0:
                continue
            
            circularity = 4 * np.pi * (area / (perimeter * perimeter))
            
            # STRICT CIRCULARITY CHECK
            # Potholes aren't perfect circles, but they aren't completely jagged lines either.
            if circularity < 0.35:
                continue

            # STRICT COLOR CHECK (Must be dark and low saturation - typical asphalt colors)
            # Create a mask for this contour to calculate mean color
            mask = np.zeros(gray.shape, dtype=np.uint8)
            cv2.drawContours(mask, [cnt], -1, 255, -1)
            
            # Convert original image to HSV to check saturation
            hsv_img = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
            mean_val = cv2.mean(hsv_img, mask=mask)
            # mean_val is (H, S, V, _)
            mean_saturation = mean_val[1]
            mean_brightness = mean_val[2]
            
            # If it's highly saturated (colorful) or very bright, it's not a pothole
            if mean_saturation > 80 or mean_brightness > 150:
                continue
            
            # Score combining area relative to image and circularity.
            score = (area / total_pixels) * 100 + (circularity * 50)
            
            if score > max_score:
                max_score = score
                best_contour = cnt
                best_area = area

        if best_contour is not None:
            # We found a candidate pothole
            # Base confidence starts high because we found a significant structural anomaly
            confidence = min(99.0, 85.0 + (max_score * 0.5))
            
            # Estimate size: scale the pixel area to a realistic range
            area_ratio = best_area / total_pixels
            estimated_size_sqm = round(area_ratio * 3.5, 2)
            
            # Ensure it's at least 0.1
            estimated_size_sqm = max(0.1, estimated_size_sqm)
            
            return {
                "is_pothole": True,
                "confidence": round(confidence, 1),
                "estimated_size_sqm": estimated_size_sqm,
                "message": "High-confidence structural anomaly detected matching asphalt deterioration."
            }
        else:
            # If no valid contour found, fail strictly. We removed the high-variance fallback 
            # so colourful/jagged things (like dinosaurs) don't get through by accident.
            return {
                "is_pothole": False,
                "confidence": 15.0,
                "estimated_size_sqm": 0.0,
                "message": "Low confidence: Target lacks characteristic circularity or asphalt color profile."
            }
    except Exception as e:
        # Strict failure on exception
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
