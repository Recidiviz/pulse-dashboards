# Zero Caseload, CPA Client Locations & Read-Only Mode

## What problem does this solve?

Most staff members (caseworkers) have a list of clients directly assigned to them.
However, some staff (like CPA users) operate at the facility level and are not assigned to specific clients.

These CPA users may be professionals who are related to a client in some capacity, temporarily covering for someone on leave, or who need visibility into plans from other states.
Additionally, some users require read-only access, meaning they can view information but cannot make any modifications.

Three features make this work:

- **`is_zero_caseload_user`**: Enables facility-based access instead of caseworker-only access.
- **`cpa_client_locations`**: Extra facility locations granted via Auth0 (on top of the staff's own locations in the database).
- **`is_read_only_user`**: Restricts the user to view-only mode (no creating, editing, or deleting).

---

## Where does the data come from?

All three values come from **Auth0 user metadata** under `app_metadata.featureVariants`:

| Auth0 key | What it does |
|---|---|
| `zeroCaseloadUser` | If present, the user is a zero-caseload user |
| `CPA_LOCATION_ICIO`, `CPA_LOCATION_DISTRICT_4_BOISE`, etc. | Each key adds that location to `cpa_client_locations` (the `CPA_LOCATION_` prefix is stripped) |
| `readOnly` | If present, the user is in read-only mode |

These are configured per-user in Auth0, not in our database.

---

## Backend

### Extraction

(`auth_core.py`→`get_auth_user_context`)

On every request, the auth middleware reads the Auth0 token and extracts:

```python
{
    "is_zero_caseload_user": "zeroCaseloadUser" in feature_variants,  # bool
    "is_read_only_user": "readOnly" in feature_variants,              # bool
    "cpa_client_locations": ["ICIO", "DISTRICT_4_BOISE"],  # list from CPA_LOCATION_* keys
}
```

These values are then passed to every route handler.

### Access control
(`permission_utils.py` → `check_access`)

Every endpoint that accesses a specific client calls `check_access()`. The logic is:

1. **Direct check**: Is this client directly assigned to this caseworker? If yes, allow.
2. **Location fallback (zero-caseload users only)**: If step 1 fails and `is_zero_caseload_user=True`:
   - Get caseworker's locations from the BigQuery database (caseworker record)
   - Add `cpa_client_locations` to that list
   - Normalize all location names
   - If the client's location matches any caseworker location → allow
3. **Otherwise** → 403 Forbidden

Regular users (non-zero-caseload) never reach step 2. They can only access directly assigned clients.

### Client list
(`crud/client.py` → `get_paginated_client_list`)

The client listing endpoint works differently based on user type:

| User type | What they see |
|---|---|
| **Regular user** | Only their directly assigned clients (caseworker) |
| **Zero-caseload user** | Caseworker clients + all clients at their facilities (staff DB locations + CPA locations), deduplicated |

### Read-only mode (backend)

The `is_read_only_user` flag is extracted in `get_auth_user_context()` and available in the auth context, but **it is not currently enforced on the backend**. All API restriction for read-only users happens on the frontend side.

---

## Frontend

### Context (`AuthUserCapabilitiesContext.tsx`)

The frontend reads the same Auth0 metadata and provides it via React Context:

```typescript
// Extracted from Auth0 userAppMetadata.featureVariants
{
  isZeroCaseloadUser: Boolean(features.zeroCaseloadUser),
  isReadOnlyUser: Boolean(features.readOnly),
  cpaClientLocations: ["DENVER", "AURORA"],  // from CPA_LOCATION_* keys
}
```

Access these values anywhere with:

```typescript
const { isZeroCaseloadUser, isReadOnlyUser, cpaClientLocations } = useAuthUserCapabilities();
```

### Read-only UI restrictions

When `isReadOnlyUser` is `true`, the frontend enforces view-only mode in two ways:

1. **`PrimaryButton` component**: All `PrimaryButton` instances are automatically disabled. Buttons can opt out with `ignoreCapabilities={true}` for non-destructive actions (e.g. export, view, print).
2. **`ReadOnlyIndicatorBanner` component**: A sticky banner appears at the top of the page: "You are in read-only mode".


**Important:** Read-only mode is currently **frontend-only**. The backend has the flag available but does not block write API calls for read-only users.


## Key takeaways

- **Auth0 is the source of truth** for who is a zero-caseload user, what CPA locations they have, and whether they are read-only.
- **Read-only mode is frontend-only.** The backend has the flag but does not currently block write API calls.
- **Regular users(caseworker) are unaffected**: they only see/access their directly assigned clients as before.
