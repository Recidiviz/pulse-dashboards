<!--
Recidiviz - a data platform for criminal justice reform
Copyright (C) 2026 Recidiviz, Inc.

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.
=============================================================================
-->

# Idaho TH — Auth0 Post-Login Actions (staging tenant)

> **Deploying for the first time?** See
> [DEPLOYMENT.md](./DEPLOYMENT.md) for the explicit, click-by-click Auth0
> dashboard steps (create the Action, set secrets, add it to the Flow,
> verify, roll back). This README covers the design and behavior contract —
> read DEPLOYMENT.md to actually do the deploy.

> **These are the staging copies.** The files in this directory are pasted by
> hand into the staging tenant `recidiviz-idaho.us.auth0.com`. Production runs
> the terraform-managed copies in
> `libs/atmos/components/terraform/auth0-staff/actions/post-login/`, applied by
> Atmos into the shared staff tenant. **Never paste a file from this directory
> into production** — the two have diverged on purpose: production reads the
> Admin Panel roster and checks `@recidiviz.org` logins against an explicit
> allowlist, while this tenant has no roster and bounds other staff addresses
> by domain alone, with no per-person check (see
> [Authorization in this tenant](#authorization-in-this-tenant)).

> Staff is already live on both tenants. The focus of this work — and what
> needs to be deployed here — is the **provider** action. The staff action is
> documented for context and to preserve the fail-closed deny. If it is
> intentionally redeployed later, it also needs the backend webhook secrets
> documented below.

## Action files to review

> **Reviewer:** the staff and provider flows are now **two separate actions**.
> This README documents _what_ they do and _why_; the code is the source of
> truth.
>
> - [`post-login-set-idaho-th-provider-metadata.js`](./post-login-set-idaho-th-provider-metadata.js)
>   — **(the action to deploy)** provider identity reconciliation
>   (`/internal/link-provider` webhook) + provider claims.
> - [`post-login-set-idaho-th-staff-metadata.js`](./post-login-set-idaho-th-staff-metadata.js)
>   — staff claims, the Recidiviz staff grant
>   (`/internal/check-staff-authorized` webhook), and the fail-closed deny for
>   unsupported connections.
> - [`modules/idaho-th-action-helpers.js`](./modules/idaho-th-action-helpers.js)
>   — the shared Action Module both actions `require`. Holds the signed-webhook
>   caller, the `pseudonymizedId` derivation, app scoping, and email
>   normalization, so there is one copy of each rather than two that can drift.
>   Must be published in the tenant before either action runs — see
>   [DEPLOYMENT.md § 0b](./DEPLOYMENT.md).

Deploy target: **Idaho TH Auth0 tenant → Actions → Triggers → `post-login`**.
Both actions are added to the **same post-login trigger** and run in the chain.

---

## Why two actions (instead of one)

- **Independent deploys.** On production, staff SSO/connection wiring may
  already exist. Splitting lets us add **only the provider action** without
  touching the staff action — see the production note below.
- **Single responsibility.** Each file owns one role's claims, so the provider
  webhook logic doesn't sit next to staff claim-setting.

The two are **mutually exclusive by connection**: a given login is handled by
exactly one action; the other no-ops. Setting custom claims is therefore never
duplicated.

---

## Authorization in this tenant

This tenant has no Admin Panel roster, so the staff action has nothing to check
a non-Recidiviz address against per person. Two weaker checks stand in:

- **A domain bound** (`isKnownStaffEmail`) decides which addresses the staff
  database connection can admit at all — IDOC's two domains, `@recidiviz.org`,
  and the `pentester-housing-case-manager-<n>@recidiviz-test.org` fixture.
  Anything else is denied before any claim is stamped. It mirrors `isStaffEmail`
  in `libs/@idaho-th/shared` with `isStaging` true. Production gets this bound
  from the roster instead; here it stands in for one.
- **The backend grant** for `@recidiviz.org`, over
  `/internal/check-staff-authorized`. Passing the domain bound does not skip it,
  and the domain alone never admits anyone the backend would refuse.

What that leaves: an IDOC-domain address is admitted on the domain and the
connection, with no per-person check, and `isRecidivizStaffAuthorized` treats
the `@recidiviz.org` domain itself as the grant rather than consulting an
allowlist. That is deliberate for an environment whose testers change
constantly, and it is why these files must never reach production, where the
roster and the allowlist are both real.

Two tenant settings carry the weight that the missing roster would otherwise:
signups must stay disabled on the staff database connection, and no other
application in this tenant should share that connection. Neither is in
terraform — confirm both in the Auth0 dashboard.

## Application scoping (one tenant, multiple apps)

The Idaho TH tenant may host **multiple applications**. Both actions begin with
a guard: if the login's `event.client.client_id` is not the Idaho TH app, the
action **returns immediately (no-op)** — it never sets claims, never denies, and
never calls the webhook. Other applications in the tenant are untouched.

The allowed id(s) come from the `IDAHO_TH_CLIENT_ID` Action secret
(comma-separated list supported). This guard **fails closed**: if the secret is
unset the action cannot confirm the app and does **nothing** (no claims, no
deny, no webhook). `IDAHO_TH_CLIENT_ID` is therefore **required in every
environment**, including local testing — without it, logins to the Idaho TH app
get no claims and authorization fails downstream.

---

## What the staff action does

`post-login-set-idaho-th-staff-metadata.js`, for the Idaho TH app:

1. No-ops for the passwordless `email` connection (the provider action owns it).
2. **Fail closed:** any connection that is not a known staff connection
   (`Username-Password-Authentication`) is **denied**. This action is the single
   place that denies an unknown connection. Staging has no IDOC connection, so
   the login page routes every staff address to the staff database connection
   here — IDOC AD SSO is a production-only path.
3. **Fail closed:** any address outside the staff domains (`isKnownStaffEmail`
   — IDOC's two domains, `@recidiviz.org`, and the
   `pentester-housing-case-manager-<n>@recidiviz-test.org` fixture) is
   **denied** before any claim is stamped. Production bounds the same set with
   the Admin Panel roster; this tenant has no roster, so the domains it issues
   accounts on stand in for one.
4. For `@recidiviz.org` logins, asks the backend whether the address is granted
   at all (signed `POST /internal/check-staff-authorized`) and **denies** on
   anything other than an explicit `authorized: true`. Clearing step 3 does not
   skip this. On staging the backend treats the domain itself as the grant, so
   every Recidiviz address answers true — the call still runs, which is what
   makes this the same path production exercises.
5. Derives `pseudonymizedId` from the address on every login
   (`generatePseudonymizedId`), for Recidiviz and IDOC staff alike — never read
   back from `app_metadata`. Production reads the roster's identifier here
   instead; this tenant has no roster.
6. Calls `POST /internal/link-staff` after `pseudonymizedId` is known so the
   backend can upsert the `HousingStaff` row and best-effort sync the staff
   Intercom contact. This call fails open for backend/network errors so staff
   logins are not blocked by Intercom/backend sync issues, but fails closed for
   identity conflicts (`409`). Unlike production, this action **adopts** a
   differing `pseudonymizedId` from the response — which happens when a row
   already owns the address under another identifier — so such an account keeps
   working here rather than loading an empty portal. Production treats its
   roster identifier as authoritative and never reads the response body.
7. Sets custom claims (`role: "staff"`) on the access token and ID token under
   `https://idaho_th.recidiviz.org/app_metadata`.

## What the provider action does

`post-login-set-idaho-th-provider-metadata.js`, for the Idaho TH app:

1. No-ops for any non-`email` connection (staff connections are handled by the
   staff action).
2. **Fail closed:** denies unsupported connections (mirrors the staff action so
   either file is safe on its own).
3. Denies if `email` or `user_id` is missing.
4. Calls the backend webhook `POST /internal/link-provider` on **every** login
   to reconcile the provider's Auth0 identity against their pre-provisioned
   record. The backend returns the canonical `pseudonymizedId` (DB is the source
   of truth), which the action uses for claims and writes back to `app_metadata`
   so Auth0 and the DB cannot drift. See [the webhook section](#provider-linking-webhook).
5. Sets custom claims (`role: "provider"`) on the access token and ID token.

### How a login flows through the chain

| Login                                       | Staff action           | Provider action              |
| ------------------------------------------- | ---------------------- | ---------------------------- |
| Staff (`Username-Password`)                 | links staff + claims   | no-op                        |
| Provider (`email`)                          | no-op                  | reconciles + provider claims |
| `@recidiviz.org` on `email`, role `staff`   | links staff + claims   | no-op                        |
| `@recidiviz.org` on `email`, any other role | no-op                  | reconciles + provider claims |
| Unknown connection                          | **deny** (fail closed) | **deny** (fail closed)       |
| A different app in tenant                   | no-op (scoped out)     | no-op (scoped out)           |

The `email` connection is the one place the connection does not decide on its
own: a Recidiviz address reaches it as either role. The role the login asked
for picks the owner, and the action that does not own it **returns without
denying** — see the note below on why a deny from the wrong action would end
the login regardless of what the owner decides. Anything that is not an
explicit `staff` choice resolves to provider, so an absent or unreadable role
lands on the path a provisioned row gates rather than on the staff path.

`api.access.deny(...)` records a denial but **does not** stop subsequent
actions from executing — every remaining action in the post-login chain still
runs to completion. (This differs from the legacy Auth0 Rules system, where
returning an error aborted processing.) The login is still blocked when any
action calls `deny`, but later actions must not assume earlier denies prevented
them from running.

The current two-action setup is safe because each action no-ops for connections
it does not own (staff skips `email`; provider skips known staff connections).
Both deny unknown connections so either action is safe to deploy on its own.
If you add a third action to the chain, it must either no-op for connections
handled elsewhere or perform its own authorization checks — do not rely on a
prior `deny` having halted the chain.

## Why

- **Centralized, server-trusted claims.** The frontend and tRPC backend read
  role/state/identity from JWT claims set here, not from anything the client can
  influence.
- **Role derives from the connection, not the email domain.** Providers
  authenticate passwordless; staff authenticate via the IDOC database/SSO
  connection. This avoids spoofable email-domain checks at token-issue time.
  Neither domain check in the staff action is an exception, because neither one
  grants anything: `isKnownStaffEmail` only narrows who the connection can
  admit, and the `@recidiviz.org` suffix only selects which question to ask,
  with the backend's answer — not the address — being the grant.
- **Fail closed.** Unknown connections, missing identity fields, unlinked
  providers, or backend ambiguity result in `api.access.deny(...)` rather than a
  token with weak/assumed claims.
- **One identifier derivation, shared.** `generatePseudonymizedId` in the
  module is the only place an identifier is minted, for staff and providers
  alike: `sha256(stateCode + normalizedEmail)`, base64url, first 16 chars —
  byte-identical to the production derivation. Deriving rather than minting a
  uuid means the value is stable across logins, the same across both actions,
  and two concurrent first logins propose the same value instead of racing.
  For providers it remains only a _provisional_ proposal; the backend's answer
  still wins.
- **DB is the single source of truth for provider identity.** The provider
  action reconciles on every login and adopts the backend's canonical
  `pseudonymizedId`, so a locally minted value can never drift from the DB.

---

## Claims contract (what consumers expect)

Each action sets the following on **both** the access token and ID token:

Claim key: `https://idaho_th.recidiviz.org/app_metadata`

```jsonc
{
  "stateCode": "US_ID",
  "role": "staff" | "provider",
  "pseudonymizedId": "<uuid>"
}
```

This **must** stay in sync with:

- `libs/@idaho-th/shared/src/constants/auth.ts` — `USER_ROLE` (`staff` /
  `provider`), `AUTH0_CONNECTION` (connection names).
- `libs/@idaho-th/trpc/src/auth/constants.ts` — `AUTH0_NAMESPACE`,
  `APP_METADATA_KEY`, `IDAHO_TH_STATE_CODE`.

Persisted `app_metadata` (stored on the Auth0 user, not just the token):

- `pseudonymizedId` — stable per-user pseudonymous id. For providers it is kept
  in sync with the canonical value the backend returns on each login.
- `auth0SubLinked` — set to `true` the first time a provider is successfully
  linked on the backend. It records that linking happened; it does **not** gate
  the webhook — reconciliation runs on every provider login.

---

## Provider linking webhook

On **every** provider login the provider action calls
`POST {BACKEND_API_URL}internal/link-provider` with body:

```jsonc
{ "email": "...", "auth0Sub": "auth0|...", "pseudonymizedId": "<uuid>" }
```

The `pseudonymizedId` in the request is **provisional** — a first-login
placeholder (the existing `app_metadata` value if present, otherwise a fresh
UUID). The backend ignores it once the provider row is linked and returns the
canonical DB value, which the action uses for the JWT claims and writes back to
`app_metadata`.

Security headers (see the action's `callLinkProviderWebhook`, invoked by
`reconcileProviderIdentity`):

- `x-webhook-secret` — shared secret (`BACKEND_WEBHOOK_SECRET`).
- `x-idaho-th-timestamp`, `x-idaho-th-nonce`, `x-idaho-th-signature` —
  HMAC-SHA256 over `${route}.${timestamp}.${nonce}.${rawBody}` using the same
  secret. The route is the Fastify path (e.g. `/internal/link-provider`).
  Timestamp bounds replay; nonce makes each request single-use; signature
  covers the exact bytes sent and binds the request to a single endpoint.

### Expected backend responses

The action does **not** trust HTTP 200 alone — it requires the documented shape:

| Backend response                                                   | Action behavior                                                                                                                |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| `200` + `{ "success": true, "pseudonymizedId": "<non-empty>" }`    | Syncs `app_metadata` (canonical `pseudonymizedId`, `auth0SubLinked = true`) and uses the canonical id for claims. **Success.** |
| `200` missing `success: true` **or** a non-empty `pseudonymizedId` | **Deny** — treated as an unexpected/ambiguous response.                                                                        |
| `404`                                                              | **Deny** — account not provisioned ("contact your administrator").                                                             |
| `409`                                                              | **Deny** — provider already linked to a different Auth0 identity.                                                              |
| Any other non-2xx                                                  | **Deny** — generic authorization error.                                                                                        |
| Network error / timeout (5s)                                       | **Deny** — generic authorization error.                                                                                        |

So the backend `/internal/link-provider` endpoint **must** return
`{ "success": true, "pseudonymizedId": "<canonical DB value>" }` on a successful
link/idempotent re-link, and the documented status codes (`404`/`409`) for the
failure cases above. Anything else — including a `200` without a non-empty
canonical `pseudonymizedId` — fails closed.

## Staff linking webhook

On staff logins, the staff action calls
`POST {BACKEND_API_URL}internal/link-staff` with body:

```jsonc
{ "email": "...", "auth0Sub": "auth0|...", "pseudonymizedId": "<uuid>" }
```

The webhook uses the same signed-header scheme as provider linking. The backend
upserts the `HousingStaff` row and best-effort syncs Intercom without putting
staff email into JWT claims. A successful response can return a canonical
`pseudonymizedId`; the action writes it back to `app_metadata` and uses it in
claims.

Staff linking failure behavior is intentionally different from provider
linking:

| Backend response / error                                | Action behavior                                                          |
| ------------------------------------------------------- | ------------------------------------------------------------------------ |
| `2xx` with canonical `pseudonymizedId`                  | Uses the backend value for claims and `app_metadata`.                    |
| `409`                                                   | **Deny** — staff email is linked to another Auth0 identity.              |
| Any other non-2xx, invalid body, network error, timeout | Logs and **allows** login with the local/app-metadata `pseudonymizedId`. |

---

## Recidiviz staff on the passwordless connection

A Recidiviz address can sign in here as a case manager or as a provider, both
over the emailed one-time code. Two things carry that apart.

### The role the session asked for

The login page puts `idaho_th_role=staff|provider` on `/authorize`, and the
module's `getRequestedRole` reads it from `event.request.query`.

That parameter is only present on the interactive login. Every later token for
the same session is a renewal with no authorize request behind it, so the role
is also pinned to the session when it is first decided, and re-read from there
afterwards:

| Read in order                  | Covers                                      |
| ------------------------------ | ------------------------------------------- |
| `event.request.query`          | the interactive login                       |
| `event.refresh_token.metadata` | refresh-token renewals, scoped to one token |
| `event.session.metadata`       | silent authentication, shared by all tabs   |

Both stores are written, because they cover different renewal paths, and both
writes are wrapped: neither API is on every Auth0 plan, and a login must not
fail over a store that is not there. Without them a renewal would resolve to no
role, which falls through to the provider path — so a staff session would
silently become a provider one on the next page reload.

The provider action pins `provider` for Recidiviz addresses for the same
reason. Session metadata is shared across tabs, so a staff login earlier in the
same browser would otherwise leave `staff` there for a later provider session
to pick up.

**The choice is not a grant.** It selects which question the backend is asked,
and both answers are server-side and fail closed: `staff` has to pass
`/internal/check-recidiviz-staff`, `provider` has to pass
`/internal/link-provider`. Someone who holds neither is denied either way.

### Recidiviz staff provisioning webhook

On a Recidiviz staff login over the passwordless connection, the staff action
calls `POST {BACKEND_API_URL}internal/check-recidiviz-staff` with
`{ "email": "..." }`, using the same signed-header scheme as the others.

| Backend response                                           | Action behavior               |
| ---------------------------------------------------------- | ----------------------------- |
| `200` + `{ "authorized": true }`                           | Proceeds to link + claims     |
| `403`                                                      | **Deny** — no row provisioned |
| Any other non-2xx, unreadable body, network error, timeout | **Deny**                      |

This is deliberately not `/internal/check-staff-authorized`. That route answers
for the staff database connection, where signups are disabled and this tenant
issued the address, so the domain can stand in for the roster this tenant does
not have. On the passwordless connection the address is whatever the person
typed before proving they can read mail at it, so the grant has to be a
`HousingStaff` row somebody provisioned in the Admin Panel. Two questions, two
routes, so widening one cannot widen the other.

Rows are provisioned with `pseudonymizedId` set to the same derivation this
module uses — `sha256("US_ID" + normalizedEmail)`, base64url, first 16 chars —
so `link-staff` finds the row by the identifier the action sends and the login
is a no-op update rather than an adopt.

## Required Action secrets

| Secret                   | Used by          | Description                                                                                                                                                                                        |
| ------------------------ | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `IDAHO_TH_CLIENT_ID`     | staff + provider | Auth0 application (client) id of the Idaho TH app. Comma-separated list supported. Scopes both actions so other apps in the tenant are untouched.                                                  |
| `BACKEND_API_URL`        | staff + provider | Public load-balanced app origin **with trailing slash**, e.g. `https://housing.recidiviz.org/`. The server's raw `*.run.app` URL is not reachable because Cloud Run ingress is load-balancer-only. |
| `BACKEND_WEBHOOK_SECRET` | staff + provider | Shared secret for signed `/internal/*` Auth0 webhooks; must match the backend's value **exactly**.                                                                                                 |

---

## ⚠️ Staging deployment note (provider only)

**Staff is already live on this tenant — do NOT re-apply or duplicate it.
Deploy only the provider action and its secrets here.** Production is applied
by terraform from
`libs/atmos/components/terraform/auth0-staff/actions/post-login/` and takes
nothing from this directory.

Because the flows are split, this is now straightforward:

- **Skip (already live here):** the staff connection
  (`Username-Password-Authentication`) and the existing staff post-login
  action.
- **Apply (provider-related):**
  - add `post-login-set-idaho-th-provider-metadata.js` to the post-login
    trigger,
  - set its `BACKEND_API_URL` / `BACKEND_WEBHOOK_SECRET` Action secrets,
  - ensure `IDAHO_TH_CLIENT_ID` is set so reconciliation only runs for the Idaho
    TH app.

> **Note:** both actions deny unsupported connections (fail closed), so the
> provider action is safe to deploy on a tenant without the staff action. Staff
> logins still need the staff action for claims and `HousingStaff` sync.

The actions are idempotent and safe to deploy alongside existing config (each
no-ops for connections it doesn't own and for other applications), but the
**tenant-level staff connection setup must not be re-created** if it already
exists in production.
