# apps/jii

This is the frontend for the Opportunities webapp for justice impacted individuals.

## Development

This app serves as the main entry point for the Opportunities development environment. Therefore running `nx dev jii` will start the dev servers for both the frontend and the Firebase Functions backend in `apps/jii-functions`. (Run `nx dev-spa jii` to run the frontend Vite server on its own).

By default we develop this app against staging data (from Firestore). If you need to develop against fixture data instead, you can run this app in Offline Mode with `nx offline jii`. In Offline Mode the app does not communicate with Firebase Functions or Firestore.

### Reentry features

Some states (e.g. Idaho) have integrated features shared with `apps/@reentry`; you will see them once you navigate to that state and select a resident from the search page. The Vite dev server includes proxy rules for communicating with the staging backend, so your dev environment will run against staging data for these features as well.

In Offline Mode, however, this app will instead send requests to your local backend dev server from `apps/@reentry/backend`, so you will need to be running that also to access those features. Refer to instructions in `apps/@reentry` for how to do that. The residents you can see in this app should also be present in the reentry development data, but they are kept in sync manually, so if people are missing you may need to add them to the BigQuery fixtures in `apps/@reentry/backend` (again, refer to instructions in that project about how to do this).
