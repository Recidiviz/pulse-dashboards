# JII Prisma

## Development

If you haven't already, follow the setup instructions in the root README to install dependencies.

### Updating the prisma schema

If you make changes to the prisma schema, you will need to run `nx prisma-migrate @jii/prisma --name="{YOUR_CHANGE_NAME}"` to create a database migration file. In order for this to work, the database must be running in the docker container.
