# deploy/Dockerfile
FROM python:3.12-alpine

ENV PYTHONUNBUFFERED=1 \
    UV_LINK_MODE=copy \
    UV_COMPILE_BYTECODE=1

RUN apk add --no-cache \
    ffmpeg \
    postgresql-libs \
    gcc \
    python3-dev \
    musl-dev \
    postgresql-dev \
    netcat-openbsd \
    curl \
    redis \
    gettext

RUN pip install redis

RUN curl -o /usr/local/bin/cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.8.1/cloud-sql-proxy.linux.amd64 && \
    chmod +x /usr/local/bin/cloud-sql-proxy

RUN mkdir -p /cloudsql && chmod 777 /cloudsql

COPY --from=ghcr.io/astral-sh/uv:0.9.25 /uv /usr/local/bin/uv

WORKDIR /app
COPY pyproject.toml uv.lock /app/
RUN uv sync --locked


COPY alembic.ini main.py /app/
COPY alembic /app/alembic
COPY app /app/app
COPY data /app/data


COPY deploy/jobs/entrypoints/entrypoint.*.sh /app/

RUN chmod +x /app/entrypoint.*.sh

WORKDIR /app
ENV PORT=8080
