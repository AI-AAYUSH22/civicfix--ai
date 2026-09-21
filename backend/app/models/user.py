import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Enum
from app.core.database import Base

class UserRole(str, Enum):
    CITIZEN = "CITIZEN"
    CONTRACTOR = "CONTRACTOR"
    WARD_ENGINEER = "WARD_ENGINEER"
    ADMIN = "ADMIN"

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), default=UserRole.CITIZEN, nullable=False)
    phone = Column(String(50), nullable=True)
    hashed_password = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
