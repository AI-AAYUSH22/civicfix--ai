from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class EvidenceResponse(BaseModel):
    id: str
    case_id: str
    work_order_id: Optional[str] = None
    capture_type: str # BEFORE, AFTER, CITIZEN
    storage_path: str
    file_name: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    captured_at: datetime
    validation_status: str

    class Config:
        from_attributes = True
