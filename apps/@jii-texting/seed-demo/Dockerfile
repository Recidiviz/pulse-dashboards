# Build stage
FROM node:20-alpine AS builder
WORKDIR /usr/src/app

RUN corepack enable

COPY dist/apps/@jii-texting/seed-demo/package.json dist/apps/@jii-texting/seed-demo/yarn.lock dist/apps/@jii-texting/seed-demo/.yarnrc.yml ./
RUN yarn workspaces focus --production

COPY dist/apps/@jii-texting/seed-demo .

# Production stage
FROM node:20-alpine
WORKDIR /usr/src/app

ENV NODE_ENV=production
# Cloud run requires the host to be 0.0.0.0
ENV HOST=0.0.0.0
ENV PORT=8080

RUN corepack enable

RUN apk add --no-cache dumb-init

COPY --chown=node:node --from=builder /usr/src/app .

USER node
EXPOSE ${PORT}

ENTRYPOINT ["dumb-init", "--", "node", "--import=extensionless/register", "main.js"]

CMD []
