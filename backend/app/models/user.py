import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Enum, Boolean
from app.core.database import Base

class UserRole(str, Enum):
    CITIZEN = "CITIZEN"
    CONTRACTOR = "CONTRACTOR"
    WARD_ENGINEER = "WARD_ENGINEER"
    ADMIN = "ADMIN"

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    employee_id = Column(String(50), unique=True, index=True, nullable=True)  # e.g. BMC-ENG-4001
    contractor_id = Column(String(50), index=True, nullable=True)  # e.g. CONT-ROAD-01
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), default=UserRole.CITIZEN, nullable=False)
    phone = Column(String(50), nullable=True)
    hashed_password = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    def __init__(self, **kwargs):
        if "name" in kwargs and "full_name" not in kwargs:
            kwargs["full_name"] = kwargs.pop("name")
        super().__init__(**kwargs)

    @property
    def name(self) -> str:
        return self.full_name

    @name.setter
    def name(self, value: str):
        self.full_name = value
