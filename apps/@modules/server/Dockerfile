# Build stage
FROM node:22.22-alpine as builder
WORKDIR /usr/src/app

COPY dist/apps/@modules/server .

# Production stage
FROM node:22.22-alpine
WORKDIR /usr/src/app

ENV NODE_ENV=production
# Cloud run requires the host to be 0.0.0.0
ENV HOST=0.0.0.0
ENV PORT=8080

RUN corepack enable

RUN apk add --no-cache dumb-init

USER node
EXPOSE ${PORT}

# Make sure to:
# 1. Use the extensionless package so directory imports can be resolved
# 2. import the sentry module before the main.js file in order for packages to be instrumented
#CMD ["dumb-init", "node", "--import=extensionless/register", "--import", "./sentry/index.js", "main.js"]
CMD ["dumb-init", "node", "--import=extensionless/register", "main.js"]
