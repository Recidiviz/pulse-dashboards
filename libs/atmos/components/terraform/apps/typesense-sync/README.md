# apps/typesense-sync

Firestore-triggered Cloud Functions (v2) that patch user-written updates onto the
Typesense record they update, in realtime.

| Firestore path                                                | Typesense collection     | Doc id               | Fields patched                                                       |
| ------------------------------------------------------------- | ------------------------ | -------------------- | -------------------------------------------------------------------- |
| `clientUpdatesV2/{recordId}`                                  | `clients` or `residents` | `{recordId}`         | `preferredName`                                                      |
| `clientUpdatesV2/{recordId}/clientOpportunityUpdates/{docId}` | `opportunities`          | `{recordId}_{docId}` | `denial`, `manualSnooze`, `autoSnooze`, `submitted`, `actionHistory` |

Source lives at [`apps/@typesense/sync-fn`](../../../../../../apps/@typesense/sync-fn/).

## Why this exists instead of the extension

The sibling [`apps/firestore-typesense-search`](../firestore-typesense-search/)
component installs the upstream Firebase extension, which still handles the
standalone `clientUpdatesV2` collection. It **cannot** do what this component
does, for two reasons:

- It sets the Typesense document id to `snapshot.id` verbatim. A subcollection
  doc's id is just the opportunity type, so every client's `usTnExpiration`
  update would map to one Typesense document.
- It writes whole documents. These fields live alongside ETL-owned fields on
  `opportunities` and `clients`/`residents`, so the write has to be a partial
  update or the ETL data is destroyed on every officer action.

## Relationship to the backfill

[`apps/typesense-backfill`](../typesense-backfill/) is the **authoritative**
writer for these fields — its `mergeSources` config reconciles them from
Firestore on every run. These functions are a latency optimization on top. A
patch that 404s because the batch side hasn't indexed the record yet is logged
and dropped; the next backfill picks it up.

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

Each invocation logs a `FIRE` line, a `PATCH` / `ABSENT` / `SKIP` outcome naming
the collection, doc id and which fields were set or cleared, and a `DONE` line
with the elapsed time. Field names only — never values.

## Gotchas

**`firestore_database_location` is the Eventarc trigger region, not the function
region.** It must match where the Firestore database lives: `us-east1` in
staging, `nam5` in production. A mismatch creates the trigger successfully and
then silently never fires — the same failure mode documented on the extension
component's `firestore_database_location`.

**The path patterns are duplicated in code.** `local.client_update_pattern` and
`local.opportunity_update_pattern` in `main.tf` must stay identical to
`CLIENT_UPDATE_PATTERN` / `OPPORTUNITY_UPDATE_PATTERN` in
`apps/@typesense/sync-fn/src/sync.ts`. Terraform binds the trigger;
firebase-functions resolves the delivered event against its own copy.

**The API key is shared with the extension and the backfill.** All three read
`ext-firestore-typesense-search-TYPESENSE_API_KEY`, owned by the
`firestore-typesense-search` component and sourced from its SOPS file. Rotating
it means re-applying that component and restarting consumers — see its README.

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
