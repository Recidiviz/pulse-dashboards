# Force Assessment From Env Job

## Overview

The `force-assessment-from-env` job forcibly regenerates an assessment for a specific client by deleting any existing assessment and creating a new one. The target client is specified via environment configuration.

## Purpose

⚠️ **This job should only be used to recover from failed assessments.**

This job is intended for:
- Recovering from corrupted or failed assessment states
- Rerunning assessments that got stuck or errored out

## Configuration

The job requires the following environment variable to be set:

```
RECIDIVIZ_CLIENT_PSID_ASSESSMENT_TASK=<client-pseudo-id>
```

## Behavior

1. Reads the target client pseudo ID from `CLIENT_PSID_ASSESSMENT_TASK` config setting
2. Deletes any existing assessments for that client (force mode)
3. Creates and executes a new assessment task
4. Logs completion status and number of scoring items generated

## Deployment

⚠️ **Important: If assessment configuration has been modified, you must redeploy this job before use.**

Deploy the job using the deployment script:

```bash
cd backend/deploy/jobs
node deploy_jobs.mjs
```

Select `force-assessment-from-env` from the job list and choose your target environment.

## Execution

**Prerequisites:**
- Ensure BigQuery client table environment variables are configured (`BQ_PROJECT_ID`, `BQ_DATASET`, `BQ_CLIENT_TABLE`)
- Verify the job has proper permissions to access BigQuery resources

**Steps:**
1. **Set Environment Variable**: In the GCP Cloud Console, navigate to the job and set the `RECIDIVIZ_CLIENT_PSID_ASSESSMENT_TASK` environment variable to your target client pseudo ID
2. **Run Job**: Execute the job from the Cloud Console
3. **Clean Up**: ⚠️ **IMPORTANT** - Remove the environment variable after the job completes to prevent erroneous reruns

### Step-by-step GCP Console Process:
1. Go to Cloud Run Jobs in GCP Console
2. Find the `force-assessment-from-env` job
3. Click "Edit & Deploy New Revision"
4. Under "Variables & Secrets" → "Environment Variables"
5. Add: `RECIDIVIZ_CLIENT_PSID_ASSESSMENT_TASK` = `<your-client-pseudo-id>`
6. Deploy the revision
7. Execute the job
8. After completion, edit again and **remove** the environment variable

## Environments

Available in: `demo`, `staging`, `prod`