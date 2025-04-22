# JII Texting Server Prisma

Resource links:
Env Files

- [env_jii_texting_server](https://console.cloud.google.com/security/secret-manager/secret/env_jii_texting_server/versions?project=recidiviz-dashboard-staging)

## Development

If you haven't already, follow the setup instructions in the root README to install dependencies.

1. Get env variables by running `nx load-env-files @jii-texting/prisma`

   This way, `nx` will automatically pick up the correct environment variables based on the targets your are running.

### Updating the prisma schema

If you make changes to the prisma schema, you will need to run `nx prisma-migrate @jii-texting/prisma --name="{YOUR_CHANGE_NAME}"` to create a database migration file. In order for this to work, the database must be running in the docker container.

### Local development workflow

1. Run the command in the `Development` section above to get the latest environment variables for development from Google Secrets Manager.
2. Develop as needed in the `schema.prisma` file in the `@jii-texting-server` library.
3. Run `nx prisma-format @jii-texting/prisma` to format the file. You can also use the `Prisma` VSCode extension to aid in development.
4. Run `nx prisma-generate @jii-texting/prisma` to generate the Prisma client so that it's up-to-date according to the latest changes. Note, you'll see errors in other libraries that use a different Prisma schema.
5. Run `nx docker @jii-texting/prisma` to start a local Docker container.
6. Run `nx prisma-seed @jii-texting/prisma` to seed the local database with test data defined in `libs/@jii-texting/prisma/src/seed.ts`. 

You can use Postico and the login information from the `compose.yml` to connect to the local DB and inspect the contents. 
