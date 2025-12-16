# Build stage
FROM node:20-alpine as builder
WORKDIR /usr/src/app

# Enable corepack so newer versions of yarn can be installed
RUN corepack enable

# Copy over the package.json, yarn.lock, and .yarnrc.yml files
COPY dist/apps/@jii/server/package.json dist/apps/@jii/server/yarn.lock dist/apps/@jii/server/.yarnrc.yml ./
RUN yarn workspaces focus --production

COPY dist/apps/@jii/server .

# Production stage
FROM node:20-alpine
WORKDIR /usr/src/app

ENV NODE_ENV=production
# Cloud run requires the host to be 0.0.0.0
ENV HOST=0.0.0.0
ENV PORT=8080

RUN corepack enable

RUN apk add --no-cache dumb-init

# Copy over the scripts since they should rarely be changed
COPY --chown=node:node dist/apps/@jii/server/scripts ./scripts
RUN chmod +x scripts/*.sh

# Copy node_modules from builder stage
COPY --chown=node:node --from=builder /usr/src/app .

USER node
EXPOSE ${PORT}

# Make sure to:
# 1. Use the extensionless package so directory imports can be resolved
# 2. import the sentry module before the main.js file in order for packages to be instrumented
CMD ["dumb-init", "node", "--import=extensionless/register", "--import", "./sentry/index.js", "main.js"]
