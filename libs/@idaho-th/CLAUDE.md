# Idaho Transitional Housing — Contractor Prototype

This is a contractor-built prototype for transitional housing management in Idaho. It follows the standard Recidiviz monorepo patterns. Release work currently targets `prototype/idaho-transitional-housing-v4`.

## Quick Reference

| What                | Where                                                                         |
| ------------------- | ----------------------------------------------------------------------------- |
| Auth0 Actions       | `apps/@idaho-th/auth0/actions/` (deploy in Dashboard)                         |
| Auth0 SPA settings  | `apps/@idaho-th/client/src/auth0/getAuth0Settings.ts`                         |
| Runtime config      | `libs/@idaho-th/client/src/runtimeConfig.ts` (`/config.js` on Cloud Run + LB) |
| Database schema     | `libs/@idaho-th/prisma/prisma/schema.prisma`                                  |
| tRPC routes         | `libs/@idaho-th/trpc/src/routes/`                                             |
| tRPC context (auth) | `libs/@idaho-th/trpc/src/context.ts`                                          |
| tRPC init           | `libs/@idaho-th/trpc/src/init.ts`                                             |
| Server entry point  | `apps/@idaho-th/server/src/server/index.ts`                                   |
| Frontend client     | `libs/@idaho-th/client/`                                                      |
| Terraform           | `libs/atmos/components/terraform/apps/idaho-th/`                              |
| GCP dev project     | `rcdvz-transitional-housing-dev`                                              |
| GCP prod project    | `recidiviz-transitional-housing`                                              |

## Commands

```bash
yarn nx run @idaho-th/prisma:docker      # Start local Postgres
yarn nx prisma-generate @idaho-th/prisma # Generate Prisma client
yarn nx prisma-migrate @idaho-th/prisma  # Run migrations
yarn nx prisma-seed @idaho-th/prisma     # Seed fixture data
yarn nx dev @idaho-th/server             # Start server (port 3010)
yarn nx test @idaho-th/trpc              # Run backend tests
```

## Architecture Patterns

Follow these reference implementations exactly:

- **Server entry point**: `apps/@sentencing/server/src/server/index.ts`
- **tRPC routes/context/init**: `libs/@sentencing/trpc/src/`
- **Prisma schema**: `libs/@sentencing/prisma/`
- **Frontend client**: `libs/sentencing-client/`

### Adding a new route

1. Create `libs/@idaho-th/trpc/src/routes/my-feature/`
2. Add files: `my-feature.router.ts`, `my-feature.schema.ts`, `my-feature.helpers.ts`, `my-feature.types.ts`
3. Define Zod schemas in the `.schema.ts` file
4. Put Prisma queries in `.helpers.ts`, never inline in the router
5. Register the router in `libs/@idaho-th/trpc/src/router.ts`

### Data model

The Prisma schema centers on `HousingApplication`, `HousingProvider`,
`HousingStaff`, provider/application join tables, document rows, timeline rows,
AI extraction metrics, and Intercom digest attempts. Use `pseudonymizedId` or
request IDs for logging — never log real names, emails, PDF contents, or other
PII.

## Data Fetching Pattern

- We call tRPC/React Query hooks wherever the data is needed, including from both a parent and a child component with the same input. React Query dedupes by query key, so only one network request fires and every caller shares the same cache entry. We do not lift state and prop-drill it down purely to have a single call site. Example: `useProviderInfoRequests(applicationId, true)` is called independently in both `ProviderApplicationDetailsView` and its child `ApplicationResponseSelector`.

## Security Requirements

- **Auth**: JWT verification is centralized in `context.ts` using `verifyAuth0Token()` from `~server-setup-plugin`. Do not add auth checks in route handlers.
- **Auth0 Actions**: Post-login claim logic is versioned under `apps/@idaho-th/auth0/actions/`; deploy to the Idaho TH Auth0 tenant (see `apps/@idaho-th/auth0/actions/README.md` and `apps/@idaho-th/auth0/actions/DEPLOYMENT.md`). `USER_ROLE` in `libs/@idaho-th/shared` must match the Action.
- **Internal webhooks**: Auth0 routes under `/internal/link-provider`,
  `/internal/link-staff`, and `/internal/check-provider-provisioned` verify
  signed HMAC headers. The malware-scan webhook verifies Google-signed Eventarc
  OIDC. Do not treat the load balancer as the auth boundary for these routes.
- **Scoped queries**: Every database query must filter by the authenticated user's state code. Never return unscoped data.
- **Secrets**: Use SOPS-encrypted env files (`env.*.enc.yaml`) for local dev. Production secrets go in GCP Secret Manager.
- **Logging**: Use Fastify's structured JSON logger. Never `console.log` in server code. Never log PII.
- **Infrastructure**: All GCP resources in Terraform (`libs/atmos/`). US regions only.
