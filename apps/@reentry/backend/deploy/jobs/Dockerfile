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


WORKDIR /tmp
ADD https://astral.sh/uv/install.sh /uv-installer.sh
RUN sh /uv-installer.sh && rm /uv-installer.sh
ENV PATH="/root/.local/bin/:$PATH"


WORKDIR /app
COPY pyproject.toml uv.lock /app/
RUN uv sync --frozen


COPY alembic.ini main.py /app/
COPY alembic /app/alembic
COPY app /app/app
COPY data /app/data


COPY deploy/jobs/entrypoints/entrypoint.*.sh /app/

RUN chmod +x /app/entrypoint.*.sh

WORKDIR /app
ENV PORT=8080
