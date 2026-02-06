FROM python:3.11-alpine

ENV PYTHONUNBUFFERED=1 \
    UV_LINK_MODE=copy \
    UV_COMPILE_BYTECODE=1

COPY --from=ghcr.io/astral-sh/uv:0.9.25 /uv /usr/local/bin/uv

WORKDIR /app

# Copy uv files and install dependencies
COPY apps/@cpa-labeling/backend/pyproject.toml apps/@cpa-labeling/backend/uv.lock ./
RUN uv sync --locked

# Copy application code
COPY apps/@cpa-labeling/backend/app/ ./app/

# Copy alembic configuration and migrations
COPY apps/@cpa-labeling/backend/alembic.ini ./
COPY apps/@cpa-labeling/backend/alembic/ ./alembic/

# Copy pre-built frontend from dist folder
COPY dist/apps/@cpa-labeling/frontend ./static

# Run with uvicorn via uv
CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
