# Idaho TH Backup And Restore Runbook

Use this runbook to recover the `apps/idaho-th` Cloud SQL database. For deploy rollback and failed migration recovery, see [`ROLLBACK.md`](ROLLBACK.md). For environment details, see [`DEPLOYMENT.md`](DEPLOYMENT.md).

Required roles:

- `roles/cloudsql.admin` for `gcloud sql` describe/list/clone/restore/delete commands.
- `roles/cloudsql.client` for Cloud SQL Auth Proxy access during partial recovery.

## Choose The Right Recovery Path

| Situation                                                   | Use                                                                                            |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| A few rows or tables are wrong, but the instance is healthy | [Scenario A: Partial data corruption](#2-scenario-a-partial-data-corruption)                   |
| The instance is unusable or must be replaced                | [Scenario B: Full instance loss or corruption](#3-scenario-b-full-instance-loss-or-corruption) |
| You must overwrite an existing instance from a backup       | [Restoring in place](#5-restoring-in-place), last resort only                                  |

## Production Restore Checklist

Before changing production data or cutting over to a replacement instance:

- [ ] Assign one incident owner and one database operator.
- [ ] Record the target restore timestamp in UTC.
- [ ] Confirm the expected data-loss window and whether legitimate writes happened after the restore point.
- [ ] Decide whether the app should be treated as read-only/down during the recovery window.
- [ ] Pause scheduled writers if needed: Intercom digest and document janitor Cloud Scheduler jobs.
- [ ] Notify product/support stakeholders before user-visible downtime or data loss.
- [ ] Take or preserve a copy of the current broken state before overwriting or deleting anything.
- [ ] Confirm the exact Cloud SQL instance, project, and stack before running restore/import commands.
- [ ] Save command output and relevant timestamps in the incident record.

## 1. Current Backup Configuration

The shared `vendor/cloud-sql-instance` module pins these settings for both staging and production:

| Setting                | Value  | Enforced by |
| ---------------------- | ------ | ----------- |
| Backups enabled        | `true` | Terraform   |
| Point-in-time recovery | `true` | Terraform   |
| Backup location        | `us`   | Terraform   |

These settings are observed GCP defaults, not pinned in Terraform. Observed on 2026-10-22:

| Setting                   | Staging (`idaho-th-dev`) | Production (`idaho-th`) |
| ------------------------- | ------------------------ | ----------------------- |
| Backup window             | `02:00` UTC daily        | `16:00` UTC daily       |
| Backups retained          | 7, count-based           | 7, count-based          |
| Transaction log retention | 7 days                   | 7 days                  |

No app that uses the shared module pins these settings, so they are not set per app. Verify the live instance before relying on those observed values:

```bash
gcloud sql instances describe <sql_instance_name> \
  --project=<project> \
  --format="yaml(settings.backupConfiguration,settings.availabilityType)"
```

If the backup window, retained backup count, or transaction-log retention must be guaranteed, add explicit inputs to the Cloud SQL module instead of relying on provider/GCP defaults. The module is vendored from `Recidiviz/atmos-components` (see `libs/atmos/vendor.yaml`), so make the change there first and pull it here.

### Restore tests

| Date       | Environment | Test                                                                                                                       | Result                                                                                                                                                                   |
| ---------- | ----------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 2026-09-08 | Staging     | Point-in-time clone of `idaho-th-dev` to `idaho-th-dev-restore-test` at `2026-09-08T02:00:00Z`, compared with live staging | Clone ready after about 10 minutes (17:18 to 17:28 UTC). Data compared with live staging, then the clone was deleted at about 17:37 UTC. Production has not been tested. |

### On-demand backup before a risky change

Take one before a migration that changes existing data, so there is a labelled restore point:

```bash
gcloud sql backups create \
  --instance=<sql_instance_name> \
  --project=<project> \
  --description="<what and why, with the date>"

gcloud sql backups list --instance=<sql_instance_name> --project=<project>
```

Wait for `SUCCESSFUL` before starting. Taken this way before the 2026-10-05 and 2026-10-14 production rollouts, all `SUCCESSFUL`. To restore from one, see [Restoring in place](#5-restoring-in-place); a new instance needs a point-in-time clone ([3.1](#31-clone-a-replacement-instance)).

## 2. Scenario A: Partial Data Corruption

Use this when the live instance is healthy but specific data is wrong, such as after a bad migration, accidental bulk update/delete, or application bug.

The safe pattern is:

1. Identify the damaged data and incident time.
2. Clone the database to a temporary instance at a point before the incident.
3. Compare restored data with live data.
4. Copy back only the rows/tables that need recovery.
5. Delete the temporary instance.

Do not restore in place for partial corruption. It would discard every legitimate change made after the restore point.

### 2.1 Scope The Damage

Before restoring anything, identify:

- affected tables and rows;
- the approximate time the bad change started;
- whether legitimate writes happened after that time;
- dependencies from other tables that make delete/merge unsafe.

Use incident-specific queries: row counts, `createdAt`/`updatedAt` windows, deploy timestamps, migration timestamps, and application logs.

### 2.2 Clone To A Temporary Instance

```bash
gcloud sql backups list \
  --instance=<sql_instance_name> \
  --project=<project>

gcloud sql instances clone <sql_instance_name> <temp-instance-name> \
  --project=<project> \
  --point-in-time='<RFC3339 timestamp, UTC, before the incident>'

gcloud sql instances describe <temp-instance-name> \
  --project=<project> \
  --format="value(state)"
```

`gcloud sql instances clone` always creates a new instance. It does not overwrite the live instance.

Watch clone progress:

```bash
gcloud sql operations list \
  --instance=<temp-instance-name> \
  --project=<project> \
  --limit=10
```

Validate the clone by comparing row counts and latest timestamps between live and restored data. The restored instance should contain records at or before the chosen cutoff. Live may contain newer legitimate records.

Example:

| Check                                      | Live                       | Restored                   |
| ------------------------------------------ | -------------------------- | -------------------------- |
| `HousingProvider` count                    | 72                         | 72                         |
| `HousingApplication` count                 | 278                        | 276                        |
| `max("createdAt")` on `HousingApplication` | `2026-09-08T14:41:52.618Z` | `2026-09-04T16:09:38.948Z` |

In this example, the two extra live applications were created after the restore cutoff, so the clone is behaving as expected.

### 2.3 Compare Restored Data With Live

Query the same tables and rows on both instances. Use Cloud SQL Studio, `psql`, or another approved database client. Confirm the exact values to restore before writing anything to live.

### 2.4 Copy Correct Data Back To Live

Idaho TH is not covered by the shared GKE-based `cloud-sql-proxy` module in `libs/atmos/components/terraform/cloud-sql-proxy`. Use the standalone Cloud SQL Auth Proxy:

```bash
# Terminal 1: temporary restored instance
cloud-sql-proxy <project>:us-central1:<temp-instance-name> --port 5433

# Terminal 2: live instance
cloud-sql-proxy <project>:us-central1:<sql_instance_name> --port 5434
```

For a small number of rows, write targeted `UPDATE` or `INSERT` statements against live after reading the correct values from the restored instance.

For a whole table, dump from the restored instance and load into live only after reviewing the dump and choosing the right merge strategy:

```bash
pg_dump "host=localhost port=5433 dbname=us_id user=<idaho_th_db_user>" \
  --data-only \
  --table='"TableName"' \
  > /tmp/recovered_data.sql

# Review /tmp/recovered_data.sql before loading it.
# Choose truncate, upsert, or hand-edited statements based on the incident.

psql "host=localhost port=5434 dbname=us_id user=<idaho_th_db_user>" \
  < /tmp/recovered_data.sql
```

There is no universally safe table-level restore command. If legitimate live rows were created after the restore point, do not truncate unless you have a separate plan to preserve them.

### 2.5 Clean Up

```bash
gcloud sql instances delete <temp-instance-name> --project=<project>
```

## 3. Scenario B: Full Instance Loss Or Corruption

Use this when the Cloud SQL instance itself is unusable and the path forward is a replacement instance.

### 3.1 Clone A Replacement Instance

Numeric backup-run IDs restore only into an existing instance. To create a new replacement instance, use point-in-time clone:

```bash
gcloud sql backups list \
  --instance=<sql_instance_name> \
  --project=<project>

gcloud sql instances clone <sql_instance_name> <replacement-instance-name> \
  --project=<project> \
  --point-in-time='<RFC3339 timestamp, UTC>'

gcloud sql instances describe <replacement-instance-name> \
  --project=<project> \
  --format="value(state)"
```

Validate the replacement data before cutover.

Watch clone progress:

```bash
gcloud sql operations list \
  --instance=<replacement-instance-name> \
  --project=<project> \
  --limit=10
```

### 3.2 Adopt The Replacement In Terraform

`apps/idaho-th` points server, migrate, and seed workloads at `module.database.connection_name`. The shared Cloud SQL module derives that instance from the Secret Manager value `{sql_base_secret_name}_cloudsql_instance_id`, not directly from `sql_instance_name` in stack YAML.

Add a new secret version with the replacement connection name:

```bash
echo -n "<project>:us-central1:<replacement-instance-name>" | \
  gcloud secrets versions add <sql_base_secret_name>_cloudsql_instance_id \
    --data-file=- \
    --project=<project>
```

Then reconcile Terraform state. The old instance is already managed at `module.database.google_sql_database_instance.data`, so import the replacement only after removing the old address from Terraform state. This changes Terraform state only; it does not delete the old Cloud SQL instance.

```bash
yarn atmos terraform shell apps/idaho-th -s <stack>
terraform state rm module.database.google_sql_database_instance.data
terraform import module.database.google_sql_database_instance.data <project>/<replacement-instance-name>
```

Review the plan before applying. The plan should repoint Cloud Run services/jobs to the replacement connection name and should not try to recreate or destroy the database unexpectedly.

```bash
yarn atmos:plan apps/idaho-th -s <stack>
yarn atmos:apply apps/idaho-th -s <stack>
```

The import only brings the instance under Terraform management. It does not change the live instance settings by itself. Resolve any differences between the module configuration and the restored instance before applying.

Keep `sql_instance_name` unchanged unless you intentionally need to change Terraform-side names such as the KMS key handle and instance key. It is not the source of truth for the live Cloud SQL instance name in this vendor module.

### 3.3 Repoint The Admin Panel

`apps/idaho-th-admin` reads the same `{sql_base_secret_name}_cloudsql_instance_id` secret directly. After adding the new secret version above, re-apply admin so its Cloud Run volume points at the replacement instance:

```bash
yarn atmos:plan apps/idaho-th-admin -s <stack>
yarn atmos:apply apps/idaho-th-admin -s <stack>
```

## 4. User Communication During Restore

Idaho TH currently has no maintenance-mode banner, public status page, or PagerDuty integration for database downtime. The `security_alert_email` notification channel only covers security alerts.

The admin panel has a Cloud Run `startup_probe` on `/health`, but that is only a container readiness gate. It is not a user-facing status signal.

During a restore or cutover, providers, case managers, and admin users may see raw connection failures or timeouts. Adding a maintenance banner or paging channel is separate product/infrastructure work.

Scheduled jobs can also write while a restore is in progress. Pause them before disruptive production recovery when the write window matters:

```bash
gcloud scheduler jobs pause idaho-th-intercom-digest-schedule \
  --project=<project> \
  --location=us-central1

gcloud scheduler jobs pause idaho-th-document-janitor-schedule \
  --project=<project> \
  --location=us-central1
```

Resume them after the app and admin panel are pointed at the intended database and post-restore verification is complete.

## 5. Restoring In Place

`gcloud sql backups restore` can overwrite an existing instance:

```bash
gcloud sql backups restore <BACKUP_ID> \
  --restore-instance=<sql_instance_name> \
  --project=<project>
```

Treat this as a last resort. It overwrites the target instance, causes downtime, and discards every change after the restore point.

Before an in-place restore:

- clone or back up the current broken state in case any data still needs to be recovered later;
- confirm stakeholders accept losing all changes after the restore point;
- prefer a separate-instance restore when only part of the data is corrupted.

Monitor restore progress:

```bash
gcloud sql operations list \
  --instance=<sql_instance_name> \
  --project=<project> \
  --limit=10
```

## Related Documentation

| Document                         | Contents                                                       |
| -------------------------------- | -------------------------------------------------------------- |
| [`README.md`](README.md)         | Idaho TH infrastructure index                                  |
| [`DEPLOYMENT.md`](DEPLOYMENT.md) | Environment reference, apply order, feature flags, and secrets |
| [`ROLLBACK.md`](ROLLBACK.md)     | Cloud Run rollback, Terraform backout, and migration recovery  |
