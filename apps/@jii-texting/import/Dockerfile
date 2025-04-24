# Install dependencies only when needed
FROM node:20-slim
WORKDIR /usr/src/app

ENV NODE_ENV production

RUN apt-get update -y && apt-get install -y openssl
RUN apt-get install dumb-init

# Enable corepack so newer versions of yarn can be installed
RUN corepack enable

# Copy over the package.json, yarn.lock, and .yarnrc.yml files since they are changed less often
COPY dist/apps/@jii-texting/import/package.json dist/apps/@jii-texting/import/yarn.lock dist/apps/@jii-texting/import/.yarnrc.yml ./
RUN yarn workspaces focus --production

# Copy over the rest of the files as late as we can
COPY dist/apps/@jii-texting/import .
RUN yarn prisma generate

# Make sure to:
# 1. Use the extensionless package so directory imports can be resolved
# 2. import the sentry module before the main.js file in order for packages to be instrumented
CMD ["dumb-init", "node", "--import=extensionless/register", "--import", "./sentry/index.js", "main.js"]
