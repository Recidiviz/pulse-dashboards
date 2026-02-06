# CPA (v0) Labeling App

A web application for manual labeling and quality review of reentry intake conversations, summaries, and action plans.

## Overview

This app allows evaluators to:
- Review intake conversation transcripts
- Review AI-generated summaries
- Review AI-generated action plans
- Provide structured feedback with severity ratings
- Flag issues for review (severe issues trigger Slack alerts)

## Architecture

The app consists of two parts:
- **Frontend**: React + TypeScript + Vite (in `frontend/`)
- **Backend**: FastAPI + SQLAlchemy (in `backend/`)

### Database Architecture

The backend connects to two databases:
1. **Reentry Database** (read-only via `postgresql_readonly=True`): Contains intake, plan, and related data
2. **Labeling Database** (read-write): Contains `labeling_feedback` table for storing evaluator feedback

## Local Development

### Recommended Setup

The recommended way to run locally is:
- Backend + PostgreSQL via Docker Compose
- Frontend via Vite (locally)

#### Quick Start

1. **Start backend services** (PostgreSQL, backend, PgAdmin):
   ```bash
   yarn nx docker @cpa-labeling/backend
   ```

   This will:
   - Start PostgreSQL with two databases: `reentry` and `labeling`
   - Run database migrations automatically
   - Start the backend API on <http://localhost:8080>
   - Start PgAdmin on <http://localhost:8002> (optional DB management UI)

2. **Start the frontend** (in a separate terminal):
   ```bash
   cd apps/@cpa-labeling/frontend

   # Start Vite dev server
   nx dev @cpa-labeling/frontend
   ```

   The frontend will be available at <http://localhost:5173>

3. **Access the application**:
   - Frontend: <http://localhost:5173>
   - Backend API: <http://localhost:8080/docs> (Swagger UI)
   - PgAdmin: <http://localhost:8002> (email: admin@recidiviz.org, password: admin)

4. **View backend logs**:
   ```bash
   # Backend logs
   yarn nx docker-logs @cpa-labeling/backend

   # All Docker services
   cd apps/@cpa-labeling && docker compose logs -f
   ```

5. **Stop backend services**:
   ```bash
   yarn nx docker-down @cpa-labeling/backend
   ```

#### Hot Reload

Both frontend and backend support hot reload:
- **Frontend**: Changes to `src/` files automatically reload via Vite
- **Backend**: Changes to `app/` files automatically reload in Docker

#### Database Access

PostgreSQL is accessible at:
- **Host**: localhost
- **Port**: 5432
- **Databases**: `reentry` (read-only in app), `labeling` (read-write)
- **User**: postgres
- **Password**: postgres

