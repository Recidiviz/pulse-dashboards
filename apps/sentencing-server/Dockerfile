# Install dependencies only when needed
FROM node:20-slim
WORKDIR /usr/src/app

# Install production dependencies
COPY dist/apps/sentencing-server .
RUN yarn install --production --frozen-lockfile

RUN apt-get update -y && apt-get install -y openssl
# Install the prisma cli so it can be used generate the prisma client
# and to run migrations in the cloud run job
# TODO: figure out how to keep this in sync with the package.json
RUN yarn add prisma@^5.1.1
RUN yarn prisma generate

RUN apt-get install dumb-init
ENV NODE_ENV production
# Cloud run requires the host to be 0.0.0.0
ENV HOST 0.0.0.0
ENV PORT 8080

RUN chown -R node:node .
USER node
EXPOSE ${PORT}

CMD ["dumb-init", "node", "main.mjs"]
