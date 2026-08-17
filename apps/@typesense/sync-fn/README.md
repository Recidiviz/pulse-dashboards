# @typesense/sync-fn

Realtime sync of the two user-written Firestore collections into Typesense.
Deployed as two Cloud Functions v2 by the
[`apps/typesense-sync`](../../../libs/atmos/components/terraform/apps/typesense-sync/)
atmos component.

Updates are merged **onto the record they update** rather than indexed as their
own collections — Typesense has no joins, so a parallel updates collection would
force every Workflows query to fan out and merge client-side. That makes this a
partial-update writer:

| Entry point                   | Firestore trigger path                                        | Patches                  | Doc id               |
| ----------------------------- | ------------------------------------------------------------- | ------------------------ | -------------------- |
| `syncClientUpdate`            | `clientUpdatesV2/{recordId}`                                  | `clients` or `residents` | `{recordId}`         |
| `syncClientOpportunityUpdate` | `clientUpdatesV2/{recordId}/clientOpportunityUpdates/{docId}` | `opportunities`          | `{recordId}_{docId}` |

Companion libs: [`@typesense/client`](../../../libs/@typesense/client/) owns the
schemas and client factory; [`@typesense/backfill-fn`](../backfill-fn/) is the
authoritative writer, reconciling these same fields from Firestore on every run.

## What's here

- [`src/sync.ts`](src/sync.ts) — all the logic: path → target resolution, doc id
  composition, patch construction. Pure, takes the Typesense client as an
  argument.
- [`src/index.ts`](src/index.ts) — `onDocumentWritten` wiring. Thin on purpose.

## Never upsert

`upsert` replaces the whole document and would wipe the ETL-sourced fields
backfill-fn owns. These handlers issue a partial `update` (PATCH) carrying only
the fields they own.

`update` also 404s rather than creating, which is load-bearing in two places:

- **Self-routing.** A person update's path doesn't say whether the record is a
  client or a resident, so both are tried in turn and the wrong one 404s.
- **Ordering.** An officer can act on an opportunity that the batch side hasn't
  indexed yet. That 404s, the outcome is logged as `ABSENT`, and the next
  backfill reconciles it from Firestore. Nothing is lost.

## Deletes clear, they don't delete

A deleted Firestore update document clears the fields it owns rather than
removing the Typesense record — the record belongs to the ETL side and outlives
any officer action on it. Every declared field is always present in the patch
(null when absent), so un-denying or un-snoozing actually clears the previous
value instead of leaving it stale.

## Doc id composition

The id is the document-id segments of the Firestore path joined with `_`,
matching `mergeDocIdFromPath` in backfill-fn. That correspondence is what lets
the batch and realtime writers address the same Typesense document, and it holds
for multi-instance opportunities too: the ETL keys those
`us_xx_<externalId>_<opportunityId>`, but backfill-fn composes its id from
document _fields_, which stay aligned with the person record id.

There is no test spanning both packages — the invariant is asserted separately on
each side. If you change either, check the other.

## Verifying a deployed sync

Each invocation logs one `FIRE` line, one outcome line, and one `DONE` line:

```
[sync] FIRE  update clientUpdatesV2/us_tn_123/clientOpportunityUpdates/usTnExpiration
[sync] PATCH opportunities/us_tn_123_usTnExpiration set=[denial] cleared=[manualSnooze,autoSnooze,submitted,actionHistory]
[sync] DONE  update clientUpdatesV2/us_tn_123/clientOpportunityUpdates/usTnExpiration → patched in 42ms
```

`ABSENT` in place of `PATCH` means the record isn't in the index yet and the next
backfill will pick it up. `SKIP` means the trigger matched a path this function
doesn't sync. Field **names** are logged, never values — denial reasons and
reviewer emails don't belong in logs.

```bash
gcloud functions logs read typesense-sync-client-opportunity-update \
  --gen2 --region=us-east1 --project=recidiviz-dashboard-staging --limit=50
```

## Keeping in sync

- Field lists in `sync.ts` mirror the schemas in
  `libs/@typesense/client/src/schemas/index.ts` and the `mergeSources` in
  `export-collections.ts`. Fields not listed are dropped before the write, so
  adding a schema field means adding it in both places.
- `CLIENT_UPDATE_PATTERN` / `OPPORTUNITY_UPDATE_PATTERN` must match the
  `match-path-pattern` event filters in the component's `main.tf`.

## Running tests

```bash
nx test '@typesense/sync-fn' -- --run
```

The Typesense client is faked in-test, so no cluster is needed.

## Deploying

```bash
nx deploy '@typesense/sync-fn' -c staging
```

Builds, then runs `atmos terraform apply`. See the component README for the
Eventarc trigger-region gotcha.
