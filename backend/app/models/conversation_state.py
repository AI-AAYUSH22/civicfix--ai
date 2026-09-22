import uuid
from datetime import datetime
from sqlalchemy import Column, String, ForeignKey, Text, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base

class ConversationState(Base):
    __tablename__ = "conversation_states"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    channel = Column(String(50), nullable=False)  # WHATSAPP, REDDIT
    user_identifier = Column(String(255), nullable=False, index=True)  # e.g., phone number or reddit username
    active_case_id = Column(String(36), ForeignKey("cases.id"), nullable=True)
    current_step = Column(String(50), default="INIT", nullable=False)
    # Steps: INIT, WAITING_LOCATION, WAITING_PHOTO, WAITING_CLARIFICATION, COMPLETED
    session_data_json = Column(Text, nullable=True)  # JSON serialization of partial submission state
    last_interaction_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

    active_case = relationship("Case")
