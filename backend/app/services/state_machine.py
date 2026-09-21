from typing import Set, Dict

VALID_TRANSITIONS: Dict[str, Set[str]] = {
    "REPORTED": {"VALIDATED", "REJECTED", "CLOSED"},
    "VALIDATED": {"ASSIGNED", "REJECTED"},
    "ASSIGNED": {"REPAIRING", "VALIDATED"},
    "REPAIRING": {"VERIFICATION", "ASSIGNED"},
    "VERIFICATION": {"VERIFIED", "NEEDS_REVIEW", "NOT_VERIFIED"},
    "NEEDS_REVIEW": {"VERIFIED", "NOT_VERIFIED", "REPAIRING"},
    "NOT_VERIFIED": {"REPAIRING", "ASSIGNED", "CLOSED"},
    "VERIFIED": {"CLOSED"},
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
