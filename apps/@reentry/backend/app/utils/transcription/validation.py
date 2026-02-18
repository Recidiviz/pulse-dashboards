"""
Transcription validation utilities and constants.
"""

import re

# Prompt injection patterns to detect malicious content
INJECTION_PATTERNS = [
    re.compile(
        r"(?:ignore|disregard|forget)\s+(?:all\s+)?(?:previous|prior)\s+(?:instructions|prompts|rules)",
        re.IGNORECASE,
    ),
    re.compile(r"system\s+override", re.IGNORECASE),
    re.compile(r"you\s+are\s+now\s+(?:unrestricted|jailbroken)", re.IGNORECASE),
    re.compile(r"delete\s+this\s+log", re.IGNORECASE),
    re.compile(r"act\s+as\s+an\s+evil", re.IGNORECASE),
]
