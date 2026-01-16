FROM python:3.12-alpine

ENV PYTHONUNBUFFERED=1 \
    UV_LINK_MODE=copy \
    UV_COMPILE_BYTECODE=1

COPY --from=ghcr.io/astral-sh/uv:0.9.25 /uv /usr/local/bin/uv

WORKDIR /app
COPY pyproject.toml uv.lock /app/
RUN uv sync --locked

# bootstrap
COPY alembic.ini entrypoint.sh main.py /app/
COPY alembic /app/alembic
COPY app /app/app
COPY data /app/data
WORKDIR /app
CMD ["./entrypoint.sh"]
