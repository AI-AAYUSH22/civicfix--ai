from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class CaseLocationSchema(BaseModel):
    latitude: float
    longitude: float
    address: Optional[str] = None
    landmark: Optional[str] = None

    class Config:
        from_attributes = True

class CaseCreate(BaseModel):
    description: str
    latitude: float
    longitude: float
    severity: Optional[str] = "Medium"
    address: Optional[str] = None
    landmark: Optional[str] = None
    title: Optional[str] = None

class CaseResponse(BaseModel):
    id: str
    title: Optional[str] = None
    description: str
    severity: str
    status: str
    ward_id: Optional[str] = None
    ward_name: Optional[str] = None
    road_id: Optional[str] = None
    road_name: Optional[str] = None
    location: Optional[CaseLocationSchema] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class CaseValidateRequest(BaseModel):
    action: str # VALIDATE or REJECT
    notes: Optional[str] = None