Use PgAdmin (<http://localhost:8002>) or your favorite SQL client to inspect/modify data.

#### Seeding Development Data

To populate the database with sample data for testing:

```bash
# Run the seed script inside the Docker container
docker exec cpa-labeling-backend-1 uv run python scripts/seed_dev_data.py
```

This will create:
- 3 sample intake conversations with realistic client scenarios
- 3 AI-generated summaries
- 3 action plans with detailed next steps
- 1 sample feedback entry

The sample data includes diverse scenarios:
- **John Smith**: Has stable housing, construction experience, needs health management
- **Maria Rodriguez**: In transitional housing, pursuing education (GED → medical assistant)
- **James Washington**: Needs emergency housing, has forklift certification

**Note**: The script will skip seeding if data already exists. To reseed, first delete the existing data:

```bash
# Reset databases and reseed
cd apps/@cpa-labeling
docker compose down -v
yarn nx docker @cpa-labeling/backend
docker exec cpa-labeling-backend-1 uv run python scripts/seed_dev_data.py
```

#### Configuration

The Docker setup uses environment variables defined in `compose.yml`. For custom configuration:

1. Create a `.env` file in `apps/@cpa-labeling/`:
   ```bash
   cd apps/@cpa-labeling
   cp .env.example .env
   # Edit .env as needed
   ```

2. Restart services:
   ```bash
   yarn nx docker-down @cpa-labeling/backend
   yarn nx docker @cpa-labeling/backend
   ```

#### Troubleshooting

**Port conflicts**:
- Docker services use ports 5432 (PostgreSQL), 8080 (backend), and 8002 (PgAdmin)
- Frontend uses port 5173 (Vite)
- If any are in use, stop the conflicting service or edit `compose.yml` (for Docker) or `vite.config.ts` (for frontend)

**Database reset**: To start fresh:
```bash
cd apps/@cpa-labeling
docker compose down -v  # Remove volumes
yarn nx docker @cpa-labeling/backend  # Restart
```

**Frontend not connecting to backend**: Ensure:
- Backend is running (check <http://localhost:8080/docs>)
- `.env.dev` has correct backend URL (should be `http://localhost:8080`)
- CORS is configured correctly in backend (`LABELING_ALLOWED_ORIGINS`)

### Running Tests

Backend tests:
```bash
cd backend
uv run pytest
```

Frontend tests:
```bash
# Note: Frontend tests not yet configured
# To add tests, configure Vitest in the frontend project
```

## Usage

1. Open <http://localhost:5173> in your browser
2. Log in (or skip auth if `VITE_SKIP_AUTH=true`)
3. Click on a record to start labeling
4. For each panel (Transcript, Summary, Action Plan), provide feedback:
   - **Factual issues**: Incorrect or unsupported facts
   - **Tone issues**: Inappropriate tone or language
   - **Other issues**: Any other concerns
   - Select severity: `none`, `low`, `med`, `severe`
   - Add notes as needed
5. Click "Save Feedback" to submit
6. Use Previous/Next to navigate between records

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/labeling/records` | List records available for labeling (paginated) |
| `GET` | `/api/labeling/records/{intake_id}` | Get full record details (transcript, summary, plan) |
| `POST` | `/api/labeling/feedback` | Submit or update feedback |
| `GET` | `/api/labeling/feedback/{intake_id}` | Get feedback for a record |
| `GET` | `/api/labeling/stats` | Get labeling progress statistics |

## Deployment

The app is deployed to Google Cloud Run using Terraform/Atmos.

### Infrastructure

- **Terraform**: `libs/atmos/components/terraform/apps/cpa-labeling/`
- **Stack configs**: `libs/atmos/stacks/cpa-labeling/`
- **Secret Manager Secrets**: `libs/atmos/components/terraform/secrets/sops/cpa-labeling-*.enc.yaml`

### Creating SOPS Secrets

1. Creating production secrets:
   ```bash
   # Modify the encrypted yaml
   sops components/terraform/secrets/sops/cpa-labeling-production.enc.yaml 
   # Run atmos apply to create the secrets
   ```

### Deploying

```bash
# Full deploy (includes image push and frontend build)
COMMIT_SHA=$(git rev-parse --short HEAD) nx deploy @cpa-labeling/backend --configuration production


# Production terraform-only deploy
atmos terraform apply apps/cpa-labeling -s recidiviz-rnd-planner--cpa-labeling
```

## Environment Variables

### Backend

| Variable | Description | Default |
|----------|-------------|---------|
| `LABELING_REENTRY_POSTGRES_USER` | Reentry DB username | `postgres` |
| `LABELING_REENTRY_POSTGRES_PASSWORD` | Reentry DB password | - |
| `LABELING_REENTRY_POSTGRES_SERVER` | Reentry DB host | `localhost` |
| `LABELING_REENTRY_POSTGRES_PORT` | Reentry DB port | `5432` |
| `LABELING_REENTRY_POSTGRES_DB` | Reentry DB name | `recidiviz` |
| `LABELING_LABELING_POSTGRES_USER` | Labeling DB username | `postgres` |
| `LABELING_LABELING_POSTGRES_PASSWORD` | Labeling DB password | - |
| `LABELING_LABELING_POSTGRES_SERVER` | Labeling DB host | `localhost` |
| `LABELING_LABELING_POSTGRES_PORT` | Labeling DB port | `5432` |
| `LABELING_LABELING_POSTGRES_DB` | Labeling DB name | `labeling` |
| `LABELING_ALLOWED_ORIGINS` | CORS allowed origins | - |
| `LABELING_SLACK_WEBHOOK_URL` | Slack webhook for severe alerts | - |

### Frontend

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_AUTH0_DOMAIN` | Auth0 domain | - |
| `VITE_AUTH0_CLIENT_ID` | Auth0 client ID | - |
| `VITE_AUTH0_AUDIENCE` | Auth0 API audience | - |
| `VITE_SKIP_AUTH` | Skip authentication | `false` |

