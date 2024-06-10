# auth0-jii

This library contains Auth0 configuration for the JII app (`/apps/jii`). The Auth0 integration (found in `src/auth0`) is generally managed via the Auth0 Console (https://manage.auth0.com) rather than any tooling in this library, but any custom code we create should be stored here to support easy reference and code reviews.

## Tenants

The JII app has two associated Auth0 tenants:

- **recidiviz-jii-staging**: used for development and staging environments
- **recidiviz-jii**: used for the production environment ONLY

This library exports the configuration settings and functions needed to create and validate tokens against each of these tenants.
