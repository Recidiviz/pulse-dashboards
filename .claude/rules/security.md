# Security Rules

These rules apply to all code in the repository. They are non-negotiable.

## Authentication

- All JWT verification is centralized in `libs/common/server-setup-plugin/src/trpc/index.ts`:
  - `verifyAuth0Token()` for Auth0 staff/provider authentication
  - `verifyFirebaseIdToken()` for JII user authentication
  - `verifyRegularJwtToken()` for JWT-based auth (WebSocket support)
- **Never verify tokens inline in route handlers.** Always call these functions from `context.ts`.
- Every tRPC `context.ts` must validate the auth token and attach the result to context.
- Every database query must be scoped to the authenticated user's state code and permissions. Never return unscoped data.
- New user types (e.g., housing providers) may require a new Auth0 tenant. Do not add users to existing tenants without explicit approval.
- Tokens belong in `Authorization: Bearer` headers only. Never in URLs, never in localStorage.

| Don't                                                                       | Do                                                                                                                                                |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| JWT verification inside a route handler                                     | Centralize in `context.ts` using `verifyAuth0Token()` or `verifyFirebaseIdToken()` from `~server-setup-plugin`                                    |
| Unscoped Prisma query (no user/state code filter)                           | Every query must be scoped to the authenticated user's permissions and state code                                                                 |
| `localStorage.setItem` or `sessionStorage.setItem` to _store_ tokens or PII | Use Auth0 SDK or Firebase Auth SDK in-memory storage. Never persist tokens or PII in browser storage. (Removing tokens via `removeItem` is fine.) |
| Client-side-only authorization check                                        | Always enforce authorization server-side. Client-side checks are cosmetic only                                                                    |

## Secrets

- All production secrets go in Google Secret Manager. All development secrets go in SOPS-encrypted YAML files (`env.*.enc.yaml`).
- Never commit secrets, `.env` files (except `.env.example`), API keys, or credentials.
- `.env.local` is gitignored and acceptable for local development only.
- If a secret is accidentally committed, it must be rotated immediately. Git history is permanent.
- Frontend env vars prefixed with `VITE_` or `NEXT_PUBLIC_` are intentionally public. Never put server-side secrets behind these prefixes.

| Don't                                                        | Do                                                                                                      |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| Hardcoded credentials, API keys, or passwords in source code | Load from environment variables. Production: Secret Manager. Dev: `.env.local` (gitignored)             |
| Server-side secret behind `VITE_` or `NEXT_PUBLIC_` prefix   | These prefixes are intentionally public. Server secrets must never use them                             |
| Committed `.env` file containing real values                 | Only `.env.example` with placeholder values. Real values in `.env.local` (gitignored) or Secret Manager |

## Data Isolation and PII

- All database queries must be scoped to the authenticated user's state code. Data must never leak between states.
- Never log PII (names, emails, DOBs, SSNs, phone numbers, addresses) in server-side logs (`console.log`, `console.error`, `logger.*`, Sentry breadcrumbs). This rule applies to server logs and error reporting, not to user-facing UI or internal Slack notifications.
- Use `pseudonymizedId` fields for logging — never `firstName`, `lastName`, `email`, or other identifying fields. Reference examples:
  - `libs/@jii-texting/utils/src/common/utils.ts` — logs `pseudonymizedId`, never real names
  - `libs/@reentry/trpc/src/routes/client/client.router.ts` — queries by `pseudonymizedId`, not name/email
  - `libs/@reentry/frontend-shared/src/auth/types.ts` — `UserAppMetadata` carries `pseudonymizedId`

| Don't                                                                                   | Do                                                                                     |
| --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `prisma.$queryRawUnsafe()` with user input                                              | Use parameterized `prisma.$queryRaw` with template literals, or Prisma's query builder |
| Server-side fetch with user-controlled URL (SSRF)                                       | Validate and allowlist external URLs. Never let user input control fetch destinations  |
| Logging PII (`firstName`, `lastName`, `email`, DOB, SSN, phone, address) in server logs | Log `pseudonymizedId` instead                                                          |
| `dangerouslySetInnerHTML` with unsanitized input                                        | Use `DOMPurify.sanitize()` with appropriate config. Prefer React JSX when possible     |
| Constructing URLs from unvalidated user input                                           | Validate against an allowlist of permitted domains/paths                               |
| Unvalidated redirect (e.g., `window.location.href = params.get('redirect')`)            | Validate redirect target against an allowlist of permitted paths                       |

## Logging

- Emit structured JSON logs to stdout using Fastify's built-in logger. Do not use `console.log` in server code.
- Log auth events from day one: `login_success`, `login_failed`, `session_expired`, `permission_denied`.
- Never log tokens, passwords, magic link URLs, full email addresses, or PII.
- Do not disable Cloud Audit Logs or Cloud Run request logging.

## AI / LLM

- Do not add new AI/LLM API integrations. Prefer GCP AI services (Vertex AI, Gemini) that are already approved.
- AI vendors must not use data for model training and must enforce zero data retention.
- Endpoints that process user-generated content (free text, file uploads) need additional input validation and sanitization.

## Infrastructure

- All GCP infrastructure must be managed via Terraform + Atmos (`libs/atmos/`).
- No GCP resources created via the console or ad-hoc `gcloud` commands. If it exists, it must be in Terraform.
- US regions only for all GCP resources. No `global` or non-US geography. Prefer multi-region over single-region when available.
- Cloud SQL connections use Unix sockets in deployed environments. Not TCP, not public IP.
- Never use `origin: "*"` in CORS config for deployed (non-local) environments. Allowlist specific origins.

| Don't                                                | Do                                                               |
| ---------------------------------------------------- | ---------------------------------------------------------------- |
| `origin: "*"` in CORS config (non-local environment) | Allowlist specific origins for staging and production            |
| `POSTGRES_HOST_AUTH_METHOD=trust`                    | Always require password authentication for PostgreSQL            |
| Cloud SQL via TCP or public IP                       | Use Unix socket connections in deployed GCP environments         |
| GCP resources created via console or ad-hoc `gcloud` | All infrastructure in Terraform managed by Atmos (`libs/atmos/`) |
| GCP resources outside US regions                     | US regions only. No `global` or non-US geography                 |

## Dependencies and CI

- Approved third-party services: GCP (within Assured Workloads), Auth0, GitHub, `@recidiviz/design-system`. Do not add imports or dependencies for unapproved services.
- Pin dependency versions. Do not use `^` or `~` ranges for new additions.
- Review new dependencies for known vulnerabilities before adding. Never install packages with known high or critical CVEs.

| Don't                                    | Do                            |
| ---------------------------------------- | ----------------------------- |
| Creating or editing `.github/workflows/` | Do not modify CI/CD workflows |
