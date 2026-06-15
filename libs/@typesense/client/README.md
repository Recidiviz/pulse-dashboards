# @typesense/client

Shared FE-facing Typesense module: the client factory, collection schemas, FE
scope-to-filter compilation, and read-only inspect tooling. Imported by the
staff frontend and `staff-shared-server`.

Companion lib: [`@typesense/tools`](../tools/) owns write operations
(provision, migrate-schemas), the local Docker cluster, and the Firestore-emulator
sync watcher.

```ts
import {
  createTypesenseClient,
  schemas,
  resolveStaffScope,
  toTypesenseFilter,
} from "~@typesense/client";
```

## What's here

- [`src/client.ts`](src/client.ts) — `createTypesenseClient` factory plus a
  localhost-defaulting variant for offline use.
- [`src/schemas/index.ts`](src/schemas/index.ts) — canonical Typesense
  collection schemas. Single source of truth for all consumers (extension,
  backfill function, provision, migrate, search bar).
- [`src/scope/`](src/scope/) — FE caseload-visibility scope resolution and
  compilation to Typesense `filter_by` clauses.
- [`src/export-collections.ts`](src/export-collections.ts) — emits
  collection→fields JSON to stdout for consumption by the atmos stack files
  (`!exec` tag).
- [`src/inspect.ts`](src/inspect.ts) — read-only introspection of a remote
  cluster. Today reads `TYPESENSE_API_INSPECT_KEY`; the follow-up is to mint a
  dedicated `collections:list,get` ops key so inspect doesn't need the admin
  key.

## Remote cluster introspection

All read-only — safe to run against either environment.

```bash
nx collection-list '@typesense/client' -c staging
# Plain list of collection names, one per line. Pipe-friendly.

nx collection-summary '@typesense/client' -c staging
# Names + document counts + field counts (console.table format).

nx collection-schema '@typesense/client' -c staging --collection=supervisionStaff
# Full collection schema (fields, settings, doc count) as pretty JSON.
```

Swap `staging` ↔ `production` on `-c` to switch clusters.

Inspect reads `TYPESENSE_HOST` and `TYPESENSE_API_INSPECT_KEY` from the
SOPS-encrypted env file for the chosen configuration. The full key inventory
lives in [`env.staging.enc.yaml`](env.staging.enc.yaml) / [`env.production.enc.yaml`](env.production.enc.yaml).

## Minting a new TYPESENSE_API_KEY (search-only parent)

The search bar minting endpoint signs runtime scoped keys off of this parent
key, then hands them to the staff app. Typesense rejects admin keys as parent
keys for scoped-key generation, so it MUST be `documents:search`-only.

Stash the cluster admin key first — it comes from the typesense component's
SOPS file:

```bash
export TS_ADMIN_KEY="$(sops -d ../../atmos/components/terraform/apps/typesense/secrets/recidiviz-dashboard-staging.enc.yaml | yq '.typesense_admin_api_key')"
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

## Health check from a workstation

```bash
curl https://typesense-staging.recidiviz.org/health    # public, no auth needed
```

For full cluster health, alert triage, and deployment runbooks see [`libs/atmos/components/terraform/apps/typesense/RUNBOOK.md`](../../atmos/components/terraform/apps/typesense/RUNBOOK.md).

## Running unit tests

Run `nx test '@typesense/client'` to execute the unit tests via [Vitest](https://vitest.dev/).
