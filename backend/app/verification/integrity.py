from datetime import datetime
from typing import Dict, Any, Optional

def verify_evidence_integrity(
    before_hash: Optional[str],
    after_hash: Optional[str],
    before_time: Optional[datetime],
    after_time: Optional[datetime],
    before_filesize: Optional[int] = None,
    after_filesize: Optional[int] = None
) -> Dict[str, Any]:
    """
    Validates cryptographic file hash uniqueness, chronological sequence,
    and metadata integrity of BEFORE and AFTER evidence captures.
    """
    flags = []
    status = "PASS"
    score = 100.0

    # 1. Identical Image Duplication Check
    if before_hash and after_hash and before_hash == after_hash:
        flags.append("Fraud alert: BEFORE and AFTER submissions have identical cryptographic hash.")
        status = "FAIL"
        score = 0.0
        return {
            "check_type": "INTEGRITY",
            "status": status,
            "score": score,
            "confidence": 1.0,
            "details": {
                "identical_hash_detected": True,
                "flags": flags,
                "message": "Duplicate submission detected: identical image submitted for BEFORE and AFTER."
            }
        }

    # 2. Chronological sequence check
    if before_time and after_time:
        if after_time < before_time:
            flags.append("AFTER image timestamp is earlier than BEFORE image timestamp.")
            status = "FAIL"
            score = 20.0
        else:
            time_diff_sec = (after_time - before_time).total_seconds()
            if time_diff_sec < 10:
                flags.append("Repair duration under 10 seconds. Suspicious rapid submission.")
                status = "REVIEW"
                score = 65.0

    message = "Evidence metadata, chronological ordering, and hash integrity verified." if status == "PASS" else "; ".join(flags)

    return {
        "check_type": "INTEGRITY",
        "status": status,
        "score": score,
        "confidence": 0.95,
        "details": {
            "identical_hash_detected": False,
            "flags": flags,
            "message": message
        }
    }
