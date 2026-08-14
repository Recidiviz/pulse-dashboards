# apps/jii

This is the frontend for the Opportunities webapp for justice impacted individuals.

## Development

This app serves as the main entry point for the Opportunities development environment. Therefore running `nx dev jii` will start the dev servers for both the frontend and backend in `apps/@jii/server`. (There is virtually no functionality that's accessible by running just the frontend dev server on its own.)

### With staging data

`nx dev jii` lets you develop in a local frontend and backend against the staging database (via a CloudSQL proxy). This gets you fresh and real data, but can be subject to temporary outages when your local Prisma schema gets ahead of what's been deployed to staging.

It also requires you to be logged into gcloud **before** starting the proxy service (run `gcloud auth login --update-adc`). If your gcloud session expires while the proxy service is running, you'll have to restart the Docker services in `@jii/prisma` after reauth using `nx docker-down @jii/prisma && nx docker @jii/prisma`. (These services keep running in the background until you explicitly shut them down, so this will likely be a regular occurrence.)

### With local data

`nx offline jii` lets you to develop features in the database itself, or to develop against fixture data, in offline mode. In offline mode the app does not require authentication (it self-identifies as a fake user; see the `OfflineAuthHandler`) and it does not communicate with any external services.

**The offline database starts out empty and you will need to manually seed it with fixture data using `nx seed @jii/import`.** This is not run automatically when starting the server, but you can run it on demand for updated fixture data.

### Reentry features

Some states (e.g. Idaho) have integrated features shared with `apps/@reentry`; you will see them once you navigate to that state and select a resident from the search page. The Vite dev server includes proxy rules for communicating with the staging backend, so your dev environment will run against staging data for these features as well.

In Offline Mode, however, this app will instead send requests to your local backend dev server from `apps/@reentry/backend`, so you will need to be running that also to access those features. Refer to instructions in `apps/@reentry` for how to do that. The residents you can see in this app should also be present in the reentry development data, but they are kept in sync manually, so if people are missing you may need to add them to the BigQuery fixtures in `apps/@reentry/backend` (again, refer to instructions in that project about how to do this).
