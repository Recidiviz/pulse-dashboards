# @idaho-th/client

Idaho TH web client (Vite + React).

## Environments

| Env        | Public URL                              | How the SPA is served                     |
| ---------- | --------------------------------------- | ----------------------------------------- |
| Local      | `http://localhost:4300`                 | `nx dev @idaho-th/client`                 |
| Staging    | **`https://housing-stg.recidiviz.org`** | Cloud Run frontend behind the regional LB |
| Production | **`https://housing.recidiviz.org`**     | Cloud Run frontend behind the regional LB |

Firebase Hosting is not used. Deploy the client container via Atmos
(`frontend_container_version`) alongside the server and job image pins. Auth0
domain / client ID / audience and `API_URL` are plain env vars written into
`/config.js` at startup.

## Deploy

Pin the client image when applying `apps/idaho-th`:

```bash
COMMIT_SHA=<12-char-sha>
yarn atmos:apply apps/idaho-th -s <stack> -- \
  -var server_container_version="$COMMIT_SHA" \
  -var migrate_db_container_version="$COMMIT_SHA" \
  -var seed_db_container_version="$COMMIT_SHA" \
  -var frontend_container_version="$COMMIT_SHA"
```

Build/push the client image first (`nx container @idaho-th/client -c staging`
with `COMMIT_SHA` set), same as the other Idaho TH images. The deploy helper
does this verification for normal staging/production app deploys.

## Running unit tests

Run `nx test @idaho-th/client` to execute the unit tests via [Vitest](https://vitest.dev/).
