# Build stage
FROM node:20-slim AS builder
WORKDIR /usr/src/app

RUN corepack enable

COPY dist/apps/@meetings/import/package.json dist/apps/@meetings/import/yarn.lock dist/apps/@meetings/import/.yarnrc.yml ./
RUN yarn workspaces focus --production

COPY dist/apps/@meetings/import .

# Production stage
FROM node:20-slim
WORKDIR /usr/src/app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=8080

RUN apt-get update -y && apt-get install -y openssl dumb-init && rm -rf /var/lib/apt/lists/*

COPY --from=builder /usr/src/app .

RUN chown -R node:node .
USER node
EXPOSE ${PORT}

CMD ["dumb-init", "node", "--import=extensionless/register", "--import", "./sentry/index.js", "main.js"]
