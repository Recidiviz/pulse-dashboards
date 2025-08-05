import hashlib
import json
from typing import Any


def compute_content_hash(mermaid_content: str, additional_data: Any = None) -> str:
    """
    Compute a SHA-256 hash of the content for change detection.

    Args:
        mermaid_content: The mermaid diagram content
        additional_data: Additional structured data (YAML/JSON data, notes, etc.)

    Returns:
        SHA-256 hash as hex string
    """
    hasher = hashlib.sha256()

    # Add mermaid content
    hasher.update(mermaid_content.encode("utf-8"))

    # Add additional data if present
    if additional_data is not None:
        # Convert to JSON string for consistent hashing
        if isinstance(additional_data, dict):
            additional_str = json.dumps(additional_data, sort_keys=True)
        else:
            additional_str = str(additional_data)
        hasher.update(additional_str.encode("utf-8"))

    return hasher.hexdigest()
