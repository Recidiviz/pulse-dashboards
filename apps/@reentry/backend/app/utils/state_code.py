"""
State code normalization utilities.

## State code Quirks

### 1. BigQuery
- **Service**: `app/services/client_data/queries.py`
- **Data Model**: `ClientDataRecord.state_code` and `CaseWorkerDataRecord.state_code` in `app/services/client_data/types.py`
- **Environment-specific values**:
  - Development/Staging: Idaho state code is `US_ID`
  - **Production**: Idaho state code is `US_IX`

### 2. Authentication data
- **File**: `app/auth/auth_core.py`
- **Note**: Auth0 we do not get state_code from auth, only pseudonymized IDs,
  which are used to query BigQuery for full staff/client records (including state_code).
- **Flow**: Auth0 → pseudonymized_id → BigQuery lookup → state_code

**Normalization Strategy**:
- External sources (especially dev/staging) may provide `US_ID`
- System automatically normalizes `US_ID` → `US_IX` at data ingestion boundaries
- All internal logic uses `US_IX` consistently
"""

# Mapping of external/legacy state codes to canonical internal state codes
STATE_CODE_ALIASES = {
    "US_ID": "US_IX",  # Idaho: External (BigQuery dev/staging) → Internal canonical
}


def normalize_state_code(state_code: str) -> str:
    """
    Normalize state codes to internal canonical format.

    This function ensures consistent state code representation across the application.
    Most importantly, it converts US_ID (legacy/external Idaho code) to US_IX
    (canonical internal Idaho code).

    In production, BigQuery data already contains US_IX for Idaho clients and staff,
    so this normalization is primarily for dev/staging environments.

    Args:
        state_code: Raw state code from external source (e.g., "US_ID" from BigQuery)

    Returns:
        Canonical internal state code (e.g., "US_IX" for Idaho)

    Examples:
        >>> normalize_state_code("US_ID")
        'US_IX'
        >>> normalize_state_code("US_IX")
        'US_IX'
        >>> normalize_state_code("US_AZ")
        'US_AZ'
        >>> normalize_state_code("US_UT")
        'US_UT'
    """
    return STATE_CODE_ALIASES.get(state_code, state_code)
