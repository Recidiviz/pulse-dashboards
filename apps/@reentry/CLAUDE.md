# CPA (Reentry) Sub-project

This app is called **CPA** internally. It is composed of a Python/FastAPI backend (`apps/@reentry/backend`) and a Next.js frontend (`apps/@reentry/frontend`). It helps caseworkers run assessments with reentry clients and generate AI-driven action plans.

## Domain Concepts

- **Intake** — an assessment session between a caseworker and a JII (Justice Impacted Individual) client. The core entity; most other records hang off it.
- **Plan / PlanGeneration** — a Plan has many PlanGenerations. Each generation is one version of the action plan (AI-generated or manually edited). The latest generation is what the user sees.
- **OutputConfig** — a YAML file that drives LLM behavior for a specific output type (e.g. action plan, summary). Validated via `OutputFileLoader.validate_yaml_content()`.
- **Execution** — a background task state-tracking row. Many tables have a required FK to `execution`. When writing tests, pre-create the `Execution` row or FK constraints will fail.
- **ActionPlan / ActionPlanSection** — structured plan output types in `app/utils/action_plan_types.py`. `LLMAgentGenerate.generate()` returns `ActionPlanMarkdown`, which wraps both `action_plan: str` (rendered markdown) and `structured_action_plan: ActionPlan`.

## Backend

Backend tasks are exposed as nx targets (`nx <target> @reentry/backend`) that run from the repo root and auto-load the SOPS-encrypted env (see `project.json`). Raw `uv`/`alembic` commands that have no dedicated target run from `apps/@reentry/backend`.

### Dev Setup

```bash
# macOS system deps (one-time)
brew install cairo pango glib gobject-introspection gdk-pixbuf uv

# Start postgres, redis, and background worker
nx docker-up @reentry/backend

# Run migrations
nx migrate @reentry/backend

# Seed database
nx seed-db @reentry/backend

# Start API server
nx dev @reentry/backend
```

The API is at `http://localhost:8000`. Docs at `http://localhost:8000/docs`.

The **worker process** must be started with `nx worker @reentry/backend` to process background tasks. Without it, background tasks (plan generation, transcription, evals) queue but never run.

### Testing

```bash
nx test @reentry/backend   # unit tests
```

macOS: if WeasyPrint/libgobject PDF tests fail to load native libs, prefix with the Homebrew lib path (it propagates through nx to the `uv` subprocess): `DYLD_LIBRARY_PATH=/opt/homebrew/lib nx test @reentry/backend`.

Tests use a real test DB (started by `nx docker-up-tests @reentry/backend`). Do not mock the database.

**TaskIQ tasks in tests** — tasks decorated with `@broker.task` cannot be called directly. Use `.original_func(...)` to bypass the broker:

```python
await my_task.original_func(execution_id=..., session=AsyncMock(), ...)
```

**fakeredis** — tests use fakeredis automatically (set in `conftest.py`). Do not configure a real Redis URL for tests.

### ORM

Uses **SQLModel** (not plain SQLAlchemy). Field definitions, relationships, and session handling follow SQLModel conventions. See existing models in `app/models/` for patterns.

### Manage Commands

Some manage commands have dedicated nx targets (run from the repo root): `nx seed-db @reentry/backend`, `nx generate-client-data @reentry/backend`, `nx reset-client-cache @reentry/backend`. Others run via `uv run python -m app.manage <command>` from `apps/@reentry/backend`.

| Command      | How to run                                                                     |
| ------------ | ------------------------------------------------------------------------------ |
| `seed-db`    | `nx seed-db @reentry/backend` — seed DB with fixtures                          |
| `evaluate-*` | `uv run python -m app.manage evaluate-*` (see `app/manage/evaluate/README.md`) |

### Database Migrations

```bash
# Apply migrations
nx migrate @reentry/backend
```

The following have no nx target — run them from `apps/@reentry/backend`:

```bash
# Generate migration after model changes
uv run alembic revision --autogenerate -m "description"

# Rollback one step
uv run alembic downgrade -1
```

See `apps/@reentry/backend/alembic/README.md` for migration conventions.

### Authentication

Two separate auth systems:

- **Staff (caseworkers)** — Auth0. Use `get_auth_user_context` dependency in routes.
- **JII clients** — JWT issued by the backend. Two flows: `state+docid`, `firebase-token`. Auth logic in `app/auth/intake/`. Rate limiting for client auth uses Redis.

## Frontend

All frontend commands run from the repo root. Before running any frontend commands, switch to the correct Node version:

```bash
nvm use
```

```bash
# Start dev server
nx dev @reentry/frontend

# Unit tests
nx test @reentry/frontend
```

### API Client

The frontend uses **openapi-react-query** (`$api`), generated from the FastAPI OpenAPI schema. This is not React Query or tRPC.
Types can be found at libs/@reentry/openapi-types/src/recidiviz-schema.d.ts and imported from ~@reentry/openapi-types.

For endpoints not covered by the OpenAPI schema (e.g. PDF blob endpoints), use `fetchWithAuth` instead of raw `fetch()`. It injects `Authorization` and `X-Impersonated-Email` automatically, mirroring what `authMiddleware` does for `$api` calls.

```typescript
import { fetchWithAuth } from "~@reentry/frontend-shared";

const response = await fetchWithAuth(`${API_URL}/api/some/endpoint`, {
  method: "GET",
});
```

Never use raw `fetch()` for backend calls — it silently drops auth and impersonation headers.

### Auth

```typescript
import { useAuth } from "~@reentry/frontend/lib/auth";

const { getAccessToken } = useAuth();
const token = getAccessToken();
```

Protected pages live under `app/(protected)/`. Client-facing pages live under `app/(client)/`.

### Shared Frontend

The JII client-facing intake UI is shared with the JII app via `libs/@reentry/frontend-shared`. Changes there affect both apps.

### Frontend best-practice

New components should always use css modules, the codebase is moving away from tailwinds.

## LLM Configuration

Output behavior (prompts, model, version) is driven by YAML config files in `app/core/data_config/`. These are validated at load time via `OutputFileLoader.validate_yaml_content()`. Feature flags for enabling/disabling functionality live in `app/utils/feature_flags.py` and `feature_flags_config.py`. Model use outside of intakes is
configured in `config.py`

## Intake Chatbot Guardrails

The intake chatbot's safety guardrail system is documented in `app/utils/intake/GUARDRAILS.md`. It covers all three guardrail layers (regex, prompt engineering, AI classifiers), hard/soft stop behavior, message visibility rules, and Slack alerting.

## PDF Generation

PDF rendering for all three document types (action plan, intake summary, chat history) is handled entirely by the backend. See `app/pdf/README.md` for architecture, how to add a new PDF endpoint, security requirements (URL fetcher, content escaping), and the markdown preprocessing pipeline.
