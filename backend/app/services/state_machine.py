from typing import Set, Dict

# Strict 6-stage lifecycle specified in the hardened blueprint:
# 1. REPORTED          - Citizen/Bot/Scraper logs ticket. Initial loose geofence bounded.
# 2. ASSIGNED          - Mapped to ward contractor ledger.
# 3. GROUND_LOCKED     - Contractor snaps "Before" photo on-site. Telemetry locked to contractor device.
# 4. REPAIRED_PENDING_VAL - Contractor submits "After" photo. Initiates 3-stage automated CV verification.
# 5. FLAGGED_ANOMALY   - CV checks fail. Contractor score frozen. Alert triggered on Ward Engineer dashboard.
# 6. VERIFIED_CLOSED   - CV checks pass completely. Settlement ledger & payment released.
VALID_TRANSITIONS: Dict[str, Set[str]] = {
    "REPORTED": {"VALIDATED", "ASSIGNED", "REJECTED", "CLOSED"},
    "VALIDATED": {"ASSIGNED", "REJECTED"},
    "ASSIGNED": {"GROUND_LOCKED", "REPAIRING", "VALIDATED"},
    "GROUND_LOCKED": {"REPAIRED_PENDING_VAL", "REPAIRING", "ASSIGNED"},
    "REPAIRING": {"REPAIRED_PENDING_VAL", "VERIFICATION", "GROUND_LOCKED", "ASSIGNED"},
    "VERIFICATION": {"VERIFIED", "NEEDS_REVIEW", "NOT_VERIFIED", "VERIFIED_CLOSED", "FLAGGED_ANOMALY"},
    "REPAIRED_PENDING_VAL": {"VERIFIED_CLOSED", "FLAGGED_ANOMALY", "VERIFIED", "NEEDS_REVIEW", "NOT_VERIFIED"},
    "NEEDS_REVIEW": {"VERIFIED_CLOSED", "FLAGGED_ANOMALY", "VERIFIED", "NOT_VERIFIED", "GROUND_LOCKED", "REPAIRING"},
    "NOT_VERIFIED": {"FLAGGED_ANOMALY", "GROUND_LOCKED", "REPAIRING", "ASSIGNED", "CLOSED"},
    "FLAGGED_ANOMALY": {"GROUND_LOCKED", "REPAIRING", "ASSIGNED", "VERIFIED_CLOSED", "CLOSED"},
    "VERIFIED": {"VERIFIED_CLOSED", "CLOSED"},
    "VERIFIED_CLOSED": set(),
    "REJECTED": set(),
    "CLOSED": set(),
}

class InvalidStateTransitionError(Exception):
    def __init__(self, current_status: str, target_status: str):
        super().__init__(f"Invalid state transition from '{current_status}' to '{target_status}'.")
        self.current_status = current_status
        self.target_status = target_status

def validate_state_transition(current_status: str, target_status: str) -> bool:
    """
    Validates whether transitioning from current_status to target_status is permitted.
    Raises InvalidStateTransitionError if illegal.
    """
    current = current_status.upper()
    target = target_status.upper()

    if current == target:
        return True

    allowed = VALID_TRANSITIONS.get(current, set())
    if target not in allowed:
        raise InvalidStateTransitionError(current, target)
    return True
