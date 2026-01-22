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

It read the database directly so unless we change something major to the schema it doesn't need to be re-deployed before use.
It's only reading, no data will change.

## Usage

### Production
```bash
# Deploy the job
  cd backend/deploy/jobs
  node deploy_jobs.mjs
````

# Run the job
You can run the job through the console.

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
