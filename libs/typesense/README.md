# typesense

Shared Typesense tooling for Recidiviz apps.

## Local Typesense container

A Docker-based Typesense node for offline development and Firestore-emulator sync experiments.

### Lifecycle

Brought up automatically as part of `nx offline staff`.

Manual control:

```bash
nx offline typesense         # docker compose up
nx offline-down typesense    # docker compose down
nx offline-health typesense  # check the container's /health endpoint
```

To wipe the data volume and start clean:

```bash
docker compose -f libs/typesense/docker-compose.yaml down -v
```

### Connection details

- Host: `http://localhost:8108`
- API key: `xyz` (dev only)
- Data persists in named volume `typesense_data`

### Verification

```bash
curl http://localhost:8108/health
curl http://localhost:8108/collections -H "X-TYPESENSE-API-KEY: xyz"
```

## Syncing from the Firestore emulator

Two modes:

**Live sync (default)** — `nx offline-sync typesense` runs a long-running watcher that drops and recreates the Typesense collections, does an initial bulk import, then subscribes to Firestore emulator changes via `onSnapshot` and mirrors them to Typesense in real time. Started automatically as part of `nx offline staff`.

**One-shot seed** — `nx offline-seed typesense` does the same drop/recreate/import but exits immediately. Useful when you don't need the watcher running (CI, scripted verification, etc.).

Both modes are idempotent: they drop the target collections before importing, so re-running gives a clean state.

The watcher stands in for the production Firestore→Typesense extension, which is HTTPS-only and can't talk to local HTTP Typesense. The watcher also doubles as a prototype for the custom Cloud Function that production will need for opportunities (the extension doesn't support constant-field discriminator stamping).

### Verification

```bash
curl 'http://localhost:8108/collections/clients/documents/search?q=*&query_by=stateCode' \
  -H 'X-TYPESENSE-API-KEY: xyz' | jq '.found, .hits[0].document | keys'
```

The schemas in [src/schemas/index.ts](src/schemas/index.ts) declare only the fields needed for facet/filter/scope enforcement — any fields not declared here are dropped by Typesense on import. Search-target fields are added in later stacked PRs as the search bar lands.

## Roadmap

Future additions to this lib:

- Phase 2 collections (`opportunities`, `opportunityUpdates`, `personUpdates`)
- Phase 4 collections (`tasks`, `taskUpdates`)
- Scoped-key minting helpers (consumed by `staff-shared-server`)
- Shared filter-builder module (state-aware caseload-visibility filters)
- Firebase extension installation for live Firestore → Typesense sync (Spike 4)

## Running unit tests

Run `nx test typesense` to execute the unit tests via [Vitest](https://vitest.dev/).
