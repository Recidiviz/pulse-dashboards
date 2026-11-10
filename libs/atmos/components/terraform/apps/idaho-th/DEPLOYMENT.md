# Idaho TH Deployment Runbook

Deployment reference for `apps/idaho-th`, the Terraform component that owns Idaho Transitional Housing's Cloud SQL instance, Cloud Run server/frontend, migrate/seed jobs, Intercom jobs, document janitor job, load balancer, Cloud Armor, security alerts, and operational monitoring.

For the component index, see [`README.md`](README.md). For rollback and database recovery, see [`ROLLBACK.md`](ROLLBACK.md) and [`BACKUP_RESTORE.md`](BACKUP_RESTORE.md).

## 1. Environment Reference

|                          | Staging                                                                | Production                                                             |
| ------------------------ | ---------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Atmos stack              | `rcdvz-transitional-housing-dev--idaho-th`                             | `recidiviz-transitional-housing--idaho-th`                             |
| Stack file               | `stacks/idaho-th/rcdvz-transitional-housing-dev.yaml`                  | `stacks/idaho-th/recidiviz-transitional-housing.yaml`                  |
| GCP project              | `rcdvz-transitional-housing-dev`                                       | `recidiviz-transitional-housing`                                       |
| Public URL               | https://housing-stg.recidiviz.org                                      | https://housing.recidiviz.org                                          |
| Admin URL                | https://housing-admin-stg.recidiviz.org                                | https://housing-admin.recidiviz.org                                    |
| Cloud Run server         | `idaho-th-server-dev`                                                  | `idaho-th-server`                                                      |
| Cloud Run frontend       | `idaho-th-frontend-dev`                                                | `idaho-th-frontend`                                                    |
| Cloud SQL instance       | `idaho-th-dev`                                                         | `idaho-th`                                                             |
| Migrate / seed jobs      | `idaho-th-migrate-db-dev` / `idaho-th-seed-db-dev`                     | `idaho-th-migrate-db` / `idaho-th-seed-db`                             |
| Intercom jobs            | `idaho-th-intercom-provider-sync`, `idaho-th-intercom-digest`          | `idaho-th-intercom-provider-sync`, `idaho-th-intercom-digest`          |
| Document janitor job     | `idaho-th-document-janitor`                                            | `idaho-th-document-janitor`                                            |
| Server service account   | `<server-service-account>@<project>.iam.gserviceaccount.com`           | `<server-service-account>@<project>.iam.gserviceaccount.com`           |
| Intercom jobs account    | `<intercom-jobs-service-account>@<project>.iam.gserviceaccount.com`    | `<intercom-jobs-service-account>@<project>.iam.gserviceaccount.com`    |
| Document janitor account | `<document-janitor-service-account>@<project>.iam.gserviceaccount.com` | `<document-janitor-service-account>@<project>.iam.gserviceaccount.com` |
| Artifact Registry        | Own project, `idaho-th` repo                                           | Shared with staging's registry                                         |
| SOPS secrets file        | `secrets/rcdvz-transitional-housing-dev.enc.yaml`                      | `secrets/recidiviz-transitional-housing.enc.yaml`                      |
| Cloud SQL public IP      | Disabled                                                               | Disabled                                                               |
| Server/frontend ingress  | Load-balancer only                                                     | Load-balancer only                                                     |
| Sentry environment       | `staging`                                                              | `production`                                                           |
| Security alerts          | `<security-alert-email>`                                               | `<security-alert-email>`                                               |
| Operational alerts       | `<operational-alert-email>`                                            | `<operational-alert-email>`                                            |
| Public uptime check      | Disabled                                                               | Disabled                                                               |

Bucket names and scan pipeline details are in [`MALWARE_SCANNING.md`](MALWARE_SCANNING.md).

## 2. Component Boundaries

| Component               | Owns                                                                                                                                                                                 | Documentation                                                                                                    |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| `apps/idaho-th`         | Cloud SQL, public app Cloud Run services, migrate/seed/Intercom/document-janitor jobs, load balancer, Cloud Armor, Sentry env, security alerts, operational metrics/dashboard/alerts | This document                                                                                                    |
| `apps/malware-scanning` | Upload, clean, quarantine, and CVD mirror buckets; scanner; scan-complete Eventarc triggers; bucket IAM for app/seed/admin/janitor identities                                        | [`MALWARE_SCANNING.md`](MALWARE_SCANNING.md), [`../malware-scanning/RUNBOOK.md`](../malware-scanning/RUNBOOK.md) |
| `apps/idaho-th-admin`   | Admin panel Cloud Run service, global load balancer, IAP, admin Intercom token copy, BigQuery query-job CMEK, admin clean-bucket delete access through scanner IAM                   | [`../idaho-th-admin/README.md`](../idaho-th-admin/README.md)                                                     |

