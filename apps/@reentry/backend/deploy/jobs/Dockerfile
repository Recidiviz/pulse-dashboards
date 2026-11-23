# deploy/Dockerfile
#
# Pinned by digest to python:3.12-alpine3.24 (Alpine 3.24.3) -- the same base
# the reentry backend image runs. Keep the digest pin: it makes a rebuild
# reproducible, and `apk upgrade` below still picks up Alpine security updates
# within the release. Dependabot's docker ecosystem refreshes this digest
# weekly, so the pin stays current without a hand-edit.
#
# This was briefly pinned to Alpine 3.22 to avoid shipping an OS upgrade under
# the guise of a security patch. That pin had to move: 3.22 tops out at
# brotli-libs 1.1.1-r0 and can never reach the 1.2.1-r0 that CVE-2026-111497
# requires (Alpine fixed it in 3.24; 3.22 has no secfix entry for it at all).
# The upgrade it guarded against -- musl 1.2.6, ffmpeg 8.1.3, libpq 18 -- is
# already what the backend image runs in every environment against the same
# Cloud SQL instances, so the jobs are not the first to take it.
FROM python:3.15-alpine3.24@sha256:0f9552bb28711333da16915ec146f5e6bb44a7fdac9ced15dc17c2e0206346dd

ENV PYTHONUNBUFFERED=1 \
    UV_LINK_MODE=copy \
    UV_COMPILE_BYTECODE=1

RUN apk update && apk upgrade --no-cache
RUN apk add --no-cache \
    ffmpeg \
    postgresql-libs \
    gcc \
    python3-dev \
    musl-dev \
    postgresql-dev \
    netcat-openbsd \
    curl \
    gettext

RUN pip install redis

RUN curl -o /usr/local/bin/cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.8.1/cloud-sql-proxy.linux.amd64 && \
    chmod +x /usr/local/bin/cloud-sql-proxy

RUN mkdir -p /cloudsql && chmod 777 /cloudsql

COPY --from=ghcr.io/astral-sh/uv:0.11.8 /uv /usr/local/bin/uv

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
