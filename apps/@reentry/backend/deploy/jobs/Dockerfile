# deploy/Dockerfile
#
# Pinned by digest to python:3.12-alpine3.22 (Alpine 3.22.4). The tag
# python:3.12-alpine floats: the images currently deployed were built from
# Alpine 3.22.1, while that tag resolves to Alpine 3.24.3 today. Rebuilding
# against the floating tag would ship a two-release OS upgrade -- musl 1.2.5 ->
# 1.2.6, and new major versions of ffmpeg and libpq, neither of which is version
# -pinned in the apk add below -- to nine production Cloud Run jobs at once,
# under the guise of a security patch.
#
# Pinning keeps `apk upgrade` picking up Alpine 3.22 security updates, so this
# image can be rebuilt for a CVE without also moving the OS. Bump the digest
# deliberately, as its own change, with the jobs exercised afterwards.
FROM python:3.12-alpine3.22@sha256:a190708a2dec1bd18b1decb539f8e8f5407abaa9bf39cacda583f7f8c11db322

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
