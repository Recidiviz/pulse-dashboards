# Impersonate User Feature

## Overview

Allows Recidiviz internal staff to view the reentry app as any target user, enabling faster debugging and support. The feature uses a hybrid header-based approach: the frontend stores impersonation state in `localStorage` and attaches an `X-Impersonated-Email` header to every API request. The backend detects this header and resolves identity as the target user instead of the caller.

## How It Works

### End-to-end flow

```
1. Internal user goes to /profile and enters a target email
2. Frontend calls GET /impersonate/impersonate?email={target}
3. Backend validates the caller is internal, fetches target metadata
4. Frontend stores email + metadata in localStorage, reloads the page
5. Auth middleware attaches X-Impersonated-Email header to all subsequent requests
6. Backend auth functions detect the header and return the target's identity
7. A violet banner at the top of the page shows "Impersonating: {email}"
8. Clicking "Stop" clears localStorage and reloads back to the caller's identity
```

### Feature flag

The impersonation UI is gated behind the `IMPERSONATION` feature flag, enabled in: **development, dev, demo, pilot, staging**. It is **not enabled in production**.

---

## Backend

### Endpoint

**`GET /impersonate/impersonate?email={target_email}`**

File: `app/routes/impersonation_router.py`

- Requires a valid Auth0 bearer token
- Calls `check_impersonation_authorized(caller_email, target_email)`, which enforces: main switch (`IMPERSONATION_ENABLED`), email allowlist (`IMPERSONATION_ALLOWED_EMAILS`), internal domain (defense-in-depth), and self-impersonation prevention
- Calls `get_impersonated_user_metadata(email)` to fetch the target's data
- Returns:
  ```json
  {
    "email": "target@example.com",
    "pseudonymized_id": "pseudo_id",
    "state_code": "US_XX",
    "feature_variants": {}
  }
  ```

Router is registered in `main.py` with prefix `/impersonate`.

### Impersonation helpers

File: `app/auth/impersonation.py`

**`get_impersonated_user_metadata(target_email) -> dict`**

Fetches user metadata with a two-tier strategy based on environment:

| Environment      | Data source                                             | Auth method         |
| ---------------- | ------------------------------------------------------- | ------------------- |
| staging, prod    | Recidiviz Data API (`{DATA_API_URL}/auth/users/{hash}`) | Google ID token     |
| dev, demo, pilot | BigQuery via `Queries.get_caseworker_by_email()`        | Default credentials |

- Computes `SHA256(email.lower())` → Base64 as the user hash for API lookups; if the result starts with `/`, the leading character is replaced with `_` to match the convention in `generate_user_hash()` in recidiviz-data
- Caches results in Redis with key `impersonation:{email}` and a **5-minute TTL**
- Returns `app_metadata` dict with `pseudonymizedId`, `stateCode`, `featureVariants`

**`validate_impersonation_request(request) -> str | None`**

- Checks for `X-Impersonated-Email` header
- If absent, returns `None` (no impersonation)
- If present, resolves the caller's real identity (using `skip_impersonation=True` to avoid recursion), then delegates to `check_impersonation_authorized()` for all authorization checks
- Returns the target email if valid; raises `403` if unauthorized, `400` for self-impersonation

### Auth integration

File: `app/auth/auth_core.py`

Both `get_pseudonymized_id()` and `get_auth_user_context()` accept a `skip_impersonation: bool = False` parameter.

When `X-Impersonated-Email` is present and `skip_impersonation` is `False`:

1. Calls `validate_impersonation_request()` to verify the caller
2. Calls `get_impersonated_user_metadata()` to fetch the target's data
3. Returns the **target's** pseudonymized ID / user context instead of the caller's

The `skip_impersonation=True` flag is used internally during validation to resolve the **caller's** real identity without triggering recursive impersonation checks.

When impersonation is active, `get_auth_user_context()` sets `is_impersonating: True` in the returned context dict.

---

## Frontend

### ImpersonationForm

File: `apps/@reentry/frontend/app/components/ImpersonationForm.tsx`

- Rendered on the `/profile` page, only for internal users when the `IMPERSONATION` flag is on
- Email input + "Impersonate" button
- On success: stores `impersonated_email` and `impersonation_data` in `localStorage`, reloads the page
- "Stop Impersonating" button: clears both localStorage keys, reloads
- Validates email format client-side before sending

### ImpersonationBanner

File: `apps/@reentry/frontend/app/components/ImpersonationBanner.tsx`

- Sticky violet banner at the top of the page (z-index 9999)
- Reads `impersonated_email` from `localStorage`
- Shows "Impersonating: {email}" with a red "Stop" button
- Rendered in the protected layout (`app/(protected)/layout.tsx`)

### Auth middleware

File: `libs/@reentry/frontend-shared/src/auth/authMiddleware.ts`

After setting the `Authorization` header, the middleware checks `localStorage` for `impersonated_email`. If found, it attaches `X-Impersonated-Email` to the request headers. This ensures **all** authenticated API calls go through as the impersonated user.

---

## Configuration

| Variable                                         | Required in   | Purpose                                                    |
| ------------------------------------------------ | ------------- | ---------------------------------------------------------- |
| `IMPERSONATION_ENABLED`                          | all envs      | Main switch; must be `true` for the feature to work at all |
| `IMPERSONATION_ALLOWED_EMAILS`                   | all envs      | Comma-separated list of emails authorized to impersonate   |
| `DATA_API_URL`                                   | staging, prod | Base URL of the Recidiviz Data API                         |
| `GOOGLE_APPLICATION_CREDENTIALS_TARGET_AUDIENCE` | staging, prod | Audience for Google ID token auth                          |

Dev/demo/pilot environments do not require `DATA_API_URL` or `GOOGLE_APPLICATION_CREDENTIALS_TARGET_AUDIENCE` -- they use BigQuery for staff lookups.

---
