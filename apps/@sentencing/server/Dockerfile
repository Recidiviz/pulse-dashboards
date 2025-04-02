# Install dependencies only when needed
FROM node:20-slim
WORKDIR /usr/src/app

ENV NODE_ENV production
# Cloud run requires the host to be 0.0.0.0
ENV HOST 0.0.0.0
ENV PORT 8080

RUN apt-get update -y && apt-get install -y openssl
RUN apt-get install dumb-init

# Copy over the scripts since they should rarely be changed
COPY dist/apps/@sentencing/server/scripts ./scripts
RUN chmod +x scripts/*.sh

# Enable corepack so newer versions of yarn can be installed
RUN corepack enable

# Copy over the package.json, yarn.lock, and .yarnrc.yml files since they are changed less often
COPY dist/apps/@sentencing/server/package.json dist/apps/@sentencing/server/yarn.lock dist/apps/@sentencing/server/.yarnrc.yml ./
RUN yarn workspaces focus --production

# Copy over the rest of the files as late as we can
COPY dist/apps/@sentencing/server .
RUN yarn prisma generate

RUN chown -R node:node .
USER node
EXPOSE ${PORT}

# Make sure to:
# 1. Use the extensionless package so directory imports can be resolved
# 2. import the sentry module before the main.js file in order for packages to be instrumented
CMD ["dumb-init", "node", "--import=extensionless/register", "--import", "./sentry/index.js", "main.js"]
