import pytest
from app.services.state_machine import validate_state_transition, InvalidStateTransitionError

def test_valid_transitions():
    assert validate_state_transition("REPORTED", "VALIDATED") is True
    assert validate_state_transition("VALIDATED", "ASSIGNED") is True
    assert validate_state_transition("ASSIGNED", "REPAIRING") is True
    assert validate_state_transition("REPAIRING", "VERIFICATION") is True
    assert validate_state_transition("VERIFICATION", "VERIFIED") is True
    assert validate_state_transition("VERIFICATION", "NEEDS_REVIEW") is True
    assert validate_state_transition("VERIFICATION", "NOT_VERIFIED") is True
    assert validate_state_transition("VERIFIED", "CLOSED") is True

def test_invalid_transitions():
    # Direct jump from REPORTED to CLOSED is not allowed without review
    with pytest.raises(InvalidStateTransitionError):
        validate_state_transition("REPORTED", "VERIFIED")

    # Cannot jump from REPORTED directly to REPAIRING without validation and assignment
    with pytest.raises(InvalidStateTransitionError):
        validate_state_transition("REPORTED", "REPAIRING")

    # Closed state cannot be reopened directly to VERIFIED
    with pytest.raises(InvalidStateTransitionError):
        validate_state_transition("CLOSED", "VERIFIED")
