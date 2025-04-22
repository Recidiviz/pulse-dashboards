# JII Texting Server

This is the server component of the JII Texting project. It is a [Fastify](https://fastify.dev/) server that provides APIs needed for the JII texting product

Some technical details:

- The server uses [Prisma](https://www.prisma.io/) to interact with the database.
- The server is configured to allow public access, specifically to allow Twilio to make requests to webhooks for incoming messages. Thus, any new routes will need authentication at the route level. 


## Deployment

Build the container:

```bash
nx run @jii-texting/server:container \
  --configuration=dev
```

```bash
nx run @jii-texting/server:deploy \
  --configuration=staging \ # or prod
  --tag=latest \
  --migrate=false
```

## Testing

If this is your first time working in the project, be sure to instantiate environment variable files by running `nx load-env-files @jii-texting/server`. If
you updated environment variables in `jii_texting_server.enc.yaml` by following the instructions at `libs/atmos/components/terraform/env-secrets/README.md`,
then be sure to run the first command again.

Run `nx test @jii-texting/server` to run any @jii-texting/server tests in `apps/@jii-texting/server` or `libs/@@jii-texting/server`. These tests are run in the
`test_jii_texting_server` step of the CI checks implemented at `build.yml`
