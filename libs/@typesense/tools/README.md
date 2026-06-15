# @typesense/tools

CLI tooling for the Recidiviz Typesense clusters: collection provisioning,
deploy-safe schema migrations, the local Docker cluster for offline mode, and
the Firestore-emulator → local-Typesense sync watcher.

Read-side helpers (client factory, schemas, scope compilation, inspect) live in
the sibling [`@typesense/client`](../client/) lib — tools imports from it.

## Local Typesense container

A Docker-based Typesense node for offline development and Firestore-emulator
sync experiments.

### Lifecycle

Brought up automatically as part of `nx offline staff`.

Manual control:

```bash
nx offline '@typesense/tools'         # docker compose up
nx offline-down '@typesense/tools'    # docker compose down
nx offline-health '@typesense/tools'  # check the container's /health endpoint
```

To wipe the data volume and start clean:

```bash
docker compose -f libs/@typesense/tools/docker-compose.yaml down -v
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

**Live sync (default)** — `nx offline-sync '@typesense/tools'` runs a long-running watcher that drops and recreates the Typesense collections, does an initial bulk import, then subscribes to Firestore emulator changes via `onSnapshot` and mirrors them to Typesense in real time. Started automatically as part of `nx offline staff`.

**One-shot seed** — `nx offline-seed '@typesense/tools'` does the same drop/recreate/import but exits immediately. Useful when you don't need the watcher running (CI, scripted verification, etc.).

Both modes are idempotent: they drop the target collections before importing, so re-running gives a clean state.

The watcher stands in for the production Firestore→Typesense extension, which is HTTPS-only and can't talk to local HTTP Typesense. The watcher also doubles as a prototype for the custom Cloud Function that production will need for opportunities (the extension doesn't support constant-field discriminator stamping).

## Provisioning collections (initial bootstrap)

Pre-create the Typesense collections from [`@typesense/client`'s schemas](../client/src/schemas/index.ts). The Firebase → Typesense extension requires collections to exist before sync starts, so this is the first step when standing up a new cluster:

```bash
nx provision '@typesense/tools' -c staging
# create-if-not-exists (safe to re-run, idempotent)
```

Re-running is safe — existing collections and their data are left alone.

For schema CHANGES on an existing cluster, use [`migrate-schemas`](#evolving-a-schema-deploy-safe) instead — `provision` only creates missing collections, it doesn't mutate existing ones.

## Evolving a schema (deploy-safe)

After the initial provision, schema changes (add/drop fields) should land via `migrate-schemas`, which uses Typesense's `PATCH /collections/<n>` to mutate existing collections in place — no data loss, no downtime. This is the path the deploy pipeline takes.

```bash
nx migrate-schemas '@typesense/tools' -c staging                  # apply
nx migrate-schemas '@typesense/tools' -c staging -- --dry-run     # preview only, no mutations
```

What it does for each collection in [`@typesense/client`'s schemas](../client/src/schemas/index.ts):

| Local vs. live                                                                     | Action                                                                |
| ---------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Collection missing in Typesense                                                    | CREATE with local schema                                              |
| Field declared locally, missing in live                                            | ADD via PATCH (must be `optional: true`)                              |
| Field in live, not declared locally                                                | DROP via PATCH                                                        |
| Field exists in both with different attributes                                     | ABORT — Typesense can't mutate field attrs in place; resolve manually |
| Collection-level setting changed (`enable_nested_fields`, `default_sorting_field`) | ABORT — these are immutable; recreate required                        |

Constraints to know going in:

- **New fields must be `optional: true`.** Existing docs won't have the field until backfill catches up; non-optional would break searches in the interim. The script errors out if it sees a non-optional add.
- **Type changes aren't supported.** If you need to change a field's `type`, do it as a drop in one deploy and a re-add (under a new name, if possible) in a follow-up deploy. The script aborts rather than silently failing.
- **`--dry-run` first** if you're unsure. It prints the plan without touching anything.

## Recreating a collection (emergency / manual recovery only)

```bash
nx provision '@typesense/tools' -c staging -- --recreate
```

Drops and recreates EVERY collection — **destructive, all docs are lost**. Gated by a typed confirmation prompt; aborts on non-TTY. Use this only when:

- Recovering a corrupted collection during an incident.
- Changing a collection-level setting (`enable_nested_fields`, `default_sorting_field`) that Typesense considers immutable.

This is never part of the automated deploy. Always follow up with a full backfill from the sync pipeline.

## Env file security

The env files in this lib carry the cluster **write key** — provisioning and
migration are destructive operations and the key has `documents:*` +
`collections:*` actions.

Decryption of `env.staging.enc.yaml` is gated on the
`pulse-dashboards-sops-typesense-admin` KMS key (in
`recidiviz-dashboard-staging`), separate from the broad-access dashboards SOPS
key used elsewhere. IAM on that key determines who can run write/migration
operations. See [`.sops.yaml`](../../../.sops.yaml) for the rule.

(The KMS key keeps its `-admin` suffix even though the lib was renamed —
renaming a KMS key requires re-encrypting every file that uses it, and the
key name doesn't need to match the lib name.)

Decryption of `env.production.enc.yaml` behaves similarly, gated on
`pulse-dashboards-sops-typesense-admin` KMS key (in
`recidiviz-dashboard-production`),

## Running unit tests

Run `nx test '@typesense/tools'` to execute the unit tests via [Vitest](https://vitest.dev/).
