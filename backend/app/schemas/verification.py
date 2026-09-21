from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class VerificationCheckSchema(BaseModel):
    check_type: str
    status: str
    score: float
    confidence: float
    details: Optional[Dict[str, Any]] = None

class VerificationResponse(BaseModel):
    id: str
    case_id: str
    work_order_id: str
    overall_score: float
    status: str # VERIFIED, NEEDS_REVIEW, NOT_VERIFIED
    summary: Optional[str] = None
    started_at: datetime
    completed_at: datetime
    checks: List[VerificationCheckSchema] = []

    class Config:
        from_attributes = True

class VerificationReviewRequest(BaseModel):
    decision: str # APPROVE or REJECT
    notes: Optional[str] = None
    engineer_name: Optional[str] = "Ward Engineer"
