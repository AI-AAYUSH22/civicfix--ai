import math
from typing import Optional, Tuple, List
from sqlalchemy.orm import Session
from app.models.ward import Ward, Road
from app.models.case import Case, CaseLocation

def haversine_distance_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great circle distance between two points 
    on the earth (specified in decimal degrees) in meters.
    """
    R = 6371000.0  # Radius of earth in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) *
         math.sin(delta_lambda / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))

    return R * c

def find_nearest_ward_and_road(db: Session, lat: float, lng: float) -> Tuple[Optional[Ward], Optional[Road]]:
    """
    Finds the nearest Ward and associated Road given latitude and longitude.
    """
    wards = db.query(Ward).all()
    if not wards:
        return None, None

    nearest_ward = None
    min_ward_dist = float("inf")

    for w in wards:
        if w.center_lat is not None and w.center_lng is not None:
            dist = haversine_distance_meters(lat, lng, w.center_lat, w.center_lng)
            if dist < min_ward_dist:
                min_ward_dist = dist
                nearest_ward = w

    if not nearest_ward:
        nearest_ward = wards[0]

    # Find road in this ward
    nearest_road = db.query(Road).filter(Road.ward_id == nearest_ward.id).first()
    return nearest_ward, nearest_road

def check_nearby_duplicates(db: Session, lat: float, lng: float, radius_meters: float = 20.0) -> List[Case]:
    """
    Checks if there is already an open or active case within `radius_meters`.
    """
    active_cases = (
        db.query(Case)
        .join(CaseLocation)
        .filter(Case.status.in_(["REPORTED", "VALIDATED", "ASSIGNED", "REPAIRING", "VERIFICATION"]))
        .all()
    )

    duplicates = []
    for c in active_cases:
        if c.location:
            dist = haversine_distance_meters(lat, lng, c.location.latitude, c.location.longitude)
            if dist <= radius_meters:
                duplicates.append(c)

    return duplicates
