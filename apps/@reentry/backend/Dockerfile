FROM python:3.12-alpine

ENV PYTHONUNBUFFERED=1 \
    UV_LINK_MODE=copy \
    UV_COMPILE_BYTECODE=1

# install packages
WORKDIR /tmp
ADD https://astral.sh/uv/install.sh /uv-installer.sh
RUN sh /uv-installer.sh && rm /uv-installer.sh
ENV PATH="/root/.local/bin/:$PATH"

RUN mkdir -p /app
WORKDIR /app
COPY pyproject.toml uv.lock /app/
RUN uv sync --frozen

# bootstrap
COPY alembic.ini entrypoint.sh main.py /app/
COPY alembic /app/alembic
COPY app /app/app
COPY data /app/data
WORKDIR /app
CMD ["./entrypoint.sh"]
