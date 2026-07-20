# Staff Dashboard: Firebase Hosting → Cloud CDN rollout plan

Status: **Phase 1** (staging validated on test domain).

## Background

The staff frontend is currently served by Firebase Hosting, which is fronted by the Fastly CDN.
Recurring multi-second stalls were traced to cross-site Fastly/Firebase infra incidents outside
our control. This stack (private CMEK GCS bucket → Cloud CDN → global external ALB) replaces it.

### Performance benchmark

Two A/B runs, each `n=100`, all responses 200, Brotli negotiated (real-browser encoding).
Both fetch similar ~11.2 MB uncompressed vendor javascript bundles.

**Clean-window run** (low, steady latency — no stall incident in the sample). Medians:

| Metric (median)           | Firebase | Cloud CDN | CDN advantage      |
| ------------------------- | -------- | --------- | ------------------ |
| TTFB                      | 72.2 ms  | 41.0 ms   | **1.76× faster**   |
| Total                     | 154.0 ms | 98.5 ms   | **1.56× faster**   |
| Transfer (total − TTFB)   | 81.7 ms  | 57.5 ms   | 1.42× faster       |
| p95 total                 | 168.2 ms | 103.8 ms  | 1.62× faster       |
| max total                 | 224.9 ms | 140.9 ms  | —                  |
| sd total                  | 12.4 ms  | 5.6 ms    | **2.2× steadier**  |
| Total per uncompressed MB | 13.7 ms  | 8.8 ms    | 1.56× faster       |
| TLS handshake             | 37.0 ms  | 36.7 ms   | ~equal (same edge) |
| Wire bytes/run            | 2.73 MB  | 3.26 MB   | 19% _more_ (see ↓) |

