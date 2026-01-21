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


Go inside the `apps/@reentry/backend` folder, make a `.env` file. Get the content of the file from one of your teammates.

```bash
cd apps/@reentry/backend
```

```
cp .env_example .env
```

In the folder `apps/@reentry/backend/.secrets/gcp-service-account.json-sample`, create a `apps/@reentry/backend/.secrets/gcp-service-account.json`.
Get the content of the file from a teammate.

If you want to customize any settings from your environment, export them with `RECIDIVIZ_` prefix.
For example:

```bash
export RECIDIVIZ_OPENAI_API_KEY=your_openai_api_key
uv run fastapi dev
```

4. Start the services with docker-compose (postgres, pgadmin, ...)

```bash
cd "apps/@reentry" (relative path to the project root, adjust accordingly)
docker compose up
```

5. Inside the backend folder, run the database migrations

```bash
cd backend
uv run alembic upgrade head
```

6. Seed the database

```bash
uv run python -m app.manage seed-db
```

# Dev usage

## Run the backend API

Start services (posgres, redis, pgadmin)
```bash
cd "apps/@reentry" (relative path to the project root, adjust accordingly)
docker compose up
```

Run migrations
```bash
cd apps/@reentry/backend
uv run alembic upgrade head
```

Start server
```bash
cd apps/@reentry/backend
uv run fastapi dev
```
You can now access the API at [http://localhost:8000](http://localhost:8000).
The API documentation is accessible at [http://localhost:8000/docs](http://localhost:8000/docs).


Run the worker
For any processing task to run, you need to start the worker

```bash
cd apps/@reentry/backend
uv run taskiq worker -r main:broker
```

### Adding new packages
- Add packages using uv add.
- Then run any command and it will automatically sync, or `uv sync` to install and sync the dependent packages. This will update the `uv.lock` file.


## Testing

Run the tests for the `backend`:

```
uv run pytest
```

To run integration tests only use -m "integration" (skipped by default):

```
uv run pytest -m "integration"
```
Other flags:

- `--no-cov`: Disables coverage reporting for faster test execution
- `--log-cli-level=DEBUG`: Control log verbosity (DEBUG, INFO, WARNING, ERROR)

The test database should have started when you ran docker compose up, but here are more precise settings :
```bash
cd apps/@reentry
docker compose up -d postgres-tests
```

```bash
cd apps/@reentry/backend
RECIDIVIZ_DATABASE_URL_TESTS='postgresql+asyncpg://postgres:password@localhost:5433/recidiviz_test' uv run pytest
```

Optional: apply Alembic migrations to the test database instead of relying on `create_all` in tests:

```bash
cd apps/@reentry/backend
RECIDIVIZ_DATABASE_URL_TESTS='postgresql+asyncpg://postgres:password@localhost:5433/recidiviz_test' uv run alembic upgrade head
```

Sanity check the URL pytest will use:

```bash
cd apps/@reentry/backend
uv run python -c "from app.core.config import settings; print(settings.DATABASE_URL_TESTS)"
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
cd apps/@reentry/backend
uv run python -m app.manage generate-client-data
```

This command generates sample client, case manager, and supervision officer data for BigQuery tables. By default, it creates demo data (UXR users) for dev tables. Use `--env demo` to target demo tables and `--mode dev` for realistic fake data instead of demo data. Generated JSON files are saved in `backend/data/examples/clients/` and can be loaded to BigQuery using the provided `bq load` commands. The command also shows table status, deletion commands, and load commands.
It will also include fixed data to provision clients that will match between JII and reentry, [apps/@reentry/backend/data/fixtures/README.md](apps/@reentry/backend/data/fixtures/README.md)

To clear Redis cache for client data:

```bash
cd apps/@reentry/backend
uv run python -m app.manage reset-client-cache
```

## Run tasks on deployed environments

For this we use Cloud Run Jobs (apps/@reentry/backend/deploy/jobs/README.md)[apps/@reentry/backend/deploy/jobs/README.md]
