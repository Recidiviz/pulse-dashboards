# Idaho Transitional Housing Infrastructure

This directory is the entry point for Idaho Transitional Housing infrastructure. The system is split across three Terraform components with separate state files in each project Terraform state bucket. Plan and apply each component independently.

## Environments

|                   | Staging                                    | Production                                 |
| ----------------- | ------------------------------------------ | ------------------------------------------ |
| Atmos stack       | `rcdvz-transitional-housing-dev--idaho-th` | `recidiviz-transitional-housing--idaho-th` |
| GCP project       | `rcdvz-transitional-housing-dev`           | `recidiviz-transitional-housing`           |
| Public app        | https://housing-stg.recidiviz.org          | https://housing.recidiviz.org              |
| Admin panel       | https://housing-admin-stg.recidiviz.org    | https://housing-admin.recidiviz.org        |
| Artifact Registry | Own project, `idaho-th` repo               | Pulls from staging/dev registry            |

## Components

| Component               | Owns                                                                                                                                                                                       | Start here                                                                                                       |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| `apps/idaho-th`         | Cloud SQL, Cloud Run server/frontend, migrate/seed jobs, Intercom jobs, document janitor job, regional load balancer, Cloud Armor, Sentry env, security alerts, and operational monitoring | [`DEPLOYMENT.md`](DEPLOYMENT.md), [`ROLLBACK.md`](ROLLBACK.md), [`BACKUP_RESTORE.md`](BACKUP_RESTORE.md)         |
| `apps/malware-scanning` | Upload, clean, quarantine, and CVD mirror buckets; ClamAV scanner; scan-complete Eventarc triggers; clean-bucket read/delete IAM for seed/admin/janitor identities                         | [`MALWARE_SCANNING.md`](MALWARE_SCANNING.md), [`../malware-scanning/RUNBOOK.md`](../malware-scanning/RUNBOOK.md) |
| `apps/idaho-th-admin`   | Admin panel Cloud Run service, admin load balancer, IAP, admin Intercom token copy, BigQuery query-job CMEK, and admin clean-bucket delete access through scanner IAM                      | [`../idaho-th-admin/README.md`](../idaho-th-admin/README.md)                                                     |

`apps/idaho-th` is the base component. For a new environment, create it before the scanner or admin panel because the dependent components reference its Cloud Run service, service accounts, and private networking. Existing-bucket scanner migrations have a special one-time order documented in [`MALWARE_SCANNING.md`](MALWARE_SCANNING.md#2-one-time-bucket-migration).

## Current State

- Staging and production both use load-balancer-only ingress for the public server and frontend.
- Cloud SQL public IP is disabled in both environments; Cloud Run uses private egress.
- Malware scanning is fully enabled in both environments, including scan-complete webhooks and the CVD mirror scheduler.
- Intercom provider sync and weekday digest jobs are enabled in both environments. Provider sync is manual; digest is scheduled.
- The document janitor scheduler is enabled in both environments and runs every 6 hours to clean orphaned DRAFT intake shells and PENDING document rows.
- Security alert policies are enabled in both environments and notify `<security-alert-email>`; operational metrics, dashboards, and log-based alerts are enabled and notify `<operational-alert-email>`.
- Public uptime checks are intentionally disabled in both stacks until Cloud Monitoring uptime checks are allowed in the projects.
- The admin panel is protected by IAP in both environments. Its global load balancer is a documented exception required by the shared admin auth code.

## Common Commands

Deploy Idaho TH app images with SHA-pinned versions:

```bash
yarn deploy-idaho-th
```

Plan/apply the base component:

```bash
yarn atmos:plan apps/idaho-th -s <stack>
yarn atmos:apply apps/idaho-th -s <stack>
```

Plan/apply malware scanning:

```bash
yarn atmos:plan apps/malware-scanning -s <stack>
yarn atmos:apply apps/malware-scanning -s <stack>
```

Plan/apply the admin panel:

```bash
yarn atmos:plan apps/idaho-th-admin -s <stack>
yarn atmos:apply apps/idaho-th-admin -s <stack>
```

Inspect useful outputs:

```bash
yarn atmos terraform output apps/idaho-th cloud_run_service_uri -s <stack>
yarn atmos terraform output apps/idaho-th malware_scan_webhook_config -s <stack>
yarn atmos terraform output apps/idaho-th app_url -s <stack>
yarn atmos terraform output apps/malware-scanning malware_services -s <stack>
yarn atmos terraform output apps/idaho-th-admin load_balancer_ip -s <stack>
```

## Operator Guide

| Need                                                   | Use                                                                                                        |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| Deploy app images or infrastructure changes            | [`DEPLOYMENT.md`](DEPLOYMENT.md)                                                                           |
| Roll back a bad Cloud Run revision or Terraform change | [`ROLLBACK.md`](ROLLBACK.md)                                                                               |
| Recover corrupted database rows or replace Cloud SQL   | [`BACKUP_RESTORE.md`](BACKUP_RESTORE.md)                                                                   |
| Operate Idaho TH malware scanning                      | [`MALWARE_SCANNING.md`](MALWARE_SCANNING.md)                                                               |
| Operate scheduled jobs and alerting                    | [`DEPLOYMENT.md`](DEPLOYMENT.md#43-manual-job-execution), [`DEPLOYMENT.md`](DEPLOYMENT.md#5-feature-flags) |
| Onboard another app to the scanner platform            | [`../malware-scanning/RUNBOOK.md`](../malware-scanning/RUNBOOK.md)                                         |
| Deploy or bootstrap the admin panel/IAP                | [`../idaho-th-admin/README.md`](../idaho-th-admin/README.md)                                               |

## Important Boundaries

- `apps/idaho-th` applies start the migrate job every time, but Terraform does not wait for that job to finish. Always check the latest execution after apply.
- The deployment helper applies only `artifact_registry` and `apps/idaho-th`; scanner and admin changes are separate applies.
- The deployment helper verifies three built images (`@idaho-th/server`, `@idaho-th/seed-db`, `@idaho-th/client`). The migrate, Intercom, and document-janitor jobs all run the server image with different commands.
- The shared Cloud SQL module derives the live instance connection from the `{sql_base_secret_name}_cloudsql_instance_id` secret. Do not assume `sql_instance_name` alone is the runtime source of truth.
- Internal webhook paths are routed to the API backend and must enforce their own caller authentication. The load balancer is not the auth boundary for scan-complete delivery.
