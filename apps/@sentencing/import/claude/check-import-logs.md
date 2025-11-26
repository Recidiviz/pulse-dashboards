# Check Sentencing Data Import Logs

Check the logs for the sentencing-data-import Cloud Run job and summarize any errors or issues.

## STEP 0: Sync Local Command with Repo Version

**Before starting, check if the local command matches the repo version:**

```bash
diff /Users/nichellehall/Recidiviz/.claude/commands/check-import-logs.md \
     /Users/nichellehall/Recidiviz/pulse-dashboards/apps/@sentencing/import/claude/check-import-logs.md
```

- **If different:** Ask the user which version to use (local or repo)
- **If same:** Proceed with debugging

**If you make updates to this command during the session:**

1. **Update BOTH files:**
   - `/Users/nichellehall/Recidiviz/.claude/commands/check-import-logs.md` (local)
   - `/Users/nichellehall/Recidiviz/pulse-dashboards/apps/@sentencing/import/claude/check-import-logs.md` (repo)

2. **ALWAYS prompt the user to create a PR** with suggested title and description:

   **PR Title:** `docs(sentencing): Update import debugging command - [brief description]`

   **PR Description:**
   ```markdown
   ## Summary
   Updated `/check-import-logs` command to include [description of changes].

   ## Changes
   - [List specific changes]

   ## Context
   [Why these changes were needed - link to issue/Slack thread]

   ## Testing
   - [ ] Verified command runs in new Claude Code session
   - [ ] Tested all queries successfully
   ```

## STEP 1: Gather Slack Context

**IMPORTANT: Before analyzing logs or running queries, ask the user to paste any relevant Slack threads or conversations about this import issue.**

Slack often contains critical debugging context like:
- Error messages and stack traces
- What changes were recently made
- Previous debugging attempts
- Known root causes or workarounds
- Team discussions about similar issues

**Prompt the user:** "Do you have any relevant Slack threads or messages about this import issue? Please paste them here so I have full context before debugging."

## STEP 2: Analyze Recent Slack Context

Once you receive the Slack thread, analyze it for:
- **Known root causes** - Has the team already identified what's causing failures?
- **Recent code changes** - What PRs or deploys might have introduced issues?
- **Data inconsistencies** - Are there known data quality problems in BigQuery or the DB?
- **Timing information** - When did the issue start? Which DAG runs were affected?
- **Pending fixes** - Are there PRs in flight that should resolve the issue?

## Job Details
- **Project:** recidiviz-dashboard-staging
- **Job Name:** sentencing-data-import
- **Location:** us-central1
- **Service Account:** claude-log-reader@recidiviz-dashboard-staging.iam.gserviceaccount.com

## Data Pipeline Context

### Architecture Overview
The sentencing data flows through this pipeline:

1. **BigQuery (recidiviz-data)** → 2. **Cloud Storage** → 3. **Cloud Run Import Job** → 4. **PostgreSQL**

### Pipeline Components

**1. BigQuery Views (recidiviz-data)**
- ETL data lives in BigQuery views defined in `recidiviz-data/recidiviz/calculator/query/state/views/sentencing/`
- Views include: staff, clients, cases, charges, opportunities, counties/districts, case insights
- Documentation: https://github.com/Recidiviz/recidiviz-data/tree/main/docs/calculation/views/sentencing_views

**2. Export Pipeline (recidiviz-data)**
- Runs via Airflow with `--export_job_name SENTENCING`
- Exports BigQuery views to newline-delimited JSON files
- Uploads to GCS bucket: `recidiviz-dashboard-staging-sentencing-etl-data`
- Publishes Pub/Sub message to `sentencing_export_success` topic with state code

**3. Workflow Trigger**
- Pub/Sub message triggers Google Cloud Workflow: `handle-sentencing-gcs-upload`
- Workflow definition: `libs/atmos/components/terraform/apps/sentencing/workflows/handle-sentencing-gcs-upload.workflows.yaml`
- Extracts state code from message and passes to import job

