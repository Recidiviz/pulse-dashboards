# Requeue Pending Executions Job

This Google Cloud Run job re-enqueues pending executions that are not currently in the Redis task queue.

## What it does

1. **Connects to Redis** and fetches all task IDs from the `taskiq` queue
2. **Queries the database** for PENDING executions with task IDs
3. **Identifies missing tasks** by comparing queue vs database
4. **Re-enqueues missing executions** by reconstructing the original task calls

## Supported Task Types

- `plan` → Plan creation tasks
- `plandecisiontrees` → Plan decision tree execution tasks
- `plan:decisiontrees-populate` → Plan decision tree selection tasks
- `plan:generate` → Action plan generation tasks
- `recording_session` → Recording processing tasks

## Deployment

### Manual Execution

You can run the job manually via gcloud:

```bash
gcloud run jobs execute recidiviz-requeue-staging --region=us-central1
```

### View Job Logs

```bash
gcloud run jobs logs read recidiviz-requeue-staging \
  --region=us-central1 \
  --limit=100
```

## Configuration

The job uses the same environment variables as the main application:
- Database connection to staging PostgreSQL
- Redis connection to staging Redis
- Minimal resource allocation (0.5 CPU, 256Mi memory)
- 30-minute timeout with 2 max retries

## Scheduling

To run this job on a schedule, you can use Google Cloud Scheduler:

```bash
gcloud scheduler jobs create http requeue-pending-executions-daily \
  --schedule="0 2 * * *" \
  --uri="https://us-central1-run.googleapis.com/apis/run.googleapis.com/v1/namespaces/recidiviz-rnd-planner/jobs/recidiviz-requeue-pending-executions-staging:run" \
  --http-method=POST \
  --oauth-service-account-email=reentry-server-staging@recidiviz-rnd-planner.iam.gserviceaccount.com
```

This would run the job daily at 2 AM UTC.

## Monitoring

Monitor the job execution through:
- Cloud Run Jobs console
- Cloud Logging for detailed logs
- Cloud Monitoring for execution metrics
