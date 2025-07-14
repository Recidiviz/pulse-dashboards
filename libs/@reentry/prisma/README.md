# Reentry Prisma

## Development

If you haven't already, follow the setup instructions in the root README to install dependencies.

1. Get env variables by running `nx load-env-files @reentry/prisma`
  This way, `nx` will automatically pick up the correct environment variables based on the targets you are running.

### Updating the prisma schema

If you make changes to the prisma schema, you will need to run `nx prisma-migrate @reentry/prisma --name="{YOUR_CHANGE_NAME}"` to create a database migration file. In order for this to work, the database must be running in the docker container.

### Seeding the local database

Run `nx prisma-seed @reentry/prisma` to seed the local database with test data.
