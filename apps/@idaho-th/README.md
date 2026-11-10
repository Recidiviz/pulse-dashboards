# Idaho Transitional Housing Apps

The canonical developer guide for Idaho Transitional Housing lives at [`libs/@idaho-th/README.md`](../../libs/@idaho-th/README.md). Use that README for local development, tests, deployment, SOPS setup, and the high-level tech stack.

This directory contains the deployable app entry points:

| Path             | Purpose                                                                                  |
| ---------------- | ---------------------------------------------------------------------------------------- |
| `client/`        | Vite SPA container entry point and runtime config bootstrap                              |
| `server/`        | Fastify/tRPC API server, internal webhook routes, and server-image Cloud Run job entries |
| `seed-db/`       | Cloud Run seed job entry point                                                           |
| `auth0/actions/` | Auth0 post-login Actions and deployment guide                                            |

Operational runbooks live under `libs/atmos/components/terraform/apps/idaho-th/`.
The server image also backs the migrate, Intercom provider-sync/digest, and
document-janitor jobs; see the deployment runbook before changing job commands
or image rollout behavior.
