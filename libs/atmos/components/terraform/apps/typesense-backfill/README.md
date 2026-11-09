# apps/typesense-backfill

Cloud Function v2 (HTTP-triggered) that bulk-imports a configured set of Firestore
collections into Typesense. Pairs with [`apps/typesense-sync`](../typesense-sync/);
the two are complementary:

|                  | [`apps/typesense-sync`](../typesense-sync/)                   | this component                             |
| ---------------- | ------------------------------------------------------------- | ------------------------------------------ |
| Trigger          | Firestore doc writes (Eventarc)                               | HTTP, from the Workflows ETL (or manually) |
| Sync mode        | Realtime, per-doc                                             | Batch, per-collection                      |
| Write shape      | Partial update of a fixed field set                           | Whole-document import of a collection      |
| Function name(s) | `typesense-sync-client-update` + `-client-opportunity-update` | `typesense-backfill`                       |
| Auth             | Standalone SA, shared GSM secret                              | Standalone SA, shared GSM secret           |

We use this for collections that are ETL'd once per day (rewriting the entire collection)
where per-doc realtime sync would be noisy and pointless — the same docs would be
written hundreds of thousands of times in a short window.

## How a backfill gets triggered

The Workflows Firestore ETL in [recidiviz-data](https://github.com/Recidiviz/recidiviz-data)
triggers every routine backfill. Each time the ETL finishes rewriting one Firestore
collection for one state, it asks this function to re-index that collection for that
state. There is no cron.

The chain runs in the data platform project (`recidiviz-staging` or `recidiviz-123`):

1. The calculation DAG exports each state's Workflows views to the
   `<project>-practices-etl-data` bucket as one JSON file per collection, for example
   `US_TX/client_record.json`.
2. A GCS notification publishes each new file to Pub/Sub, which pushes it to the
   `application-data-import` Cloud Run service at
   `/practices-etl/handle_workflows_firestore_etl`. That handler queues a Cloud Task on
   `workflows-etl-operations-queue`.
3. The task calls `/practices-etl/_run_firestore_etl`, which writes the file's records to
   Firestore and deletes the documents that run did not write.
4. Once the Firestore write succeeds, the ETL queues a second Cloud Task on
   `workflows-typesense-backfill-queue`. If queueing fails, the ETL logs the error and
   still succeeds, since its Firestore write is already done.
5. That task calls `/practices-etl/_trigger_typesense_backfill`, which POSTs to this
   function with an OIDC token for the `application-data-import-cr` service account and
   waits up to 480 seconds for the response.

The recidiviz-data side lives in
[`recidiviz/workflows/etl/routes.py`](https://github.com/Recidiviz/recidiviz-data/blob/main/recidiviz/workflows/etl/routes.py)
and
[`recidiviz/workflows/etl/typesense_backfill_client.py`](https://github.com/Recidiviz/recidiviz-data/blob/main/recidiviz/workflows/etl/typesense_backfill_client.py).
The queue is defined in that repo's
[`cloud-task-queues.tf`](https://github.com/Recidiviz/recidiviz-data/blob/main/recidiviz/tools/deploy/terraform/cloud-task-queues.tf).

### What the ETL sends

Each request covers one state and one collection. A state's daily export therefore
produces one request per collection below, plus one per opportunity that state has.

| Firestore collection                                                                       | Request body                                                                                                                                            |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `clients`, `residents`, `supervisionStaff`, `incarcerationStaff`, `locations`              | `{"stateCode": "US_TX", "collections": ["clients"]}`                                                                                                    |
| Each per-state opportunity collection, e.g. `US_TX-earlyReleaseFromSupervisionV2Referrals` | `{"stateCode": "US_TX", "collections": ["opportunities"], "sourceCollection": "US_TX-earlyReleaseFromSupervisionV2Referrals", "system": "SUPERVISION"}` |

`stateCode` scopes the Firestore scan, the import and the prune to that state, so one
state's run never touches another state's documents. For opportunities, the prune is
further limited to documents from that `sourceCollection`, because every opportunity
collection feeds the one Typesense `opportunities` collection.

The ETL does not trigger `opportunityUpdates`. [`apps/typesense-sync`](../typesense-sync/)
keeps it current, and a manual run can rebuild it.

### Retries and overlapping runs

- The queue dispatches at most 2 tasks at a time, at most 1 per second. That leaves 2 of
  the function's 4 instances free for manual runs and for any run that outlived its
  caller's 480-second timeout.
- When all 4 instances are busy, Cloud Run returns 429. The task fails, and Cloud Tasks
  retries it up to 5 attempts in total, backing off from 60 to 600 seconds.
- Overlapping runs are safe. Imports are upserts, the prune is limited to the request's
  state and source, and the prune re-checks every delete candidate against Firestore
  before deleting it.

### Duplicate requests for the same collection

A single export can produce two or more backfill requests for the same state and
collection, seconds or minutes apart. Each one comes from a separate ETL run over the
same file. The Pub/Sub subscription in step 2 has a 10-second ack deadline, and when the
push handler takes longer than that (usually on a cold start), Pub/Sub delivers the file
notification again and a second ETL task is queued. Both ETL runs trigger a backfill.

The extra runs do no harm. The second one imports the same documents and finds nothing
to prune. They do occupy a function instance for a few seconds to a few minutes.

Separately, production sometimes exports a state more than once in a day. Each export
correctly triggers its own ETL and its own backfills.

### Checking that a backfill ran

In this project's Cloud Logging, each run logs a start line and a completion line naming
the state and source, with totals:

```
[backfill] starting (state=US_TX) (source=US_TX-earlyReleaseFromSupervisionV2Referrals) (system=SUPERVISION): opportunities
[backfill] complete (state=US_TX) (source=US_TX-earlyReleaseFromSupervisionV2Referrals) in 2760ms { ... totals: { imported: 2637, failed: 0, deleted: 6 } }
```

On the recidiviz-data side, look for `_trigger_typesense_backfill` requests on the
`application-data-import` service. The trigger logs a warning when a run reports
`imported: 0`, which usually means the request named a collection or source that has
no documents.

## Source code

Source lives in the nx workspace at
[`apps/@typesense/backfill-fn/`](../../../../../../apps/@typesense/backfill-fn/) —
TypeScript with shared types and client factory from
[`~@typesense/client`](../../../../../@typesense/client/). Adapted from the
upstream extension's backfill function
([typesense/firestore-typesense-search@9f6343e — functions/src/backfill.js](https://github.com/typesense/firestore-typesense-search/blob/9f6343eefa6d5cf42747db84368c770e85de7241/functions/src/backfill.js)).

## Planning + deploying

```bash
nx plan   '@typesense/backfill-fn' -c staging       # build → atmos plan
nx deploy '@typesense/backfill-fn' -c staging       # build → atmos apply
nx plan   '@typesense/backfill-fn' -c production
nx deploy '@typesense/backfill-fn' -c production
```

Both targets `dependsOn` the bundle build, so `dist/apps/@typesense/backfill-fn/`
is always fresh before atmos runs. Build output is one bundled `index.cjs`
plus a slim runtime `package.json` listing only `firebase-admin` and
`typesense`; the Cloud Functions builder runs `npm install` server-side
against that manifest.

Direct atmos invocations (`atmos terraform plan apps/typesense-backfill -s recidiviz-dashboard-staging--typesense`)
work but need two things in place:

1. **`NX_WORKSPACE_ROOT` exported** — the stack file reads it via gomplate to
   tell TF where to find the bundle. Run `export NX_WORKSPACE_ROOT=$PWD`
   from the repo root, or invoke through `nx <target>` which sets it
   automatically.
2. **`dist/` populated** — run `nx build '@typesense/backfill-fn'` first, or
   `terraform plan` will fail because `archive_file` can't find the source
   directory.

## Invoking the function

Cloud Functions v2 deploys behind an HTTPS URL but requires authentication
(no `--allow-unauthenticated` in this config). Two ways to call it:

```bash
FN_URL="$(gcloud functions describe typesense-backfill \
  --gen2 \
  --region=us-east1 \
  --project=recidiviz-dashboard-staging \
  --format='value(serviceConfig.uri)')"

# Full backfill of all configured collections:
curl -fsS -X POST "$FN_URL" \
  -H "Authorization: Bearer $(gcloud auth print-identity-token)" \
  -H "Content-Type: application/json" \
  -d '{}' | jq

# Subset (useful while developing or recovering one collection):
curl -fsS -X POST "$FN_URL" \
  -H "Authorization: Bearer $(gcloud auth print-identity-token)" \
  -H "Content-Type: application/json" \
  -d '{"collections": ["clients", "residents"]}' | jq

# One state's copy of one opportunity, exactly as the ETL sends it:
curl -fsS -X POST "$FN_URL" \
  -H "Authorization: Bearer $(gcloud auth print-identity-token)" \
  -H "Content-Type: application/json" \
  -d '{"stateCode": "US_TX", "collections": ["opportunities"], "sourceCollection": "US_TX-earlyReleaseFromSupervisionV2Referrals", "system": "SUPERVISION"}' | jq
```

Every field in the request body is optional:

| Field              | Effect                                                                                             |
| ------------------ | -------------------------------------------------------------------------------------------------- |
| `collections`      | Typesense collections to run. Omit to run every configured collection. An empty array is rejected. |
| `stateCode`        | Limits the scan, import and prune to one state (`US_XX` or `US_XXX`). Omit to run every state.     |
| `sourceCollection` | The Firestore opportunity collection to read into `opportunities`. Requires `system`.              |
| `system`           | `SUPERVISION` or `INCARCERATION`. Written onto every document imported from `sourceCollection`.    |

The `opportunities` config has no Firestore source of its own, so a run that includes
`opportunities` without a `sourceCollection` (including the `{}` full backfill) imports
nothing into it. The prune refuses to act on an empty scan, so nothing is deleted
either. To rebuild an opportunity, send `sourceCollection` and `system` as in the last
example, once per opportunity collection.

staff-server's `POST /api/typesense/backfill` endpoint also calls this function, as the
`dashboard-metrics-*` service account.

## IAM

The function runs as a dedicated SA, `typesense-backfill@<project>.iam.gserviceaccount.com`, with:

- `roles/datastore.user` — read access to all Firestore collections in the project
- `roles/secretmanager.secretAccessor` on the Typesense API key secret, `typesense-write-api-key`, owned by the [`secrets`](../../secrets/) component (aliased in both stacks as `apps/typesense-api-key`)

This function and the sync functions share one API key rather than minting two —
both need identical Typesense write scope, and rotating two parallel keys is more
error-prone than rotating one. Apply that component before this one; the accessor
binding above fails if the secret is absent.

Callers need `roles/run.invoker` on the function's backing Cloud Run service, not a
Cloud Functions role, because a gen2 function runs on Cloud Run. The stack's
`invoker_members` grants it to two service accounts in the data platform project:

- `application-data-import-cr`, which the Workflows ETL uses to trigger backfills
- `dashboard-metrics-*`, staff-server's identity for `POST /api/typesense/backfill`

## Stack files

Per-env config lives at `libs/atmos/stacks/typesense/recidiviz-dashboard-<env>.yaml`
under the `apps/typesense-backfill` key.
