from pydantic import BaseModel
from typing import Optional

class UserLogin(BaseModel):
    email: str
    password: Optional[str] = "password123"

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    phone: Optional[str] = None

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
