from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class WorkOrderCreate(BaseModel):
    case_id: str
    contractor_id: str
    priority: Optional[str] = "Medium"
    deadline_days: Optional[int] = 3

class WorkOrderResponse(BaseModel):
    id: str
    case_id: str
    contractor_id: Optional[str] = None
    contractor_name: Optional[str] = None
    assigned_latitude: float
    assigned_longitude: float
    priority: str
    status: str
    assigned_at: datetime
    deadline: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    case_title: Optional[str] = None
    case_location: Optional[str] = None
    case_description: Optional[str] = None

    class Config:
        from_attributes = True

class WorkOrderStatusUpdate(BaseModel):
    status: str # In Progress, etc.
