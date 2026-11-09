# apps/typesense-sync

Firestore-triggered Cloud Functions (v2) that mirror user-written updates into
Typesense in realtime.

| Firestore path                                                | Typesense collection     | Doc id               | Write mode                       |
| ------------------------------------------------------------- | ------------------------ | -------------------- | -------------------------------- |
| `clientUpdatesV2/{recordId}`                                  | `clients` or `residents` | `{recordId}`         | **patch** — `preferredName` only |
| `clientUpdatesV2/{recordId}/clientOpportunityUpdates/{docId}` | `opportunityUpdates`     | `{recordId}_{docId}` | **own** — the whole document     |

**The two modes are not interchangeable.** A person's `preferredName` sits
alongside ETL-owned fields on a record `backfill-fn` owns, so that write has to
be a partial update or the ETL data is destroyed on every officer action. An
`opportunityUpdates` document has no other writer, so sync-fn replaces it whole,
carrying `OPPORTUNITY_UPDATE_FIELDS` (`denial`, `manualSnooze`, `autoSnooze`,
`omsSnooze`, `submitted`, `actionHistory`, `lastViewed`, `completed`,
`adjudicationStatus`) plus `stateCode`, and the fields `deriveUpdateFields`
computes from them.

A deleted Firestore document clears the person field, but **deletes** the
`opportunityUpdates` document — that document is the officer action.

Source lives at [`apps/@typesense/sync-fn`](../../../../../../apps/@typesense/sync-fn/).

## Relationship to the backfill

[`apps/typesense-backfill`](../typesense-backfill/) is the **authoritative**
writer for both targets — its `mergeSources` config reconciles `preferredName`,
and its `opportunityUpdates` config rebuilds those documents from the same
subcollection. These functions are a latency optimization on top.

A person patch that 404s because the batch side hasn't indexed the record yet is
logged as `ABSENT` and dropped; the next backfill picks it up. The
`opportunityUpdates` upsert creates rather than 404ing, so an officer's action
shows up even before the batch side has seen that record.

The two writers must compose identical document ids. sync-fn joins the
document-id segments of the Firestore path; backfill-fn's `mergeDocIdFromPath`
does the same, and its `docIdFields` composes the matching key from ETL document
fields. Changing either without the other silently decouples them — the sync
would 404 forever and the merge would find nothing.

## Deploying

```bash
nx deploy '@typesense/sync-fn' -c staging
nx deploy '@typesense/sync-fn' -c production
```

`atmos terraform apply` alone does **not** build — it ships whatever is in
`dist/`. Use the nx target, which builds first.

## Verifying

```bash
gcloud functions logs read typesense-sync-client-opportunity-update \
  --gen2 --region=us-east1 --project=recidiviz-dashboard-staging --limit=50
```

Each invocation logs a `FIRE` line, one outcome line, and a `DONE` line with the
elapsed time. The outcome is `PATCH`, `UPSERT`, `DELETE`, `ABSENT` (target not
indexed yet), `NOOP` (the write touched no owned field) or `SKIP` (path not
synced), naming the collection, doc id and which fields were set or cleared.
Field names only — never values.

## Gotchas

**`firestore_database_location` is the Eventarc trigger region, not the function
region.** It must match where the Firestore database lives: `us-east1` in
staging, `nam5` in production. A mismatch creates the trigger successfully and
then silently never fires. `apps/typesense-backfill` takes the same variable for
the same reason.

**The path patterns are duplicated in code.** `local.client_update_pattern` and
`local.opportunity_update_pattern` in `main.tf` must stay identical to
`CLIENT_UPDATE_PATTERN` / `OPPORTUNITY_UPDATE_PATTERN` in
`apps/@typesense/sync-fn/src/sync.ts`. Terraform binds the trigger;
firebase-functions resolves the delivered event against its own copy.

**The API key is shared with the backfill.** Both read `typesense-write-api-key`,
owned by the [`secrets`](../../secrets/) component, which both stacks alias as the
`apps/typesense-api-key` entry.
Minting and rotating it are documented in
[apps/typesense](../typesense/#the-write-scoped-key-used-by-sync-fn-and-backfill-fn),
alongside the cluster admin key you need in order to mint it.

**Retries are on.** `RETRY_POLICY_RETRY` means a failed invocation is redelivered.
The handlers are idempotent (partial updates of a fixed field set, 404-tolerant),
so duplicates are harmless, but a persistently failing write will retry for up
to 24h.

**`GOOGLE_FUNCTION_SIGNATURE_TYPE=cloudevent` is required in `build_config`.**
`gcloud functions deploy --trigger-event-filters` sets it implicitly; the
Terraform resource does not infer it from `event_trigger`. Without it the
buildpack starts functions-framework in http mode and the handler receives an
Express `Request` instead of a CloudEvent. firebase-functions finds no `data` on
it and hands the trigger an event with neither `before` nor `after` — **no error
is raised**, the function just silently does nothing. The handler logs a
pointed message if this recurs.
