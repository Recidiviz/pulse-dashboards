## Setup

In the project root directory run
```bash
yarn install
```

Then in any folder in the repo

```bash
yarn nx build @reentry/frontend
```

## Running the Frontend/Backend



### Backend
1. Go inside the `apps/@reentry/backend` folder, make a `.env` file. Get the content of the file from one of your teammates.

```bash
cd apps/@reentry/backend
```

```
cp .env_example .env
```

In the folder `apps/@reentry/backend/.secrets/gcp-service-account.json-sample`, create a `apps/@reentry/backend/.secrets/gcp-service-account.json`.
Get the content of the file from a teammate.


2. Start the services with docker-compose (postgres, pgadmin, ...)

```bash
cd "apps/@reentry" (relative path to the project root, adjust accordingly)
docker-compose up
```

3. Inside the backend folder, run the database migrations

```bash
cd backend
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


### Frontend

Anywhere in the repo run
```
yarn nx dev @reentry/frontend
```

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

To run the frontend unit or integration tests you can run the commands below from the frontend folder.

```
yarn vitest (for unit-tests)
```

```
yarn vitest --watch=false --config vitest.integration.config.mts integration-tests/sentry.integration.test.ts (for integration-tests)
```

## Cli tool

### Generate an action plan

```bash
uv run python -m app.manage create-plan 108734 --force
```

This will create an action plan for the given `client_pseudo_id`, corresponding to a BigQuery pseudonymized identifier, synchronously.
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
nx run @reentry/frontend:openapi
```

## Sentry Error Tracking Configuration

Both the backend and frontend support Sentry error tracking. To enable it:

**Backend:**
- Set `RECIDIVIZ_SENTRY_DSN` in your `.env` file or as an environment variable
- The backend will automatically initialize Sentry if a DSN is provided

**Frontend:**
- Set `NEXT_PUBLIC_SENTRY_DSN` in your `.env.local` file
