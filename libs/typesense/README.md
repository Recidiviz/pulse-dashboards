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

## Roadmap

Future additions to this lib:

- Collection schema definitions (clients, residents, staff, locations, opportunities, …)
- Typesense client wrapper(s) for frontend and backend usage
- Scoped-key minting helpers (consumed by `staff-shared-server`)
- Shared filter-builder module (state-aware caseload-visibility filters)
- Local seed / sync scripts for offline mode

## Running unit tests

Run `nx test typesense` to execute the unit tests via [Vitest](https://vitest.dev/).