**4. Cloud Run Import Job (THIS IS WHAT YOU'RE DEBUGGING)**
- TypeScript/Node.js app in `pulse-dashboards/apps/@sentencing/import/`
- Uses Prisma ORM to write to PostgreSQL
- Uses Zod schemas for runtime validation
- Runs once per state code

**5. Import File Order** (respects foreign key dependencies):
1. `sentencing_counties_and_districts.json`
2. `sentencing_staff_record.json`
3. `sentencing_client_record.json`
4. `sentencing_charge_record.json`
5. `sentencing_community_opportunity_record.json`
6. `sentencing_case_record.json`
7. `case_insights_record.json`

**6. Import Behavior by Entity Type:**
- **Staff, Clients, Cases:** Upsert by externalId (updates existing, inserts new, does NOT delete missing records)
- **Insights, Opportunities, Counties/Districts:** Upsert + cleanup (deletes records not in import)
- **Offenses/Charges:** Upsert + validation (job FAILS if database has offenses missing from import)
- **Nested data:** Fully replaced on each import

**7. Archive Process:**
- After successful import, files are moved to `recidiviz-dashboard-staging-sentencing-etl-data-archive` with timestamp

## Setup: Connecting to Data Sources

### Install Cloud SQL Proxy

To query PostgreSQL databases, first install the Cloud SQL Auth Proxy:

**macOS (Intel):**
```bash
curl -o /tmp/cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.14.2/cloud-sql-proxy.darwin.amd64
chmod +x /tmp/cloud-sql-proxy
```

**macOS (Apple Silicon):**
```bash
curl -o /tmp/cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.14.2/cloud-sql-proxy.darwin.arm64
chmod +x /tmp/cloud-sql-proxy
```

**Linux:**
```bash
curl -o /tmp/cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.14.2/cloud-sql-proxy.linux.amd64
chmod +x /tmp/cloud-sql-proxy
```

### Start the Proxy

In a separate terminal, start the proxy (keep it running):

```bash
/tmp/cloud-sql-proxy recidiviz-dashboard-staging:us-central1:sentencing-db \
  --port=5439 \
  --impersonate-service-account=claude-log-reader@recidiviz-dashboard-staging.iam.gserviceaccount.com
```

### Connect to PostgreSQL

```bash
# Generate IAM token
TOKEN=$(gcloud auth print-access-token --impersonate-service-account=claude-log-reader@recidiviz-dashboard-staging.iam.gserviceaccount.com)

# Connect to database (available: us_nd, us_id, us_mo)
PGPASSWORD="$TOKEN" psql \
  "host=127.0.0.1 port=5439 sslmode=disable dbname=us_nd user=claude-log-reader@recidiviz-dashboard-staging.iam" \
  -w -c "YOUR_QUERY_HERE"
```

### Query BigQuery

```bash
bq query --project_id=recidiviz-staging --use_legacy_sql=false 'YOUR_QUERY_HERE'
```

### Check Cloud Logs

```bash
gcloud logging read 'resource.type="cloud_run_job" AND resource.labels.job_name="sentencing-data-import" AND timestamp>="YYYY-MM-DDTHH:MM:SSZ"' --limit=100 --format=json --project=recidiviz-dashboard-staging
```

## Debugging Instructions

1. **Determine the date range to fetch:**
   - If today is Monday: fetch logs from Saturday, Sunday, and Monday
   - If today is any other weekday: fetch logs from today only

2. **Fetch logs** for the sentencing-data-import Cloud Run job within that date range

3. **Identify executions** and their status (success/failure)

4. **Check for recent code changes** that might have caused issues:

   **In pulse-dashboards (import logic):**
   ```bash
   cd /path/to/pulse-dashboards
   git log --since="3 days ago" --oneline -- apps/@sentencing/import
   git diff HEAD~5..HEAD -- apps/@sentencing/import
   ```

   **In recidiviz-data (BigQuery views):**
   ```bash
   cd /path/to/recidiviz-data
   git log --since="3 days ago" --oneline -- recidiviz/calculator/query/state/views/sentencing
   git diff HEAD~5..HEAD -- recidiviz/calculator/query/state/views/sentencing
   ```

   Look for:
   - Changes to Zod schemas or validation logic
   - Changes to BigQuery view definitions
   - New fields added/removed
   - Changed import order or file handling

5. **Analyze errors** using the pipeline context:
   - Which file failed? (Check against import order above)
   - What validation failed? (Zod schema, foreign key, offense validation)
   - Which state code? (US_ND, US_ID, US_MO, etc.)
   - Is this an upstream data issue (BigQuery export) or import logic issue?
   - Did recent code changes introduce the issue?

6. **If successful, summarize:**
   - Which state(s) imported
   - How many records per file
   - Total execution time

7. **Suggest debugging queries** based on the error type (see examples below)

## Common Errors We've Seen

### Error: Missing Offenses (CASE SENSITIVITY ISSUE - Nov 2024)

**Symptom:** Import fails with message like:
```
Error when importing offenses! These offenses exist in the database but are missing from the data import: [LIST OF OFFENSE NAMES]
```

**What it means:** The database has offense records that aren't present in the incoming BigQuery export. The import job validates that all existing offenses are still in the new data to prevent accidental deletions.

**KNOWN ROOT CAUSE (Nov 19-20, 2024):**

The team identified a **case mismatch issue** causing duplicate offenses and import failures:

1. **Source of truth:** Both `sentencing_charge_record` and `case_insights_rates` pull from the mapping table `RECIDIVIZ_REFERENCE_offense_category_mapping_latest`

2. **The problem:** This mapping table contains **duplicate offenses with different casing**:
   - "Assault" vs "ASSAULT"
   - "Criminal Trespass" appears 4 times (3 title-case, 1 uppercase)
   - "Attempted Murder" appears 3 times with different casing

3. **What happens:**
   - `case_insights_rates` pulls title-case offense names
   - Import does **case-sensitive lookup** for these title-case names
   - Doesn't find exact match in `sentencing_charge_record` (which has uppercase)
   - Creates NEW duplicate offense record with no category and frequency=0
   - Validation fails because title-case offenses exist in DB but not in import data
   - This is why duplicates keep reappearing even after manual deletion

4. **The fix (in progress as of Nov 20):**
   - Update both views to use `UPPER(description)` to normalize all offense names to uppercase
   - This ensures consistent casing across all tables
   - PR: https://github.com/Recidiviz/recidiviz-data/pull/[NUMBER]
   - **Note:** Changes need to go through DAG run to appear in staging (runs ~8am daily)

5. **Workaround until fix deploys:**
   - Delete duplicate title-case offenses from PostgreSQL manually
   - Wait for DAG run with uppercase normalization changes
   - Import should succeed once both `sentencing_charge_record` and `case_insights_rates` use uppercase

**Key query to check for case mismatches:**
```sql
-- Find duplicate offenses with different casing in mapping table
SELECT
  UPPER(description) as normalized,
  COUNT(*) as count,
  STRING_AGG(description, ', ') as variants
FROM `recidiviz-staging.us_nd_raw_data_up_to_date_views.RECIDIVIZ_REFERENCE_offense_category_mapping_latest`
GROUP BY UPPER(description)
HAVING COUNT(*) > 1
ORDER BY count DESC
```

**Query to find duplicates in PostgreSQL:**
```sql
SELECT name, category, frequency, COUNT(*) as count
FROM "Offense"
WHERE name LIKE 'B%'
GROUP BY category, name, frequency
HAVING COUNT(*) > 1
ORDER BY UPPER(name) ASC, category ASC;
```

**Additional debugging steps:**

1. **Check the logs** for the exact list of missing offenses

2. **Query BigQuery** to see if offenses exist in source data:
```sql
SELECT DISTINCT charge
FROM `recidiviz-staging.sentencing_views.sentencing_charge_record_materialized`
WHERE state_code = "US_ND"
  AND UPPER(charge) IN (UPPER('OFFENSE_NAME_1'), UPPER('OFFENSE_NAME_2'))
```

3. **Query PostgreSQL** to confirm they exist in the database:
```sql
SELECT DISTINCT name FROM "Offense"
WHERE UPPER(name) IN (UPPER('OFFENSE_NAME_1'), UPPER('OFFENSE_NAME_2'));
```

4. **Check if DAG has run with latest changes:**
   - Go to: https://console.cloud.google.com/bigquery?project=recidiviz-staging
   - Check `sentencing_views.sentencing_charge_record` details tab for last modified time
   - Compare to when PR was merged

5. **Root cause analysis:**
   - If offenses exist in BigQuery but not in import file → Check GCS export/bucket
   - If offenses don't exist in BigQuery → Upstream data pipeline issue (check recidiviz-data)
   - If offenses in DB are old/deprecated → May need to manually clean up database
   - **If case mismatch** → Wait for DAG run with uppercase normalization

**Who to contact:**
- Akhil Ghanta - worked on the fix for case normalization
- Nichelle (nichelle@recidiviz.org) - import job, database cleanup, and pipeline/DAG expertise
  - **Note for Nichelle:** If issue is pipeline/DAG related, check Roshan's offboarding documentation

---

### Error: Foreign Key Violations

**Symptom:** Import fails when trying to insert records with references to non-existent parent records.

**Common causes:**
- Staff records reference cases that haven't been imported yet
- Cases reference clients/staff that don't exist
- Import order is incorrect

**How to debug:**

1. Check which file failed in the logs
2. Verify import order matches the expected sequence (see Import File Order above)
3. Query PostgreSQL to check if referenced records exist:
```sql
-- Check if staff exists
SELECT COUNT(*) FROM "Staff" WHERE "externalId" = 'STAFF_ID';

-- Check if client exists
SELECT COUNT(*) FROM "Client" WHERE "externalId" = 'CLIENT_ID';
```

---

### Error: Schema Validation (Zod)

**Symptom:** Import fails with Zod validation error, data doesn't match expected schema.

**Common causes:**
- Gender is UNKNOWN (not allowed for clients)
- Invalid date formats
- Missing required fields
- Enum values don't match expected values

**How to debug:**

1. Check error message for specific field and validation rule
2. Query BigQuery to check source data:
```sql
SELECT * FROM `recidiviz-staging.sentencing_views.sentencing_client_record_materialized`
WHERE state_code = "US_ND"
  AND (gender = 'UNKNOWN' OR other_problematic_condition)
LIMIT 10;
```

3. Review Zod schema in: `pulse-dashboards/apps/@sentencing/import/src/constants.ts`

---

## GitHub: Check Recent Changes

When diagnosing import failures, recent code changes are often the culprit. Check both repositories:

### Check Import Logic Changes (pulse-dashboards)

```bash
cd /path/to/pulse-dashboards

# See recent commits affecting import code
git log --since="3 days ago" --oneline -- apps/@sentencing/import

# View detailed changes
git log --since="3 days ago" -p -- apps/@sentencing/import

# Compare with deployed version (last 5 commits)
git diff HEAD~5..HEAD -- apps/@sentencing/import
```

**What to look for:**
- Changes to `src/constants.ts` (Zod schemas)
- Changes to `src/utils/*.ts` (loader functions)
- Changes to file order or validation logic
- New required fields or stricter validation

### Check BigQuery View Changes (recidiviz-data)

```bash
cd /path/to/recidiviz-data

# See recent commits affecting sentencing views
git log --since="3 days ago" --oneline -- recidiviz/calculator/query/state/views/sentencing

# View detailed SQL changes
git log --since="3 days ago" -p -- recidiviz/calculator/query/state/views/sentencing

# Compare with deployed version
git diff HEAD~5..HEAD -- recidiviz/calculator/query/state/views/sentencing
```

**What to look for:**
- Changes to view definitions (SQL queries)
- New/removed columns
- Changed JOIN conditions or WHERE clauses
- Data type changes

### Using GitHub CLI (if available)

```bash
# List recent PRs that touched import code
gh pr list --repo Recidiviz/pulse-dashboards --search "path:apps/@sentencing/import" --state merged --limit 10

# List recent PRs that touched sentencing views
gh pr list --repo Recidiviz/recidiviz-data --search "path:recidiviz/calculator/query/state/views/sentencing" --state merged --limit 10

# View a specific PR
gh pr view PR_NUMBER --repo Recidiviz/pulse-dashboards
```

### Timeline Correlation

If import started failing on a specific date:
1. Check what was deployed to staging on or before that date
2. Look at git history around that timeframe
3. Review PRs merged in the 24-48 hours before the failure

**Example workflow:**
```bash
# Import failed on Nov 21, 2025 at 2:00 PM
# Check commits merged before that time

cd /path/to/pulse-dashboards
git log --since="2025-11-20" --until="2025-11-21 14:00" --oneline -- apps/@sentencing/import

cd /path/to/recidiviz-data
git log --since="2025-11-20" --until="2025-11-21 14:00" --oneline -- recidiviz/calculator/query/state/views/sentencing
```

## Example Debugging Queries

### PostgreSQL: Check record counts
```bash
TOKEN=$(gcloud auth print-access-token --impersonate-service-account=claude-log-reader@recidiviz-dashboard-staging.iam.gserviceaccount.com)
PGPASSWORD="$TOKEN" psql "host=127.0.0.1 port=5439 sslmode=disable dbname=us_nd user=claude-log-reader@recidiviz-dashboard-staging.iam" -w -c '
SELECT
  (SELECT COUNT(*) FROM "Client") as clients,
  (SELECT COUNT(*) FROM "Staff") as staff,
  (SELECT COUNT(*) FROM "Case") as cases,
  (SELECT COUNT(*) FROM "Charge") as charges,
  (SELECT COUNT(*) FROM "Offense") as offenses;
'
```

### PostgreSQL: List all tables
```bash
PGPASSWORD="$TOKEN" psql "host=127.0.0.1 port=5439 sslmode=disable dbname=us_nd user=claude-log-reader@recidiviz-dashboard-staging.iam" -w -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"
```

### BigQuery: Check source record count
```bash
bq query --project_id=recidiviz-staging --use_legacy_sql=false '
SELECT
  COUNT(*) as total_records,
  state_code
FROM `recidiviz-staging.sentencing_views.sentencing_charge_record_materialized`
GROUP BY state_code
'
```

## Tips & Gotchas

- **IAM tokens expire after 1 hour** - regenerate if authentication fails
- **Table names are PascalCase** in Postgres: `"Offense"`, `"Case"`, `"Client"` (must be quoted)
- **Keep proxy running** in separate terminal while querying
- **Read-only access** - cannot INSERT, UPDATE, DELETE, or DROP
- **Multiple databases:** Change `dbname=` parameter (us_nd, us_id, us_mo)

## Output Format

Present findings with:
- Executive summary of import status
- Error details with specific file/state/line numbers
- Root cause analysis using pipeline context
- Suggested debugging queries
- Who to contact for help (if applicable)

---

## Contributing: Help Improve This Guide

**Found a new error pattern or gotcha?** Please update this document and share it with the team!

### How to Contribute

1. **Add your findings** to the relevant section:
   - New error pattern? Add it to "Common Errors We've Seen"
   - New debugging tip? Add it to "Tips & Gotchas"
   - Better query example? Update "Example Debugging Queries"

2. **Create a PR** to share with the team:
   ```bash
   cd /path/to/pulse-dashboards
   git checkout -b update-import-debug-guide
   git add apps/@sentencing/import/claude/check-import-logs.md
   git commit -m "Update import debugging guide with new findings"
   git push origin update-import-debug-guide
   gh pr create --title "Update import debugging guide" --body "Adding new error patterns and debugging tips from recent import failures"
   ```

3. **What to document:**
   - Specific error messages you encountered
   - The root cause you discovered
   - Debugging steps that helped you solve it
   - Queries that were particularly useful
   - Gotchas or edge cases

### Example Contribution

If you encounter a new error like "Timeout connecting to database", add it:

```markdown
### Error: Database Connection Timeout

**Symptom:** Import fails with "Connection timeout" or "Could not connect to database"

**Common causes:**
- Cloud SQL instance is stopped or paused
- Network connectivity issues
- Database is under heavy load

**How to debug:**
1. Check if Cloud SQL instance is running: `gcloud sql instances describe sentencing-db --project=recidiviz-dashboard-staging`
2. Check recent database load/performance metrics
3. Try connecting manually via `gcloud sql connect`
```

**Your contributions help the entire team debug faster!** 🙌
