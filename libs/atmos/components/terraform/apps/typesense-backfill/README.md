# apps/typesense-backfill

Cloud Function v2 (HTTP-triggered) that bulk-imports a configured set of Firestore
collections into Typesense. Lives alongside the firestore-typesense-search
extension; the two are complementary:

|                  | extension (`apps/firestore-typesense-search`)               | this component                                  |
| ---------------- | ----------------------------------------------------------- | ----------------------------------------------- |
| Trigger          | Firestore doc writes (Eventarc)                             | HTTP (manual / Cloud Scheduler / Pub/Sub later) |
| Sync mode        | Realtime, per-doc                                           | Batch, per-collection                           |
| Function name(s) | `ext-firestore-typesense-search-indexOnWrite` + `-backfill` | `typesense-backfill`                            |
| Auth             | Per-instance SA, GSM secret-bound                           | Standalone SA, same GSM secret (reused)         |

We use this for collections that are ETL'd once per day (rewriting the entire collection)
where per-doc realtime sync would be noisy and pointless — the same docs would be
written hundreds of thousands of times in a short window. The extension's own
backfill function can't be selectively run per collection on a schedule, so we
keep these collections out of `apps/firestore-typesense-search`'s
`FIRESTORE_COLLECTION_PATHS` entirely.

## Source code

[`function/`](function/) — Cloud Function source. Adapted from the upstream
extension's backfill function
([typesense/firestore-typesense-search@9f6343e — functions/src/backfill.js](https://github.com/typesense/firestore-typesense-search/blob/9f6343eefa6d5cf42747db84368c770e85de7241/functions/src/backfill.js)).

The TF apply zips `function/` (excluding `node_modules`) and uploads it; the
Cloud Functions builder runs `npm install` server-side from the
[`package.json`](function/package.json).

## Invoking the function

Cloud Functions v2 deploys behind an HTTPS URL but requires authentication
(no `--allow-unauthenticated` in this config). Two ways to call it:

```bash
# Get the deployed URL:
FN_URL="$(atmos terraform output apps/typesense-backfill -s recidiviz-dashboard-staging function_uri)"

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
```

## Adding a scheduled trigger

Not yet wired up — the user wants this triggered by a "ETL complete" signal,
not a fixed cron. When that signal is available, add a `google_cloud_scheduler_job`
(if cron) or an `google_eventarc_trigger` (if Pub/Sub) resource in this component
and an OIDC binding so the trigger can authenticate to the function.

## IAM

The function runs as a dedicated SA, `typesense-backfill@<project>.iam.gserviceaccount.com`, with:

- `roles/datastore.user` — read access to all Firestore collections in the project
- `roles/secretmanager.secretAccessor` on the Typesense API key secret (the same secret managed by [apps/firestore-typesense-search](../firestore-typesense-search/))

We reuse the extension's API key rather than minting a separate one — both functions
need identical Typesense write scope, and rotating two parallel keys is more error-prone
than rotating one.

## Stack files

Per-env config lives at `libs/atmos/stacks/typesense/recidiviz-dashboard-<env>.yaml`
under the `apps/typesense-backfill` key.
