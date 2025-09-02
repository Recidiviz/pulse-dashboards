# Seed Workflow Cloud Run Job

This directory contains the configuration for running the seed-workflow command as a Google Cloud Run Job.


## Usage


### Run the Job Manually
```bash
# Run with default 'demo' mode
gcloud run jobs execute recidiviz-seed-workflow --region=us-central1
```

### Check Job Status
```bash
gcloud run jobs describe recidiviz-seed-workflow --region=us-central1
```

### View Job Logs
```bash
gcloud logs read "resource.type=cloud_run_job AND resource.labels.job_name=recidiviz-seed-workflow" --limit=50
```

## Configuration

The job can be configured by modifying environment variables in `job.yaml`:

- `SEED_MODE`: Set to "demo" or "dev" (default: "demo")
  - `demo`: Creates intakes in different stages for demo purposes
  - `dev`: Creates completed intakes with plans for testing

## Prerequisites

- Google Cloud SQL Proxy access
- Database secrets configured in `recidiviz-secrets`
- Service account `recidiviz-service-account` with appropriate permissions
