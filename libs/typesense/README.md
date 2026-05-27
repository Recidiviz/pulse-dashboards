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

## Seeding from the Firestore emulator

Once `nx offline staff` is up (both Typesense and the Firestore emulator running), seed Typesense from the emulator's fixtures:

```bash
nx offline-seed typesense
```

This is one-shot and idempotent: it drops and recreates the collections (`clients`, `residents`, `supervisionStaff`, `incarcerationStaff`, `locations`), then imports every doc from the matching Firestore emulator collection. Re-run any time the fixtures change.

Verify:

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
