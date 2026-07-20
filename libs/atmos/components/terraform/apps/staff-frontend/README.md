# `staff-frontend`

Serves the staff dashboard frontend (`dist/apps/staff`, a static SPA) from a
private, CMEK-encrypted GCS bucket behind Google Cloud CDN and a global external
Application Load Balancer.

## Architecture

```
DNS A record (managed outside this repo) → global static IP
  → global external ALB (EXTERNAL_MANAGED), TLS 1.2+ (RESTRICTED policy), HTTP→HTTPS redirect
  → URL map
      /            → html backend bucket, rewritten to /index.html
      /assets/*    → assets backend bucket (1y edge TTL)
      /__lb-shim/* → shim backend service (load-bearing; see below)
      default      → html backend bucket (1h edge TTL)
      404 anywhere → custom error response policy serves /index.html (200)
  → 3 backend buckets (enable_cdn, dynamic Brotli, CSP/XFO/Reporting-Endpoints headers)
      main bucket  (private, PAP enforced, CMEK): app build; read only by the LB service agent
      index bucket (public, CMEK): index.html only — the SPA fallback's error_service
```

Two non-obvious pieces, both required (details in `ROLLOUT.md` and inline comments):

- **Private origin, no `allUsers`.** The main bucket is read only by the Cloud
  Load Balancing service agent (`service-<project#>@https-lb.iam.gserviceaccount.com`),
  granted `objectViewer` — that IAM grant _is_ Cloud CDN "private bucket access"
  (there is no enable flag). Authenticated GCS reads return `Cache-Control:
private`, so caching is forced via `FORCE_CACHE_ALL`; two backend buckets over
  the same GCS bucket recover Firebase's assets-vs-HTML cache tiers.
- **SPA deep-link fallback.** A URL-map custom error response policy rewrites any
  404 to `/index.html` (replacing Firebase's `** → /index.html`). It requires (a)
  a publicly readable `error_service` — hence the separate public **index bucket**
  — and (b) at least one backend _service_ on the LB — hence the **shim** (a
  backendless service on `/__lb-shim/*` that never takes traffic). Remove either
  and the fallback silently stops working.

## Files

| File               | Contents                                                                                                                                   |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `providers.tf`     | Terraform/`google` provider pins                                                                                                           |
| `variables.tf`     | Inputs (see below)                                                                                                                         |
| `main.tf`          | The two GCS buckets + their IAM (private main, public index, LB-agent grant, deployer grants)                                              |
| `kms.tf`           | CMEK key ring/key (location `us`) + GCS service-agent grant                                                                                |
| `load_balancer.tf` | Backend buckets, CDN policy, response headers, URL map, shim, classic cert, SSL policy, IP, proxies, forwarding rules, HTTP→HTTPS redirect |
| `certificates.tf`  | Certificate Manager DNS-auth certs + certificate map (for zero-downtime domain cutover)                                                    |
| `iam.tf`           | Custom role for CDN cache invalidation, granted to deployers                                                                               |
| `outputs.tf`       | LB IP, url-map name, bucket names, required DNS + cert-authorization records, cert state                                                   |
| `ROLLOUT.md`       | Migration motivation, benchmark, and the 5-phase cutover runbook                                                                           |

Response headers (CSP, `X-Frame-Options`, `Reporting-Endpoints`) are duplicated
from the repo-root `firebase.json` into a `local` in `load_balancer.tf` — **keep
the two in sync** until Firebase Hosting is retired for staff.

## Variables

| Variable               | Type         | Default | Purpose                                                                                                                            |
| ---------------------- | ------------ | ------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `project_id`           | string       | —       | Project the serving infra lives in                                                                                                 |
| `environment`          | string       | —       | Name suffix on resources (`staging`, `production`)                                                                                 |
| `domain_names`         | list(string) | —       | Domains served. First is primary (classic cert); append the real domain at cutover                                                 |
| `bucket_name`          | string       | —       | Name of the private origin bucket (the public one is `<bucket_name>-index`)                                                        |
| `deployer_members`     | list(string) | `[]`    | Principals granted build upload + cache invalidation                                                                               |
| `asset_retention_days` | number       | `30`    | Object age before lifecycle deletion. Deploys re-upload (resetting age), so the live site depends on deploying at least this often |

## Outputs

| Output                             | Use                                                                                       |
| ---------------------------------- | ----------------------------------------------------------------------------------------- |
| `load_balancer_ip`                 | The A-record target                                                                       |
| `url_map_name`                     | Passed to `gcloud ... invalidate-cdn-cache` by the deploy tool                            |
| `bucket_name`, `index_bucket_name` | Upload targets                                                                            |
| `required_dns_records`             | A records to hand to the DNS team                                                         |
| `cert_dns_authorization_records`   | CNAMEs the DNS team adds so Certificate Manager certs validate **before** any DNS cutover |
| `certificate_map_state`            | Per-domain cert state`                                                                    |

## Deploying

Two independent steps — infrastructure (Terraform) and content (the build upload):

**Infrastructure.** A stack under `libs/atmos/stacks/staff/` references this
component by its directory path (`apps/staff-cdn`) and supplies the variables:

```bash
cd libs/atmos
atmos terraform plan  apps/staff-cdn -s recidiviz-dashboard-staging--staff
atmos terraform apply apps/staff-cdn -s recidiviz-dashboard-staging--staff
```

DNS is **not** managed here: after apply, hand `required_dns_records` (and, for a
cutover, `cert_dns_authorization_records`) to whoever owns the `recidiviz.org`
zone.

**Content.** `tools/deploy-staff-frontend.mts` uploads a build and invalidates
the CDN cache (also `nx deploy-cdn staff -- <env>`, and wired into `yarn deploy`.
It uploads content-hashed assets first and
`index.html` last, and never deletes — stale files age out via
`asset_retention_days`, so tabs open across a deploy keep working.

See `ROLLOUT.md` Phase 3 for the full runbook.

## Known constraints

- **Private bucket access is a recent GA feature** (2026-07). Bake on staging
  before trusting it in production.
- **Compression stays `AUTOMATIC`** (dynamic Brotli). Do not pre-compress at
  upload: GCS won't transcode stored Brotli for non-`br` clients.
