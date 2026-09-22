from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.geo_service import find_nearest_ward_and_road

router = APIRouter()

@router.get("/nearest-ward")
def nearest_ward(lat: float, lng: float, db: Session = Depends(get_db)):
    """Return the nearest ward (and optionally road) for the given latitude and longitude.
    The response contains the IDs and names of the ward and road (if found)."""
    ward, road = find_nearest_ward_and_road(db, lat, lng)
    if not ward:
        raise HTTPException(status_code=404, detail="No ward found for the given location")
    return {
        "ward_id": ward.id,
        "ward_name": ward.name,
        "ward_code": ward.code,
        "road_id": road.id if road else None,
        "road_name": road.name if road else None,
    }
