# Build stage
FROM node:22.23.4-slim AS builder
WORKDIR /usr/src/app

RUN set -eux; \
  apt-get update; \
  apt-get install -y ca-certificates openssl --no-install-recommends; \
  rm -rf /var/lib/apt/lists/*

RUN corepack enable

COPY dist/apps/@idaho-th/server/package.json dist/apps/@idaho-th/server/yarn.lock dist/apps/@idaho-th/server/.yarnrc.yml ./
RUN yarn workspaces focus --production

COPY dist/apps/@idaho-th/server .

# Production stage
FROM node:22.23.4-slim
WORKDIR /usr/src/app

ENV NODE_ENV=production
# Cloud Run requires the host to be 0.0.0.0.
ENV HOST=0.0.0.0
ENV PORT=8080

RUN corepack enable

RUN set -eux; \
  apt-get update; \
  apt-get install -y -o Acquire::Retries=5 --no-install-recommends \
    ca-certificates \
    dumb-init \
    openssl \
    tesseract-ocr \
    tesseract-ocr-eng \
    tesseract-ocr-osd; \
  rm -rf /var/lib/apt/lists/*

COPY --chown=node:node dist/apps/@idaho-th/server/scripts ./scripts
RUN chmod +x scripts/*.sh

COPY --chown=node:node --from=builder /usr/src/app .

USER node
EXPOSE ${PORT}

# extensionless/register resolves the bundled output's directory imports; the
# sentry module is preloaded so Sentry instruments packages before main.js runs.
CMD ["dumb-init", "node", "--import=extensionless/register", "--import", "./sentry/index.js", "main.js"]
