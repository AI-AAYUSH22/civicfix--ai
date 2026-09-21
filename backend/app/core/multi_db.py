import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from typing import Dict, Optional

from app.core.config import settings
from app.core.database import Base

# Multi-Tenant SQLite Database Paths
MUNICIPAL_DB_PATH = os.path.join(settings.BASE_DIR, "civicfix.db")

# Ward A (e.g., Dadar West - w12)
WARD_A_DB_PATH = os.path.join(settings.BASE_DIR, "contractor_ward_a.db")
# Ward B (e.g., Bandra West - w07)
WARD_B_DB_PATH = os.path.join(settings.BASE_DIR, "contractor_ward_b.db")
# Ward C (e.g., Andheri East - w18)
WARD_C_DB_PATH = os.path.join(settings.BASE_DIR, "contractor_ward_c.db")

# Contractor engines
contractor_engines: Dict[str, any] = {
    "w12": create_engine(f"sqlite:///{WARD_A_DB_PATH}", connect_args={"check_same_thread": False}),
    "w07": create_engine(f"sqlite:///{WARD_B_DB_PATH}", connect_args={"check_same_thread": False}),
    "w18": create_engine(f"sqlite:///{WARD_C_DB_PATH}", connect_args={"check_same_thread": False}),
}

# Fallback default contractor engine for any other ward
DEFAULT_CONTRACTOR_DB_PATH = os.path.join(settings.BASE_DIR, "contractor_default.db")
contractor_engines["default"] = create_engine(
    f"sqlite:///{DEFAULT_CONTRACTOR_DB_PATH}", connect_args={"check_same_thread": False}
)

# Contractor session makers
contractor_sessions: Dict[str, any] = {
    ward_id: sessionmaker(autocommit=False, autoflush=False, bind=eng)
    for ward_id, eng in contractor_engines.items()
}

def init_contractor_databases():
    """Initializes schema tables across all local contractor tenant databases."""
    from app.models.contractor_replica import ContractorReplicaRecord, ContractorInvoiceRecord
    for eng in contractor_engines.values():
        Base.metadata.create_all(bind=eng)

def get_contractor_session(ward_id: Optional[str] = None):
    """
    Returns an active database session for the contractor assigned to a specific ward.
    Ward A -> w12
    Ward B -> w07
    Ward C -> w18
    """
    normalized_ward = (ward_id or "default").lower()
    session_factory = contractor_sessions.get(normalized_ward, contractor_sessions["default"])
    return session_factory()
