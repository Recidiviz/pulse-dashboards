# Jobs Configuration

This README explains the new Cloud Run jobs configuration.

## Structure

```
backend/deploy/jobs/
├── Dockerfile              # Docker image for jobs
├── job-template.yaml        # template for jobs
├── cloudbuild.yaml         # CI/CD pipeline
├── docs/
│   ├── requeue_readme.env  # Custom documentation for requeue job
│
├── envs/
│   ├── demo.env            # Environment variables for demo
│   └── staging.env         # Environment variables for staging
|   └── prod.env            # Environment variables for production
└── entrypoints/
    ├── entrypoint.force-db.sh  # Script for forced DB seeding
    └── entrypoint.seed.sh      # Script for workflow seeding
    └── entrypoint.example.sh   # Example script
```

## Adding a New Job

To add a new job:

1. **Create entrypoint script**: Add `entrypoint.{_job_name}.sh` in `deploy/jobs/entrypoints/`
   ```bash
   #!/bin/sh
   # Initialize the cloud sql proxy (if needed)
   echo "Starting Cloud SQL Proxy..."
   cloud-sql-proxy --port 5432 $RECIDIVIZ_POSTGRES_SERVER &

   # Your job logic here
   echo "Running your job..."
   uv run python -m app.manage your-command
   ```

2. Update deploy script: Add your job to the JOBS object in `deploy/jobs/scripts/deploy-job.js`
   ```js
   "_job_name": {
     name: "_job_name",
     description: "Description of what your job does",
     environments: ["demo", "staging"] // applicable environments
   }
   ```

3. Deploy: Use the deployment script or manual command
   - Deployment script:
   ```bash
    cd backend/deploy/jobs/scripts
    node deploy_jobs.js
   ````

   - Manual command:
   ```bash
    gcloud builds submit --config backend/deploy/jobs/cloudbuild.yaml --substitutions=_JOB_NAME=_job_name,_ENVIRONMENT=demo
   ```

4. This only crates the job, you need to manually run it in the gcp cloud console.


## Deployment

To deploy a job, use the existing script deploy_jobs.mjs

```bash
  cd backend/deploy/jobs
  node deploy_jobs.mjs
````

## Execution

The Cloud Build pipeline:
1. Builds the Docker image
2. Pushes it to the registry
3. Generates the job YAML from the template
4. Deploys the job to Cloud Run


## Available Jobs

### force-db
Executes forced database seeding:
- Starts Cloud SQL Proxy
- Runs `seed-db --force`

### seed
see [backend/deploy/jobs/docs/SEED_README.md](docs/SEED_README.md) for details

### requeue-pending-executions
see [backend/deploy/jobs/docs/REQUEUE_README.md](docs/REQUEUE_README.md)  for details



## Creating One-off jobs

To create gcp cloud run jobs to run one-time procedures, you can follow the examples in [PR-9559](https://github.com/Recidiviz/pulse-dashboards/pull/9559) and [PR-9413](https://github.com/Recidiviz/pulse-dashboards/pull/9413).
