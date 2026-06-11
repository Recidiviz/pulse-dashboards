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

## Remote cluster management (staging / production)

The targets below talk to the deployed Typesense cluster (e.g. `typesense-staging.recidiviz.org` or `typesense.recidiviz.org`). They load `TYPESENSE_HOST` and `TYPESENSE_ADMIN_API_KEY` from the SOPS-encrypted env file for the chosen configuration — pass `-c staging` or `-c production` on every command.

### Keys per env

Each env's SOPS-encrypted `env.<env>.enc.yaml` holds two distinct Typesense keys:

| Env var                   | Scope                                                              | Used by                                                            |
| ------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------ |
| `TYPESENSE_API_KEY`       | `documents:search` only (parent for runtime-generated scoped keys) | [`client.ts`](src/client.ts) — search bar, mint endpoint           |
| `TYPESENSE_ADMIN_API_KEY` | admin — full cluster control                                       | [`inspect.ts`](src/inspect.ts), [`provision.ts`](src/provision.ts) |

A third key — the Firebase extension's write key — also exists per env, but it lives in Google Secret Manager (managed by [`apps/firestore-typesense-search`](../atmos/components/terraform/apps/firestore-typesense-search/)) rather than this env file, since the extension reads it directly via the secret-ref binding.

### Minting a new TYPESENSE_API_KEY (search-only parent)

The search bar minting endpoint signs runtime scoped keys off of this parent
key, then hands them to the staff app. Typesense rejects admin keys as parent
keys for scoped-key generation, so it MUST be `documents:search`-only.

Stash the cluster admin key first — it comes from the typesense component's
SOPS file:

```bash
export TS_ADMIN_KEY="$(sops -d ../atmos/components/terraform/apps/typesense/secrets/recidiviz-dashboard-staging.enc.yaml | yq '.typesense_admin_api_key')"
```

Mint, scoped narrowly to the searchable collection set:

```bash
curl -fsS "https://typesense-staging.recidiviz.org/keys" \
  -H "X-TYPESENSE-API-KEY: $TS_ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Parent search key — staff client (staging)",
    "actions": ["documents:search"],
    "collections": ["clients", "residents", "supervisionStaff", "incarcerationStaff", "locations"]
  }' | jq
```

The response's `value` is the only copy — capture it now. Verify it's search-only by confirming a non-search action 403s:

```bash
# Should 200:
curl -fsS "https://typesense-staging.recidiviz.org/collections/clients/documents/search?q=*&query_by=stateCode" \
  -H "X-TYPESENSE-API-KEY: <new-key-value>" | jq '.found'

# Should 403:
curl -fsS -X DELETE "https://typesense-staging.recidiviz.org/collections/clients/documents/__nope__" \
  -H "X-TYPESENSE-API-KEY: <new-key-value>"
```

Encrypt into the env file:

```bash
sops env.staging.enc.yaml
# Set:
#   TYPESENSE_API_KEY: <value>
```

Re-run any consumer (`nx <target> typesense -c staging`) to confirm the new
key is picked up.

After rotation, revoke the old parent key in Typesense (otherwise any
previously-issued scoped key signed off it remains valid until its
`expires_at`):

```bash
# Find id by value_prefix:
curl -fsS "https://typesense-staging.recidiviz.org/keys" \
  -H "X-TYPESENSE-API-KEY: $TS_ADMIN_KEY" \
  | jq '.keys[] | {id, description, value_prefix}'

# Delete:
curl -fsS -X DELETE "https://typesense-staging.recidiviz.org/keys/<id>" \
  -H "X-TYPESENSE-API-KEY: $TS_ADMIN_KEY"
```

### Provisioning collections

Pre-create the Typesense collections from [src/schemas/index.ts](src/schemas/index.ts). The Firebase → Typesense extension requires collections to exist before sync starts, so this is the first step when standing up a new cluster.

```bash
nx provision typesense -c staging                   # create-if-not-exists (safe to re-run)
nx provision typesense -c staging -- --recreate     # drop + recreate (use when schema has changed incompatibly)
```

Default behavior is idempotent — re-running won't touch existing collections or their data. Use `--recreate` only when you need to apply a schema change that requires dropping the existing collection.

### Inspecting a remote cluster

All read-only — safe to run against either environment.

```bash
nx list-collections typesense -c staging
# Plain list of collection names, one per line. Pipe-friendly.

nx collection-summary typesense -c staging
# Names + document counts + field counts (console.table format).

nx collection-schema typesense -c staging --collection=supervisionStaff
# Full collection schema (fields, settings, doc count) as pretty JSON.
```

Swap `staging` ↔ `production` on `-c` to switch clusters.

### Health check from a workstation

```bash
curl https://typesense-staging.recidiviz.org/health    # public, no auth needed
```

For full cluster health, alert triage, and deployment runbooks see [`libs/atmos/components/terraform/apps/typesense/RUNBOOK.md`](../atmos/components/terraform/apps/typesense/RUNBOOK.md).

## Roadmap

Future additions to this lib:

- Phase 2 collections (`opportunities`, `opportunityUpdates`, `personUpdates`)
- Phase 4 collections (`tasks`, `taskUpdates`)
- Scoped-key minting helpers (consumed by `staff-shared-server`)
- Shared filter-builder module (state-aware caseload-visibility filters)
- Firebase extension installation for live Firestore → Typesense sync (Spike 4)

## Running unit tests

Run `nx test typesense` to execute the unit tests via [Vitest](https://vitest.dev/).
