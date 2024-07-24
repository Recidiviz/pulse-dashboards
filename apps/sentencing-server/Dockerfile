# Install dependencies only when needed
FROM node:20-slim
WORKDIR /usr/src/app

# Copy over the package.json and yarn.lock files since they are changed less often
COPY dist/apps/sentencing-server/package.json dist/apps/sentencing-server/yarn.lock ./
RUN yarn install --production --frozen-lockfile

RUN apt-get update -y && apt-get install -y openssl
RUN apt-get install dumb-init

ENV NODE_ENV production
# Cloud run requires the host to be 0.0.0.0
ENV HOST 0.0.0.0
ENV PORT 8080

# Copy over the rest of the files as late as we can
COPY dist/apps/sentencing-server .
RUN yarn prisma generate

RUN chown -R node:node .
USER node
EXPOSE ${PORT}

# Make sure to import the sentry module before the main.js file in order for packages to be instrumented
CMD ["dumb-init", "node", "--import", "./sentry/index.js", "main.js"]
