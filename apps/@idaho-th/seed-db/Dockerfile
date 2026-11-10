# Build stage
FROM node:22.23.4-alpine AS builder
WORKDIR /usr/src/app

RUN corepack enable

COPY dist/apps/@idaho-th/seed-db/package.json dist/apps/@idaho-th/seed-db/yarn.lock dist/apps/@idaho-th/seed-db/.yarnrc.yml ./
RUN yarn workspaces focus --production

COPY dist/apps/@idaho-th/seed-db .

# Production stage
FROM node:22.23.4-alpine
WORKDIR /usr/src/app

ENV NODE_ENV=production
ENV HOUSING_PROVIDERS_CSV_PATH=/usr/src/app/HousingProviders.csv

RUN corepack enable
RUN apk add --no-cache dumb-init

COPY --chown=node:node --from=builder /usr/src/app .

USER node

CMD ["dumb-init", "node", "--import=extensionless/register", "main.js"]
