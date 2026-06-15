# Getting Started

## Requirements

This project uses:

- uv (https://docs.astral.sh/uv)
- pre-commit (https://pre-commit.com/)
- Google Cloud SDK (https://cloud.google.com/sdk/docs/install)

Make sure all these are installed in your system.

(You can use pipx to install pre-commit: `pipx install pre-commit`, then `pre-commit install`. For uv, use the installation instructions in the link above)

Make sure you have the following libraries installed in your machine:

For macOs:
`brew install cairo pango glib gobject-introspection gdk-pixbuf uv`

Ubuntu/Debian:
`sudo apt-get install -y libcairo2-dev libpango1.0-dev libglib2.0-dev gobject-introspection libgirepository1.0-dev libgdk-pixbuf2.0-dev`

## Installation

1. Clone the repository

2. Authenticate with Google Cloud

```bash
gcloud auth login
gcloud auth application-default login
gcloud config set project recidiviz-rnd-planner
```

3. Set up environment variables

Backend env vars are supplied via the SOPS-encrypted `env.dev.enc.yaml` and loaded automatically by the `nx` targets. GCP credentials are provided through the `RECIDIVIZ_GCP_SERVICE_ACCOUNT_CREDENTIALS` env var (the full service-account JSON as a single-line string) — get the value from a teammate. When unset, the backend falls back to Application Default Credentials (`gcloud auth application-default login`).

If you want to customize any settings from your environment, export them with `RECIDIVIZ_` prefix.
For example:

```bash
export RECIDIVIZ_OPENAI_API_KEY=your_openai_api_key
nx dev @reentry/backend
```

4. Start the services with docker-compose (postgres, pgadmin, ...)

```bash
nx docker-up @reentry/backend
```

5. Run the database migrations

```bash
nx migrate @reentry/backend
```

6. Seed the database

```bash
nx seed-db @reentry/backend
```

# Dev usage

## Run the backend API

Start services (postgres, redis, pgadmin)

```bash
nx docker-up @reentry/backend
```

Run migrations

```bash
nx migrate @reentry/backend
```

Start server

```bash
nx dev @reentry/backend
```

Seed the database

```bash
nx seed-db @reentry/backend
```

You can now access the API at [http://localhost:8000](http://localhost:8000).
The API documentation is accessible at [http://localhost:8000/docs](http://localhost:8000/docs).

Run the worker
For any processing task to run, you need to start the worker

```bash
nx worker @reentry/backend
```

### Adding new packages

- Add packages using uv add.
- Then run any command and it will automatically sync, or `nx sync @reentry/backend` to install and sync the dependent packages. This will update the `uv.lock` file.

## Testing

Run the tests for the `backend`:

```
nx test @reentry/backend
```

To run integration tests only (skipped by default):

```
nx test-integration @reentry/backend
```

Other flags can be forwarded to `pytest` after `--`:

- `--no-cov`: Disables coverage reporting for faster test execution
- `--log-cli-level=DEBUG`: Control log verbosity (DEBUG, INFO, WARNING, ERROR)

```bash
nx test @reentry/backend -- --no-cov
```

The test database should have started when you ran `nx docker-up`, but here are more precise settings :

```bash
nx docker-up-tests @reentry/backend
```

```bash
RECIDIVIZ_DATABASE_URL_TESTS='postgresql+asyncpg://postgres:password@localhost:5433/recidiviz_test' nx test @reentry/backend
```

Optional: apply Alembic migrations to the test database instead of relying on `create_all` in tests:

```bash
RECIDIVIZ_DATABASE_URL_TESTS='postgresql+asyncpg://postgres:password@localhost:5433/recidiviz_test' nx migrate @reentry/backend
```

Sanity check the URL pytest will use:

```bash
nx check-test-db-url @reentry/backend
```

## Updating OpenAPI schema

If you have changed the api definition in any way, you need to update frontend OpenAPI schema.
Ensure the server is running, then run the following command

```bash
cd apps/@reentry/frontend
nx run @reentry/frontend:openapi
```

## Database schema changes

See (apps/@reentry/backend/alembic/README.md)[apps/@reentry/backend/alembic/README.md]

## LLM valuation

For detailed instructions on manual testing, evaluation, and all CLI tools including:

- Action plan generation
- Automated conversation evaluation with AI clients
- Summary generation testing
- Action plan quality evaluation with LangSmith

See the [Evaluation README](./app/manage/evaluate/README.md).
Evaluation instruction to run and llm-grade the generative capabilities of the app.
The setup section is standalone, it can be skipped entirely if you have setup your backend env, or it can be followed to intall only what you need for evals.

## Generate BigQuery client data (optional)

```bash
nx generate-client-data @reentry/backend
```

This command generates sample client, case manager, and supervision officer data for BigQuery tables. By default, it creates demo data (UXR users) for dev tables. Pass flags after `--` (e.g. `nx generate-client-data @reentry/backend -- --env demo --mode dev`): `--env demo` targets demo tables and `--mode dev` produces realistic fake data instead of demo data. Generated JSON files are saved in `backend/data/examples/clients/` and can be loaded to BigQuery using the provided `bq load` commands. The command also shows table status, deletion commands, and load commands.
It will also include fixed data to provision clients that will match between JII and reentry, [apps/@reentry/backend/data/fixtures/README.md](apps/@reentry/backend/data/fixtures/README.md)

To clear Redis cache for client data:

```bash
nx reset-client-cache @reentry/backend
```

## Run tasks on deployed environments

For this we use Cloud Run Jobs (apps/@reentry/backend/deploy/jobs/README.md)[apps/@reentry/backend/deploy/jobs/README.md]
