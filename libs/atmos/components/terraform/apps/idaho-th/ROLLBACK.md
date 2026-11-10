# Idaho TH Rollback Runbook

Use this runbook when an `apps/idaho-th` deploy needs to be backed out. For deploy steps, see [`DEPLOYMENT.md`](DEPLOYMENT.md). For database backup and restore, see [`BACKUP_RESTORE.md`](BACKUP_RESTORE.md).

## Choose The Right Recovery Path

| Situation                                                                     | Use                                                           |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Bad server, frontend, scanner, or admin service revision; database is healthy | [Cloud Run revision rollback](#1-cloud-run-revision-rollback) |
| Bad Cloud Run Job image/command or schedule; database is healthy              | [Cloud Run job rollback](#2-cloud-run-job-rollback)           |
| Bad Terraform change; database schema/data is healthy                         | [Terraform apply backout](#3-terraform-apply-backout)         |
| Prisma migration failed and now blocks future deploys with `P3009`            | [Migration failure recovery](#4-migration-failure-recovery)   |
| Migration or operator action succeeded but corrupted data                     | [`BACKUP_RESTORE.md`](BACKUP_RESTORE.md)                      |

## 1. Cloud Run Revision Rollback

Use this to move traffic back to a known-good Cloud Run revision without changing Terraform or the database.

Applies to:

- `idaho-th-server`
- `idaho-th-frontend`
- `idaho-th-malware-scanner`
- the admin panel service

```bash
gcloud run revisions list \
  --service=<service_name> \
  --project=<project> \
  --region=us-central1

gcloud run services update-traffic <service_name> \
  --project=<project> \
  --region=us-central1 \
  --to-revisions=<known-good-revision>=100
```

This changes only serving traffic. It does not undo a database migration. If the bad deploy included a migration, verify the database state before assuming the rollback is complete.

Required role: `roles/run.developer` on the project.

## 2. Cloud Run Job Rollback

Use this when a bad server image or Terraform command change affects a job. Cloud Run Jobs do not serve traffic by revision the same way services do, so the usual rollback path is a Terraform apply that pins the previous-good image tag or reverts the job command/schedule.

Jobs in scope:

| Job                    | Runs image               | Notes                                       |
| ---------------------- | ------------------------ | ------------------------------------------- |
| Migrate                | `idaho-th-server:<sha>`  | Starts on every `apps/idaho-th` apply.      |
| Seed                   | `idaho-th-seed-db:<sha>` | Created/updated by Terraform, run manually. |
| Intercom provider sync | `idaho-th-server:<sha>`  | Created/updated by Terraform, run manually. |
| Intercom digest        | `idaho-th-server:<sha>`  | Triggered by Cloud Scheduler on weekdays.   |
| Document janitor       | `idaho-th-server:<sha>`  | Triggered by Cloud Scheduler every 6 hours. |

To stop scheduled executions while you revert:

```bash
gcloud scheduler jobs pause idaho-th-intercom-digest-schedule \
  --project=<project> \
  --location=us-central1

gcloud scheduler jobs pause idaho-th-document-janitor-schedule \
  --project=<project> \
  --location=us-central1
```

Then apply the known-good image pins:

```bash
yarn atmos:apply apps/idaho-th -s <stack> -- \
  -var server_container_version=<known-good-sha> \
  -var migrate_db_container_version=<known-good-sha> \
  -var seed_db_container_version=<known-good-sha> \
  -var frontend_container_version=<known-good-sha>
```

Resume schedules only after the job logs show the fixed revision is ready.

## 3. Terraform Apply Backout

Use this for a bad infrastructure change.

```bash
git revert <bad-commit-sha>
yarn atmos:plan apps/idaho-th -s <stack>
yarn atmos:apply apps/idaho-th -s <stack>
```

Every `apps/idaho-th` apply starts the migrate job. Terraform does not wait for that job execution to finish; see [`DEPLOYMENT.md`](DEPLOYMENT.md#42-infrastructure-changes). If you are backing out `apps/malware-scanning` or `apps/idaho-th-admin`, plan/apply that component separately; the deploy helper does not touch them.

If the reverted change included a migration, resolve the migration state first. Reverting Terraform does not revert a migration that already touched the database.

## 4. Migration Failure Recovery

Use this when the migrate job failed and Prisma now blocks every later migrate attempt with `P3009`.

### Step 1: Fix The Underlying Data

Do this before changing Prisma migration state.

Most failures happen because live data violates a constraint being added by the migration: a unique index, `NOT NULL`, foreign key, or check constraint. Identify the exact rows that violate the constraint and review their relationships before choosing a fix.

For a unique-constraint failure, start by finding the conflicts:

```sql
SELECT <column>, array_agg(id)
FROM "<Table>"
GROUP BY <column>
HAVING COUNT(*) > 1;
```

If the conflicting rows are genuinely distinct records, renaming the conflicting value can be safer than deleting or merging records:

```sql
UPDATE "<Table>"
SET <column> = 'DUPLICATE-' || id || '+' || <column>
WHERE id IN (/* conflicting ids */);
```

This keeps the original value visible and avoids touching related rows. Adapt the fix to the actual failure; the important rule is to repair the real data issue first.

### Step 2: Mark The Failed Migration Rolled Back

`gcloud run jobs execute` can override job arguments, but not the base container command. To run `prisma migrate resolve`, make a temporary Terraform change to `module "migrate_db_job"` in `apps/idaho-th/main.tf`:

```hcl
container_command = ["sh", "-c", "yarn prisma migrate resolve --rolled-back <migration_name> --schema=prisma/schema.prisma"]
```

Apply the component. The migrate job starts immediately because the component executes the job on every apply.

```bash
yarn atmos:plan apps/idaho-th -s <stack>
yarn atmos:apply apps/idaho-th -s <stack>
```

Check the job logs and confirm Prisma marked the migration as rolled back.

Use `--rolled-back` unless you have confirmed the failed statement actually completed in the database. Using `--applied` incorrectly can leave the schema change missing while Prisma believes it ran.

### Step 3: Restore The Normal Migration Command

Change the migrate job command back:

```hcl
container_command = ["sh", "./scripts/migrate-dbs.sh"]
```

Then apply again:

```bash
yarn atmos:plan apps/idaho-th -s <stack>
yarn atmos:apply apps/idaho-th -s <stack>
```

Confirm from the logs that the real migration completed successfully. If the migrate job had been blocked for a while, this run may apply multiple pending migrations.

Exercised on production on 2026-09-04: duplicate `HousingProvider.email` rows blocked `20260821120000_add_housing_provider_email_unique` with `P3009`. Steps 1 to 3 cleared it, and the retry applied all 8 pending migrations.

This procedure recovers a migration that failed to apply. It does not undo a migration that already succeeded; use point-in-time recovery in [`BACKUP_RESTORE.md`](BACKUP_RESTORE.md) for that.

## Related Documentation

| Document                                 | Contents                                                       |
| ---------------------------------------- | -------------------------------------------------------------- |
| [`README.md`](README.md)                 | Idaho TH infrastructure index                                  |
| [`DEPLOYMENT.md`](DEPLOYMENT.md)         | Environment reference, apply order, feature flags, and secrets |
| [`BACKUP_RESTORE.md`](BACKUP_RESTORE.md) | Cloud SQL recovery procedures                                  |
