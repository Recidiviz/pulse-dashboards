# shared-pathways

This library contains code that is shared between Public Pathways, and Pathways in the staff app.

## Syncing content

Content in `src/content` (page copy, metric copy) can be synced from an external Google Sheet by running:

```bash
nx sync-content shared-pathways
```

This requires the following environment variables, which are loaded automatically by the requires-sops-env plugin:

- `CONTENT_SHEET_ID` - ID of the Google Sheet where the content is stored
- `SHEET_API_SERVICE_ACCOUNT` - Service account used to authenticate/authorize access to the sheet
- `SHEET_API_SERVICE_ACCOUNT_KEY` - API key used to access the Google Sheet

## Running unit tests

Run `nx test shared-pathways` to execute the unit tests via [Vitest](https://vitest.dev/).