Each component has its own Terraform state file in `{project_id}-tf-state`.

Security note: the admin panel uses a Global load balancer because the shared `recidiviz-data` IAP JWT validator expects a global backend-service audience. This is a deliberate exception to the "US regions only, no global geography" rule. See [`../idaho-th-admin/README.md`](../idaho-th-admin/README.md#security-policy-exception-global-load-balancer).

## 3. First-Time Bootstrap Order

Use this order for a new environment:

1. Apply `apps/idaho-th` to create the Cloud SQL instance, server, frontend, and workload service accounts.
2. Apply `apps/idaho-th-admin` using its README. It depends on the Direct VPC Egress subnet from `apps/idaho-th`.
3. Apply `apps/malware-scanning`. It grants bucket IAM to the app, seed job, admin panel, and document janitor identities, and its scan-complete Eventarc triggers reference the Cloud Run server from step 1.
4. Run seed jobs only after `apps/malware-scanning` has granted clean-bucket read IAM to the seed service account.

Current staging and production are already past bootstrap. For a truly brand-new stack, note that `apps/idaho-th` reads the live Cloud Run server through `data.google_cloud_run_v2_service.server` to compute the scan webhook audience. If the service does not exist yet, the first plan can fail with a 404. Bootstrap the server before enabling scan-complete delivery, then re-apply once the service URI exists.

## 4. Deploying

### 4.1 Application Code

App images are built by `.github/workflows/build-idaho-th-images.yml` on push to `prototype/idaho-transitional-housing-v2`, `prototype/idaho-transitional-housing-v4`, or `release/idaho-th/*` (for example, `release/idaho-th/0a271b55d2`). Release builds publish commit-SHA tags only and leave `latest` unchanged. Staging and production both pull from staging's Artifact Registry.

Use the deployment helper for image deploys:

```bash
yarn deploy-idaho-th
```

The helper:

- requires a clean git tree and `gcloud` application-default credentials;
- verifies that the server, seed, and frontend images exist for the current commit;
- can build missing staging images locally;
- applies `artifact_registry` first when targeting staging;
- applies `apps/idaho-th` with all four image versions pinned to the current commit.

The migrate job, Intercom jobs, and document janitor all run the server image with different commands. The helper still passes a separate `migrate_db_container_version` because Terraform exposes it as a variable, but it points at the same `idaho-th-server:<sha>` image as the API service.

Production deploys must run from one of the supported prototype branches or a release branch matching `release/idaho-th/*`; the deploy helper enforces the same branch rules as CI. Release names must be a single non-empty segment after `release/idaho-th/`. Staging deploys can run from any branch after confirmation.

After the apply, confirm the migrate job executed and succeeded:

```bash
gcloud run jobs executions list \
  --job=<migrate_db_name> \
  --project=<project> \
  --region=us-central1
```

If the migration did not run, execute the job manually with `gcloud run jobs execute`.

The helper does not apply `apps/malware-scanning` or `apps/idaho-th-admin`. Apply those components separately for scanner, bucket IAM, scan-trigger, admin panel, or IAP changes.

### 4.2 Infrastructure Changes

Use direct Atmos commands for feature flags, variables, and resource changes:

```bash
yarn atmos:plan apps/idaho-th -s <stack>
yarn atmos:apply apps/idaho-th -s <stack>
```

Direct applies do not pin image versions automatically. The following variables all default to `"latest"`:

- `server_container_version`
- `migrate_db_container_version`
- `seed_db_container_version`
- `frontend_container_version`

If any of those image values matter for the apply, pass all four explicitly:

```bash
yarn atmos:apply apps/idaho-th -s <stack> -- \
  -var server_container_version=<sha> \
  -var migrate_db_container_version=<sha> \
  -var seed_db_container_version=<sha> \
  -var frontend_container_version=<sha>
```

Otherwise Terraform redeploys whatever `:latest` resolves to at apply time, which may not be the version already running.

Important: every `apps/idaho-th` apply starts the migrate job. The `vendor/cloud-run-job-exec` module posts to the Cloud Run Jobs API with a newly fetched OAuth token on each apply, which causes Terraform to execute `yarn prisma migrate deploy` every time. The API call returns after the job execution is created; Terraform does not wait for the migration to finish. Always review the migration job logs after applying, especially before sending traffic to code that depends on a new schema.

### 4.3 Manual Job Execution

Terraform creates or updates these jobs but does not run them automatically:

- seed job (`exec = false`);
- Intercom provider sync job (`exec = false`);
- Intercom digest job (`exec = false`; Cloud Scheduler runs it on weekdays when enabled).
- document janitor job (`exec = false`; Cloud Scheduler runs it every 6 hours when enabled).

The migrate job is different: `apps/idaho-th` starts it on every Terraform apply.

Run the seed job only after `apps/malware-scanning` has granted clean-bucket read IAM to the seed service account. The seed job imports providers from the configured CSV and, when Intercom is enabled, best-effort syncs provider contacts:

```bash
gcloud run jobs execute <seed_db_name> \
  --project=<project> \
  --region=us-central1 \
  --wait
```

Run the Intercom provider sync manually when providers need to be backfilled into Intercom:

```bash
gcloud run jobs execute idaho-th-intercom-provider-sync \
  --project=<project> \
  --region=us-central1 \
  --wait
```

Run the digest job manually only for an intentional test or replay:

```bash
gcloud run jobs execute idaho-th-intercom-digest \
  --project=<project> \
  --region=us-central1 \
  --wait
```

Run the document janitor manually when investigating orphaned DRAFT intake shells or PENDING document rows:

```bash
gcloud run jobs execute idaho-th-document-janitor \
  --project=<project> \
  --region=us-central1 \
  --wait
```

Pause or resume schedules without Terraform:

```bash
gcloud scheduler jobs pause idaho-th-intercom-digest-schedule \
  --project=<project> \
  --location=us-central1

gcloud scheduler jobs resume idaho-th-intercom-digest-schedule \
  --project=<project> \
  --location=us-central1

gcloud scheduler jobs pause idaho-th-document-janitor-schedule \
  --project=<project> \
  --location=us-central1

gcloud scheduler jobs resume idaho-th-document-janitor-schedule \
  --project=<project> \
  --location=us-central1
```

## 5. Feature Flags

### `apps/idaho-th`

| Flag                                      | Staging                     | Prod                        | Purpose                                                                                                                                                                                                           |
| ----------------------------------------- | --------------------------- | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `enable_security_alerts`                  | `true`                      | `true`                      | Deploys storage, audit-config, firewall, and project-ownership log-based alerts.                                                                                                                                  |
| `security_alert_email`                    | `<security-alert-email>`    | `<security-alert-email>`    | Notification channel for security alerts.                                                                                                                                                                         |
| `enable_operational_monitoring`           | `true`                      | `true`                      | Deploys Cloud Run dashboard tiles, log-based metrics, and alerts for document janitor sweeps, documents stuck in malware scanning, failed scheduled-job runs, and Vertex extraction failures.                     |
| `operational_alert_email`                 | `<operational-alert-email>` | `<operational-alert-email>` | Notification channel for operational log-based alerts.                                                                                                                                                            |
| `enable_uptime_check`                     | `false`                     | `false`                     | Public `/api/health` uptime check and unreachable alert. Keep disabled until Cloud Monitoring uptime checks are allowed in the project.                                                                           |
| `enable_intercom_provider_sync`           | `true`                      | `true`                      | Deploys the manually executed Intercom provider-contact sync job. Terraform creates/updates the job but does not run it.                                                                                          |
| `enable_intercom_digest_scheduler`        | `true`                      | `true`                      | Sends provider digest emails on weekdays at 10:00 AM America/Denver. Pause with `gcloud scheduler jobs pause idaho-th-intercom-digest-schedule --project=<project> --location=us-central1`; resume with `resume`. |
| `enable_document_janitor_scheduler`       | `true`                      | `true`                      | Deploys the document janitor job and 6-hour UTC Cloud Scheduler job. It sweeps orphaned DRAFT intake shells and PENDING document rows.                                                                            |
| `enable_load_balancer`                    | `true`                      | `true`                      | Deploys the regional HTTPS load balancer, frontend Cloud Run service, and Cloud Armor WAF.                                                                                                                        |
| `lock_server_ingress_to_lb`               | `true`                      | `true`                      | Restricts the API Cloud Run service to internal load-balancer ingress.                                                                                                                                            |
| `enable_private_db_egress`                | `true`                      | `true`                      | Uses Direct VPC Egress for Cloud Run resources that connect to Cloud SQL.                                                                                                                                         |
| `ipv4_enabled`                            | `false`                     | `false`                     | Controls whether Cloud SQL has a public IP.                                                                                                                                                                       |
| `create_private_service_access`           | `true`                      | `true`                      | Creates private service access peering. Production's existing peering was imported.                                                                                                                               |
| `server_max_instance_request_concurrency` | `4`                         | `4`                         | Caps concurrent requests per API instance to protect CPU-heavy PDF / Vertex upload paths.                                                                                                                         |

### `apps/idaho-th-admin`

| Flag                                         | Staging | Prod    | Purpose                                                                                                        |
| -------------------------------------------- | ------- | ------- | -------------------------------------------------------------------------------------------------------------- |
| `create_registry`                            | `true`  | `false` | Production shares staging's Artifact Registry repo.                                                            |
| `grant_artifact_registry_cloudrun_agent_iam` | `false` | `true`  | Grants production's Cloud Run service agent cross-project `artifactregistry.reader`.                           |
| `iap_enabled`                                | `true`  | `true`  | Enables IAP on the backend service. First-time setup requires an initial `false` apply and Console enablement. |
| `enable_private_db_egress`                   | `true`  | `true`  | Uses `apps/idaho-th` private connectivity to Cloud SQL.                                                        |
| `server_min_instance_count`                  | `1`     | `1`     | Avoids admin-panel cold starts during schema/blueprint load.                                                   |

## 6. Secrets And Rotation

Staging uses the `idaho_th_dev` SQL secret prefix; production uses `idaho_th`.

| Secret or value                                  | Used by                                                                                      | Notes                                                                                                                                                                                                             |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `{sql_base_secret_name}_db_user`, `_db_password` | Server, seed job, Intercom jobs, document janitor, admin panel, and the actual Postgres user | `google_sql_user.postgres` reads these values at apply time, so they define the database credential, not only app config. The migrate job reads a URL-encoded `DATABASE_URL` secret derived from the same values. |
| `{sql_base_secret_name}_cloudsql_instance_id`    | Cloud SQL module and admin panel                                                             | The shared Cloud SQL module reads this secret to derive the actual instance name. Server and jobs receive `module.database.connection_name`; admin reads the same secret directly.                                |
| `{sql_base_secret_name}_db_host`                 | Admin panel bootstrap/read path                                                              | Connections use the Unix socket, but shared admin code fetches this secret unconditionally.                                                                                                                       |
| `BACKEND_WEBHOOK_SECRET`                         | Internal signed webhooks                                                                     | Used by the Auth0 Actions for `/internal/link-provider` and `/internal/link-staff`; also protects the signed `/internal/check-provider-provisioned` route.                                                        |
| `IDAHO_TH_GOOGLE_PLACES_API_KEY`                 | Server                                                                                       | Used by Google Places-backed provider location lookup.                                                                                                                                                            |
| `IDAHO_TH_RECIDIVIZ_STAFF_ALLOWLIST`             | Server                                                                                       | Comma-separated allowlist of Recidiviz staff granted Idaho TH in production. Read by the sign-in router and the post-login Action. Empty denies all Recidiviz staff. Staging ignores it; the domain is the grant. |
| `SEGMENT_WRITE_KEY`                              | Server                                                                                       | Server-side Segment analytics key.                                                                                                                                                                                |
| `INTERCOM_TOKEN`                                 | Seed job, Intercom digest/provider sync jobs; copied for admin panel                         | The seed job and Intercom jobs read it through Secret Manager. `apps/idaho-th-admin` copies this into `idaho_th_intercom_token` during apply.                                                                     |
| `INTERCOM_ADMIN_ID`                              | Intercom digest/provider sync jobs                                                           | Plain env var from SOPS, not a Secret Manager versioned secret.                                                                                                                                                   |

Deployed workloads read true secrets from Google Secret Manager. Public or non-credential config such as Auth0 domain/audience/client id, Document AI processor config, Google project/location, Vertex model, `APP_ENV`, and Sentry DSN/env are injected as plain Cloud Run env vars. Local development uses the SOPS file listed in [Environment Reference](#1-environment-reference).

### Workload Secret Boundaries

| Workload                      | Secret access                                                                                                                                              |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Server API                    | Server secret env keys, DB user/password, GCS signed-url self token creator, Document AI, Vertex AI, Google Places, Segment                                |
| Migrate job                   | URL-encoded `DATABASE_URL` only                                                                                                                            |
| Seed job                      | DB user/password, provider CSV object name, clean-bucket read IAM from `apps/malware-scanning`, and Intercom token when Intercom jobs are enabled          |
| Intercom provider sync/digest | DB user/password, `INTERCOM_TOKEN`, `INTERCOM_ADMIN_ID`, Sentry env; deliberately no Auth0, Places, Segment, webhook, Document AI, Vertex, or GCS scan env |
| Document janitor              | DB user/password, upload/clean bucket names, clean-bucket delete IAM from `apps/malware-scanning`, Sentry env; deliberately no Intercom token              |
| Frontend                      | Public Auth0/API runtime config only, written to `/config.js` at container startup                                                                         |

### Rotate Database Credentials

1. Add the new secret version.
2. Apply `apps/idaho-th`. This updates `google_sql_user.postgres`, which is the step that changes the live Postgres password.
3. Confirm the generated `{sql_base_secret_name}_us_id_migrate_db_url` secret has a new version. The migrate job reads this URL-encoded `DATABASE_URL`, not raw user/password env vars.
4. Force new revisions or job executions for workloads that need to pick up `latest`: server, seed, Intercom jobs, document janitor, and admin as applicable.
5. Confirm the migrate job succeeds. Run seed manually only if the rotation or deploy requires it.
6. Verify the admin panel. It reads Secret Manager at runtime through shared `recidiviz-data` code, so it should pick up the latest version subject to that code's caching behavior.

### Rotate Intercom Values

`INTERCOM_TOKEN` is injected into Intercom jobs through `secret_key_ref`; new job executions pick up `latest`. Re-apply `apps/idaho-th-admin` after rotating it so the copied `idaho_th_intercom_token` secret is refreshed.

`INTERCOM_ADMIN_ID` is a plain env var sourced from SOPS. Rotate it by editing the SOPS-encrypted file for the target stack and applying `apps/idaho-th`. The admin panel does not read this value.

## 7. WAF / Cloud Armor

`apps/idaho-th` owns a Cloud Armor policy for its load balancer. Each OWASP category is evaluated as a separate rule with `evaluatePreconfiguredWaf(...)`.

Two categories are excluded for a single free-text draft-submission route because they produced known false positives:

| Priority | Category | Excluded path                                   | Reason                                                                 |
| -------- | -------- | ----------------------------------------------- | ---------------------------------------------------------------------- |
| 1000     | SQLi     | `POST /api/trpc/housingApplication.submitDraft` | Free-text fields can contain ordinary words that overlap SQL keywords. |
| 1004     | RCE      | `POST /api/trpc/housingApplication.submitDraft` | Free-text wording/punctuation can match the RCE ruleset.               |

All other WAF categories and the rate limiter still apply to that route. The route is also Auth0-gated in the application.

Cloud Run invoker IAM is intentionally not the user-auth boundary. The server and frontend grant `roles/run.invoker` to `allUsers`, while user-facing auth is enforced by Auth0 in the app. Internal webhook routes under `/internal/*` are routed by the load balancer to the API backend, and each route verifies its own caller. The malware-scan webhook verifies Google-signed Eventarc OIDC on `/internal/gcs-object-scanned`. Signed Auth0-facing webhooks (`/internal/link-provider`, `/internal/link-staff`, and `/internal/check-provider-provisioned`) verify HMAC headers signed with `BACKEND_WEBHOOK_SECRET`.

Both Cloud Run services are still load-balancer-only at the ingress layer:

- server: `lock_server_ingress_to_lb: true`
- frontend: hardcoded in `frontend.tf` as `INGRESS_TRAFFIC_INTERNAL_LOAD_BALANCER`

Neither service is reachable through its raw `*.run.app` URL.

## 8. Outputs

```bash
yarn atmos terraform output apps/idaho-th <output_name> -s <stack>
```

| Output                           | Description                                                                     |
| -------------------------------- | ------------------------------------------------------------------------------- |
| `service_account_email`          | Server service account                                                          |
| `frontend_service_account_email` | Frontend service account, or `null` when the load balancer is disabled          |
| `service_account_emails`         | Server, frontend, migrate-db, and seed-db service accounts                      |
| `direct_egress_subnetwork_name`  | Direct VPC Egress subnet name                                                   |
| `cloud_run_service_uri`          | Server Cloud Run URI                                                            |
| `pdf_bucket_name`                | Active upload bucket: clean when scanning is off, unscanned when scanning is on |
| `pdf_clean_bucket_name`          | Malware-scanned clean bucket                                                    |
| `pdf_quarantined_bucket_name`    | Quarantine bucket                                                               |
| `malware_scan_webhook_config`    | Webhook path, OIDC audience, bucket names, and scan-events service account      |
| `load_balancer_ip`               | External IPv4 address of the load balancer, or `null` when disabled             |
| `app_url`                        | Public app URL, or `null` when disabled                                         |

`service_account_emails` intentionally exposes only the core server/frontend/migrate/seed identities. The scheduled-job identities are deterministic from stack config:

| Identity         | Service account placeholder          | Purpose                                                                 |
| ---------------- | ------------------------------------ | ----------------------------------------------------------------------- |
| Intercom jobs    | `<intercom-jobs-service-account>`    | Provider-contact sync and weekday digest jobs                           |
| Document janitor | `<document-janitor-service-account>` | 6-hour orphaned document/intake cleanup job; clean-bucket delete access |

## 9. Post-Deploy Verification

- [ ] `gcloud run services describe <server_name> --project=<project> --region=us-central1` reports `Ready: True`.
- [ ] `gcloud run services describe <frontend_name> --project=<project> --region=us-central1` reports `Ready: True`.
- [ ] Latest migrate job execution succeeded:

```bash
gcloud run jobs executions list \
  --job=<migrate_db_name> \
  --project=<project> \
  --region=us-central1 \
  --limit=5
```

- [ ] `gcloud sql instances describe <sql_instance_name> --project=<project> --format="value(ipAddresses)"` shows only a `PRIVATE` address.
- [ ] `gcloud monitoring policies list --project=<project>` includes the four security-alert policies when `enable_security_alerts` and `security_alert_email` are set.
- [ ] `gcloud monitoring policies list --project=<project>` includes the operational alert policies when `enable_operational_monitoring` and `operational_alert_email` are set: document janitor sweeps, documents stuck waiting on a malware scan, Vertex extraction failures, and scheduled job execution failed.
- [ ] `gcloud monitoring dashboards list --project=<project>` includes the `${server_name} (us-central1)` dashboard when operational monitoring is enabled.
- [ ] `gcloud scheduler jobs list --project=<project> --location=us-central1` includes the Intercom digest scheduler and document janitor scheduler when enabled.
- [ ] `yarn atmos terraform output apps/idaho-th malware_scan_webhook_config -s <stack>` shows `triggers_enabled = true` in staging/prod.
- [ ] Public app URL and admin URL load through the configured domains.

## 10. Useful Logs

Server logs:

```bash
gcloud logging read \
  'resource.type="cloud_run_revision" AND resource.labels.service_name="<server_name>"' \
  --project=<project> \
  --limit=100 \
  --format="table(timestamp,severity,textPayload,jsonPayload.message)"
```

Cloud Run job logs:

```bash
gcloud logging read \
  'resource.type="cloud_run_job" AND resource.labels.job_name="<job_name>"' \
  --project=<project> \
  --limit=100 \
  --format="table(timestamp,severity,textPayload,jsonPayload.message)"
```

Common job names:

| Job                    | Staging                           | Production                        |
| ---------------------- | --------------------------------- | --------------------------------- |
| Migrate                | `idaho-th-migrate-db-dev`         | `idaho-th-migrate-db`             |
| Seed                   | `idaho-th-seed-db-dev`            | `idaho-th-seed-db`                |
| Intercom provider sync | `idaho-th-intercom-provider-sync` | `idaho-th-intercom-provider-sync` |
| Intercom digest        | `idaho-th-intercom-digest`        | `idaho-th-intercom-digest`        |
| Document janitor       | `idaho-th-document-janitor`       | `idaho-th-document-janitor`       |

Document janitor sweeps:

```bash
gcloud logging read \
  'resource.type="cloud_run_job" AND resource.labels.job_name="idaho-th-document-janitor" AND jsonPayload.job="document-janitor"' \
  --project=<project> \
  --limit=50 \
  --format="table(timestamp,severity,jsonPayload.event,jsonPayload.expiredIntakeShells,jsonPayload.expiredInfectedIntakeShells,jsonPayload.expiredPendingDocuments,jsonPayload.failedIntakeShells,jsonPayload.failedPendingDocuments,jsonPayload.stuckScanDocuments)"
```

Vertex extraction failures:

```bash
gcloud logging read \
  'resource.type="cloud_run_revision" AND resource.labels.service_name="<server_name>" AND jsonPayload.message="extractWithVertexAIFromDocument failed"' \
  --project=<project> \
  --limit=50 \
  --format="table(timestamp,severity,jsonPayload.procedureName,jsonPayload.message)"
```

Recent Cloud SQL operations:

```bash
gcloud sql operations list \
  --instance=<sql_instance_name> \
  --project=<project> \
  --limit=10
```

## 11. Troubleshooting

Malware-scanning failures are covered in [`MALWARE_SCANNING.md`](MALWARE_SCANNING.md#10-troubleshooting) and [`../malware-scanning/RUNBOOK.md`](../malware-scanning/RUNBOOK.md#13-troubleshooting).

| Symptom                                                                    | Likely cause                                                                             | Action                                                                                                                                                                |
| -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Every apply starts the migrate job                                         | Expected `cloud-run-job-exec` behavior                                                   | Confirm the latest execution is a no-op or completed migration.                                                                                                       |
| Migrate job fails with `P3009`                                             | A previous migration failed and left a blocking marker                                   | Use [`ROLLBACK.md`](ROLLBACK.md#4-migration-failure-recovery).                                                                                                        |
| Admin plan fails with a data-source 404                                    | `apps/idaho-th-admin` applied before `apps/idaho-th` existed                             | Apply `apps/idaho-th` first, then re-plan admin.                                                                                                                      |
| First `apps/idaho-th` plan for a new stack fails reading Cloud Run service | `data.google_cloud_run_v2_service.server` needs the server URI for scan webhook audience | Bootstrap the server before enabling scan-complete delivery, then re-apply once the service URI exists.                                                               |
| Document janitor schedule exists but bucket deletes fail                   | Missing clean-bucket delete IAM from `apps/malware-scanning`                             | Ensure `<document-janitor-service-account>@<project>.iam.gserviceaccount.com` is listed in `app_storage_delete_members.idaho-th`, then apply `apps/malware-scanning`. |
| Intercom job cannot read token                                             | Intercom SOPS keys missing or Secret Manager IAM not applied                             | Confirm `INTERCOM_TOKEN` and `INTERCOM_ADMIN_ID` exist in the stack SOPS file and re-apply `apps/idaho-th`.                                                           |
| Public uptime check is missing                                             | `enable_uptime_check` is intentionally `false` in both stacks                            | Use Cloud Run/dashboard/log-based signals until uptime checks are approved and enabled.                                                                               |
| Raw `*.run.app` URL fails                                                  | Expected load-balancer-only ingress                                                      | Use the public app/admin domains.                                                                                                                                     |

## Related Documentation

| Document                                                           | Contents                               |
| ------------------------------------------------------------------ | -------------------------------------- |
| [`README.md`](README.md)                                           | Idaho TH infrastructure index          |
| [`ROLLBACK.md`](ROLLBACK.md)                                       | Rollback and migration recovery        |
| [`BACKUP_RESTORE.md`](BACKUP_RESTORE.md)                           | Cloud SQL backup and restore           |
| [`MALWARE_SCANNING.md`](MALWARE_SCANNING.md)                       | Idaho TH malware-scanning deployment   |
| [`../malware-scanning/RUNBOOK.md`](../malware-scanning/RUNBOOK.md) | Generic malware-scanning runbook       |
| [`../idaho-th-admin/README.md`](../idaho-th-admin/README.md)       | Admin panel deployment and IAP details |
