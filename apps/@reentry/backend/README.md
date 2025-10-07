# Recidiviz

This project provides an automated first draft of action plans for case workers,
helping reduce time-consuming tasks while keeping human oversight and
decision-making central.

More documentation around the POC can be found in the [docs folder](./docs)

## Requirements

This project uses:
- uv (https://docs.astral.sh/uv)
- pre-commit (https://pre-commit.com/)
- Google Cloud SDK (https://cloud.google.com/sdk/docs/install)

Make sure all these are installed in your system.

(You can use pipx to install pre-commit: `pipx install pre-commit`, then `pre-commit install`. For uv, use the installation instructions in the link above)

## Installation

1. Clone the repository

2. Authenticate with Google Cloud

```bash
gcloud auth login
gcloud auth application-default login
gcloud config set project recidiviz-rnd-planner
```

3. Set up environment variables

```bash
cp .env_example .env
```

Adjust the values in the `.env` file to match your local environment.

If you want to customize any settings from your environment, export them with `RECIDIVIZ_` prefix.
For example:

```bash
export RECIDIVIZ_OPENAI_API_KEY=your_openai_api_key
uv run fastapi dev
```

### Sentry Error Tracking Configuration

Both the backend and frontend support Sentry error tracking. To enable it:

**Backend:**
- Set `RECIDIVIZ_SENTRY_DSN` in your `.env` file or as an environment variable
- The backend will automatically initialize Sentry if a DSN is provided

**Frontend:**
- Set `NEXT_PUBLIC_SENTRY_DSN` in your `.env.local` file

## Usage

Inside the `backend` folder, you can find the FastAPI code.

1. Go inside the backend folder

```bash
cd backend
```

2. Start the services with docker-compose (postgres, pgadmin, ...)

```bash
docker-compose up
```

3. Run the database migrations

```bash
uv run alembic upgrade head
```

4. Seed the database

```bash
uv run python -m app.manage seed-db
```

5. Generate BigQuery client data (optional)

```bash
uv run python -m app.manage generate-client-data
```

This command generates sample client, case manager, and supervision officer data for BigQuery tables. By default, it creates demo data (UXR users) for dev tables. Use `--env demo` to target demo tables and `--mode dev` for realistic fake data instead of demo data. Generated JSON files are saved in `backend/data/examples/clients/` and can be loaded to BigQuery using the provided `bq load` commands. The command also shows table status, deletion commands, and load commands.

To clear Redis cache for client data:

```bash
uv run python -m app.manage reset-client-cache
```

6. Run the worker

```bash
uv run taskiq worker -r main:broker
```

7. Run the backend API

```bash
uv run fastapi dev
```

You can now access the API at [http://localhost:8000](http://localhost:8000).
The API documentation is accessible at [http://localhost:8000/docs](http://localhost:8000/docs).


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

## Cli tool

### Generate an action plan

```bash
uv run python -m app.manage create-plan 108734 --force
```

This will create an action plan for the given `client_id`, corresponding to a BigQuery external identifier, synchronously.
You need to have an intake in db for that client.
You can then see the result in `experiments/structured_action_plan/Allistor_Jones_it1_*`:

- `_plan.json` contains the generated plan in structured format
- `_plan.md` contains the generated plan rendered in markdown
- `_gen_data.json`: contains the data used to generate the plan (everything)

### Simulate Intake Conversation

Run the conversation in cli

```bash
uv run -m app.manage test-conversation
```

Run a few conversations in parallel with basic ai bots and evaluate results
```bash
uv run -m app.manage headless-conversation-eval
```

## Updating OpenAPI schema

To update frontend OpenAPI schema, ensure the server is running, then run the following command

```bash
cd frontend
yarn run openapi
```
