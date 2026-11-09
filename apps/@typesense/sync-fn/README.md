# @typesense/sync-fn

Realtime sync of the two user-written Firestore collections into Typesense.
Deployed as two Cloud Functions v2 by the
[`apps/typesense-sync`](../../../libs/atmos/components/terraform/apps/typesense-sync/)
atmos component.

The two triggers write in **different modes**, because they differ in who owns
the document being written:

| Entry point                   | Firestore trigger path                                        | Writes to                | Doc id               | Mode                             |
| ----------------------------- | ------------------------------------------------------------- | ------------------------ | -------------------- | -------------------------------- |
| `syncClientUpdate`            | `clientUpdatesV2/{recordId}`                                  | `clients` or `residents` | `{recordId}`         | **patch** — `preferredName` only |
| `syncClientOpportunityUpdate` | `clientUpdatesV2/{recordId}/clientOpportunityUpdates/{docId}` | `opportunityUpdates`     | `{recordId}_{docId}` | **own** — the whole document     |

A person's `preferredName` sits alongside ETL-owned fields on a record
backfill-fn owns, so that write has to be partial. An `opportunityUpdates`
document has no other writer, so this function replaces it whole — and
backfill-fn rebuilds the identical document from the same field list
(`OPPORTUNITY_UPDATE_FIELDS` plus `stateCode`) and the same `deriveUpdateFields`,
so the two cannot drift into a partial replace.

Neither handler reads Firestore. Everything written derives from the event
payload.

Companion libs: [`@typesense/client`](../../../libs/@typesense/client/) owns the
schemas and client factory; [`@typesense/backfill-fn`](../backfill-fn/) is the
authoritative writer, reconciling these same fields from Firestore on every run.

## What's here

- [`src/sync.ts`](src/sync.ts) — all the logic: path → target resolution, doc id
  composition, patch construction. Pure, takes the Typesense client as an
  argument.
- [`src/index.ts`](src/index.ts) — `onDocumentWritten` wiring. Thin on purpose.

## Never upsert a person record

`upsert` replaces the whole document and would wipe the ETL-sourced fields
backfill-fn owns, so the person handler issues a partial `update` (PATCH)
carrying only `preferredName`.

`update` also 404s rather than creating, which is load-bearing in two places:

- **Self-routing.** A person update's path doesn't say whether the record is a
  client or a resident, so both are tried in turn and the wrong one 404s.
- **Ordering.** The person record may not be indexed yet. That 404s, the outcome
  is logged as `ABSENT`, and the next backfill reconciles it from Firestore.
  Nothing is lost.

The opportunity handler does the opposite on purpose: it upserts, which creates,
so an officer's action is visible even when the batch side has never seen that
record.

## Writes that change nothing are dropped

Both triggers fire on every write to their document, including writes touching
only fields they don't own — `FirestoreStore` merges `stateCode` onto the parent
document on every opportunity action, and writes `currentReviewerId` onto the
subcollection document. `ownedFieldsChanged` compares before against after and
returns `NOOP` when no owned field moved, which avoids both a redundant write and
a 404 probe against the person collection the record isn't in.

## Deletes clear or remove, depending on the mode

A deleted `clientUpdatesV2` document **clears** `preferredName` rather than
removing the Typesense record — that record belongs to the ETL side and outlives
any officer action on it. Every declared field is always present in the patch
(null when absent), so un-denying or un-snoozing actually clears the previous
value instead of leaving it stale.

A deleted opportunity update document **deletes** its `opportunityUpdates`
mirror. That document _is_ the officer action, so with the action gone there is
nothing left to describe. A 404 on the delete is logged and swallowed: a
re-delivered trigger already removed it, and the backfill's prune would have.

The `own` mode omits absent fields rather than nulling them, which is the
opposite of the patch and correct for the opposite reason — an upsert replaces
the document, so leaving a field out already clears it. For `lastViewedTimestamp`
that is load-bearing, because the stale-alert partition queries for documents
_lacking_ it.

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
[sync] FIRE   update clientUpdatesV2/us_tn_123/clientOpportunityUpdates/usTnExpiration
[sync] UPSERT opportunityUpdates/us_tn_123_usTnExpiration status=DENIED action=true set=[denial,stateCode,actionHistory]
[sync] DONE   update clientUpdatesV2/us_tn_123/clientOpportunityUpdates/usTnExpiration → upserted in 42ms
```

The outcome line is one of:

| Line     | Meaning                                                           |
| -------- | ----------------------------------------------------------------- |
| `PATCH`  | Person record updated in `clients` or `residents`.                |
| `UPSERT` | `opportunityUpdates` document written whole.                      |
| `DELETE` | `opportunityUpdates` document removed, its Firestore source gone. |
| `ABSENT` | Target not in the index yet; the next backfill picks it up.       |
| `NOOP`   | The write touched no owned field.                                 |
| `SKIP`   | The trigger matched a path this function doesn't sync.            |

Field **names** are logged, never values — denial reasons and reviewer emails
don't belong in logs.

```bash
gcloud functions logs read typesense-sync-client-opportunity-update \
  --gen2 --region=us-east1 --project=recidiviz-dashboard-staging --limit=50
```

## Keeping in sync

- Field lists in `sync.ts` mirror the schemas in
  `libs/@typesense/client/src/schemas/index.ts`, the `mergeSources` for persons
  and the `opportunityUpdates` config in `export-collections.ts`. Fields not
  listed are dropped before the write, so adding a schema field means adding it
  in both places.
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
