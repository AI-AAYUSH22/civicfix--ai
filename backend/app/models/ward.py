import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, Integer, ForeignKey, Text, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base

class Ward(Base):
    __tablename__ = "wards"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    code = Column(String(50), nullable=True)
    city = Column(String(100), default="Mumbai", nullable=False)
    center_lat = Column(Float, nullable=True)
    center_lng = Column(Float, nullable=True)
    polygon_geojson = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    roads = relationship("Road", back_populates="ward", cascade="all, delete-orphan")
    cases = relationship("Case", back_populates="ward")


class Road(Base):
    __tablename__ = "roads"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    ward_id = Column(String(36), ForeignKey("wards.id"), nullable=False)
    road_type = Column(String(50), default="Major", nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    ward = relationship("Ward", back_populates="roads")
    cases = relationship("Case", back_populates="road")


class Contractor(Base):
    __tablename__ = "contractors"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    company_name = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=True)
    email = Column(String(255), nullable=True)
    rating = Column(Float, default=4.5)
    active_orders = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    work_orders = relationship("WorkOrder", back_populates="contractor")
