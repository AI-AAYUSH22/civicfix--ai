from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class LoginRequest(BaseModel):
    email: str = Field(description="Email or Employee ID (e.g. BMC-ENG-4001 or CONT-ROAD-01)")
    password: str


class RegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)

    @field_validator("password")
    @classmethod
    def _max_72_bytes(cls, v: str) -> str:
        if len(v.encode("utf-8")) > 72:
            raise ValueError("Password must be at most 72 bytes")
        return v


class WardAssignmentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    ward_id: str
    ward_name: str
    assigned_by: str | None = None
    start_date: str | None = None


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int | str
    name: str
    email: str
    role: str
    employee_id: str | None = None
    contractor_id: str | None = None
    assigned_ward: WardAssignmentOut | None = None


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds
    user: UserOut


# Aliases for backward compatibility
UserLogin = LoginRequest
UserResponse = UserOut
TokenResponse = Token