Cloud CDN is ~1.6× faster end-to-end and ~2× more consistent (every percentile tighter).
Note it does this **while shipping 19% more bytes**: Firebase serves a pre-compressed Brotli-q11 asset at rest (2.73
MB),
Cloud CDN compresses on the fly at a speed-oriented level (3.26 MB).
The CDN wins anyway because its transfer rate is higher (effective 195 vs 137 MB/s), so per-uncompressed-MB it's still
1.56× ahead.
The remaining 19% is deliberately left on the table — pre-compressing Brotli at upload would
break non-`br` clients (GCS doesn't transcode stored Brotli), and dynamic Brotli already
beats Firebase's gzip fallback for non-`br` clients.

_Caveats: single vantage point (one US client/network), single time window per run. The
interleaved A/B design means both endpoints saw identical conditions within a run, so the
ratios are sound even though absolute latency shifts between windows._

## Standing decisions

- PR preview channels stay on Firebase Hosting (keep the `hosting` block in `firebase.json`
  for channels even after cutover).
- Demo env stays on Firebase for now (revisit after prod cutover).
- Compression is `AUTOMATIC` (dynamic Brotli) on the **assets** bucket only. The **html**
  and **index** buckets are `DISABLED`: dynamically compressing the SPA fallback's
  custom-error-response body intermittently caches a zero-length response, blanking deep
  links for browsers (which always negotiate `br`). HTML is ~1.6 KB so the loss is
  negligible. Do not pre-compress at upload either (GCS won't transcode stored Brotli for
  non-`br` clients).

## Phase 1 — Staging bake (~1 week)

1. Add `https://dashboard-cdn-staging.recidiviz.org` to the Auth0 **staging** tenant
   (callback/logout/web origins) and the typesense staging CORS allowlist
   (`libs/atmos/stacks/typesense/recidiviz-dashboard-staging.yaml`).
2. Run usual staging release; the CDN updates ride alongside Firebase. Team dogfoods the test domain.
3. Validate over at least one real deploy cycle:
   - Full Auth0 login round-trip in a browser.
   - A tab left open from a prior deploy still loads its old hashed chunks (lifecycle/no-delete
     design working).
   - Client-side `Cache-Control` on `/assets/*` under `FORCE_CACHE_ALL` (browser-cache
     parity vs Firebase's `immutable`), `age:` header incrementing on repeat requests,
     `content-encoding: br` in a real browser.
   - Post-deploy invalidation latency (fresh index.html within minutes).

## Phase 2 — Production provisioning (no user impact; parallel-serve)

1. Add `libs/atmos/stacks/staff/recidiviz-dashboard-production.yaml`: mirror staging with
   `environment: production`, `domain_name: dashboard-cdn.recidiviz.org` (prod test
   domain), `bucket_name: recidiviz-dashboard-production-staff-frontend` (must match the
   env mapping in `tools/deploy-staff-frontend.mts`). Apply; request the test-domain DNS
   A record; wait for cert ACTIVE.
2. Add `"production"` to `cdnEnabledEnvs` in `tools/deploy/services/staff.mts`; run the
   next production release so prod builds ship to both targets.
3. Spot-validate the prod test domain (headers, deep links, assets) and re-run the A/B
   benchmark against production Firebase — confirms the win holds on the prod build/config.

## Phase 3 — Real-domain cutover (staging first as dress rehearsal, then prod)

The real domains (`dashboard-staging.recidiviz.org`, then `dashboard.recidiviz.org`) are
already in every allowlist (Auth0, typesense CORS, Segment/Sentry), so cutover is purely
DNS + certificates. Two prerequisites make it zero-downtime:

1*. *Lower DNS TTL ahead of time.\*\* The existing records carry TTL 14400 (4 h). Drop the
real domain's TTL to 300 s at least 24 h before the flip (rollback speed = TTL).

Cutover runbook (per env — run staging fully, soak ~2 days, then prod):

1. Final release with dual deploy; confirm both targets serve the identical revision.
2. Flip the A record `dashboard[-staging].recidiviz.org` → the LB IP
   (`load_balancer_ip` output). Keep the Firebase site deployed and untouched.
3. Monitor for the TTL window and after: Sentry error rate, Auth0 login success, LB 5xx /
   backend-bucket 4xx (a spike in XML-API errors would indicate a routing regression),
   cache hit ratio, latency dashboards.
4. **Rollback** = revert the A record to Firebase's targets (minutes at TTL 300). Nothing
   else to undo — Firebase remains fully deployed and current throughout the soak.
   - staging firebase ip: 34.144.222.152
     - production firebase ip: 151.101.1.195
5. Keep TTL at 300 until the soak completes, then restore the normal TTL.

## Phase 4 — Soak and decommission (~2 weeks after prod cutover)

1. During soak: keep dual deploys so the rollback target stays current.
2. After soak:
   - Make the CDN upload unconditional in `staffFrontend.deploy()` (drop the env-var gate
     and the warn-don't-fail wrapper — CDN failures should now fail the release) and
     remove the `firebase deploy --only hosting` call for staff.
   - Keep `firebase.json`'s hosting block (PR preview channels still use it) and all
     emulator/functions config.
   - Keep or retire the `dashboard-cdn[-staging]` test domains (useful as canaries; if
     retired, remove their Auth0/CORS entries).
   - Add an uptime check + alerting on the real domain; dashboard for LB 5xx,
     latency, cache hit ratio.
   - Decide demo: stay on Firebase indefinitely, or provision `environment: demo` (needs a
     first-ever demo custom domain).
3. Update docs: CLAUDE.md deploy notes, oncall runbook pointer to this file.

## Risk register

| Risk                                                        | Mitigation                                                                                             |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Deploy pause > 30 days deletes live assets (lifecycle rule) | Release cadence is weekly; raise `asset_retention_days` if a freeze is planned                         |
| Private-bucket access is a 2-week-old GA feature            | Weeks of staging bake + dual-serve soak before Firebase is retired                                     |
| Cert provisioning gap on cutover                            | Certificate Manager DNS-auth certs go ACTIVE pre-flip (Phase 3.1)                                      |
| Slow rollback via DNS                                       | TTL lowered to 300 s ≥24 h before flip; Firebase stays deployed through soak                           |
| Stale edge caches after deploy                              | Deploys invalidate `/*` synchronously; HTML TTL is 1 h worst-case (same as Firebase's `s-maxage=3600`) |
| `deploy-staff-frontend.mts production` before Phase 2       | Fails loudly at first upload (bucket doesn't exist); release tool gates via `cdnEnabledEnvs`           |
