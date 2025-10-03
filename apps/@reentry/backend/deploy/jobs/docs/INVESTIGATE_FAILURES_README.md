# Investigate Execution Failures Job

## Purpose
Investigates and reports on stuck or failed background task executions, providing detailed client context and resource summaries for debugging.

## What it does
- **Failed executions**: Shows all tasks with status = FAILED
- **Stuck processing**: Shows IN_PROGRESS tasks >30 minutes without updates
- **Stuck pending**: Shows PENDING tasks >1 hour since creation

For each problematic execution, provides:
- Full execution details (ID, status, timestamps, progress, Redis queue status)
- Client information (pseudo ID, real name)
- Complete resource summary (intake type/status, messages/recording length, assessments, plans, other executions)

## Usage

### Production
```bash
# Deploy the job
./deploy_jobs.mjs investigate-failures prod

# Run the job
kubectl get jobs -n reentry-prod | grep investigate-failures
kubectl logs -f job/investigate-failures-<timestamp> -n reentry-prod
```

### Demo/Staging
```bash
# Deploy to demo
./deploy_jobs.mjs investigate-failures demo

# Deploy to staging
./deploy_jobs.mjs investigate-failures staging
```

## Output
Generates detailed logs organized by:
1. **Task type** (intake, assessment, plan, recording, etc.)
2. **Problem category** (failed, stuck processing, stuck pending)
3. **Client context** with full resource breakdown

## When to use
- Background processing appears stuck
- Tasks are failing unexpectedly
- Need to investigate client-specific processing issues
- Regular health checks on execution system
- Before/after maintenance to verify system health

## Related jobs
- `requeue`: Re-enqueues stuck pending executions
- `retry-plan-gens`: Retries failed plan generations specifically