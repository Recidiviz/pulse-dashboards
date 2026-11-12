# apps/staff-synthetic-monitor

GCP Cloud Monitoring **Synthetic Monitors** (2nd-gen Cloud Functions + uptime
checks) that sign in to the deployed staff dashboard through Auth0 with
Playwright and assert the authenticated app loads — an early signal when the
live login flow breaks. **One monitor is deployed per state**, each with its own test user and assertions,
so failures are isolated and alertable per state.

## Source code

Source lives in the nx workspace at
[`apps/@staff/synthetic-monitor-fn/`](../../../../../../apps/@staff/synthetic-monitor-fn/) —
TypeScript, bundled to a single `index.cjs` + slim runtime `package.json` under
`dist/apps/@staff/synthetic-monitor-fn/` by `nx build '@staff/synthetic-monitor-fn'`.

## What this component creates

Shared across all states:

- A dedicated service account (all per-state functions run as it).
- A source bucket holding the one bundle uploaded from the nx build.

Per configured state:

- A Cloud Function v2 (`nodejs22`, entry point `SyntheticFunction`), named
  `<function_name>-<state-slug>` (e.g. `staff-synthetic-monitor-us-ia`), with
  `STATE_CODE` set so the bundle selects that state's assertions.
- Two Secret Manager secrets (`<function_name>-<state-slug>-user` / `-password`)
  plus a version each, whose values come from the SOPS file (see below). Only
  the function SA (and project owners, implicitly) can access them.
- A `google_monitoring_uptime_check_config` with a `synthetic_monitor`
  referencing that state's function (cadence via `check_period`, default 900s;
  GCP caps it at 900s / 15 min).

Shared alerting (when `monitoring_enabled`, the default):

- Two `google_monitoring_notification_channel`s — email (`monitoring.alert_email`)
  and a `pubsub` channel to the shared PagerDuty forwarder topic.
- **One aggregated** `google_monitoring_alert_policy` (CRITICAL) over all the
  per-state checks, grouped by `check_id`, that fires when any check has been
  failing continuously for `monitoring.failure_duration` (~2 runs). See
  [Alerting](#alerting).

State codes use a lowercase-hyphen slug in resource names (`US_IA` -> `us-ia`);
the raw code reaches the function via `STATE_CODE`.

## Credentials (SOPS, ephemeral + write-only)

Per-state test credentials live in **one SOPS file per state, per environment**:

```
environments/staging/US_AZ.enc.yaml
environments/staging/US_TX.enc.yaml
environments/production/US_AZ.enc.yaml
...
```

Each is a top-level **`{ username, password }` map**:

```yaml
username: "<username>"
password: "<password>"
```

One file per state means each can be **encrypted with its own KMS key** —
configure that with `.sops.yaml` `creation_rules` whose `path_regex` matches the
per-state path (more specific rules win over the repo's `\.enc\.yaml$` catch-all).

The component uses the layout two ways:

- **State list** — `fileset(environments/<env>, "*.enc.yaml")`, i.e. the
  filenames. Listing files doesn't decrypt anything, so it's non-ephemeral and
  can drive `for_each` (ephemeral values can't), with no state list duplicated in
  the stack.
- **Credentials** — a per-state **`ephemeral "sops_file"`** read, written to
  Secret Manager via **write-only arguments** (`secret_data_wo`), so the
  decrypted values never persist in Terraform state — not in a data source, not
  in the secret-version resource.

**Rotating credentials:** edit the file (`sops environments/<env>/<STATE>.enc.yaml`),
then bump `var.secret_data_version` so Terraform pushes a new Secret Manager
version (write-only args are invisible to drift detection, so the counter is how
you signal a change). The functions read `latest` and pick it up on next cold
start.

## CMEK

CMEK is **on by default** (`cmek_enabled = true`). The component:

- creates its own KMS key ring + crypto key (`<function_name>`), **regional in
  `var.region`** — Cloud Functions v2 requires a regional key in the function's
  location — with automatic rotation (`var.kms_key_rotation_period`, default 90d);
- grants `roles/cloudkms.cryptoKeyEncrypterDecrypter` on the key to the Cloud
  Functions, Cloud Run, Cloud Storage, Artifact Registry, and Cloud Build
  service agents;
- creates a CMEK-encrypted Artifact Registry repo (`<function_name>-cmek`) and
  routes the build through it (`build_config.docker_repository`);
- sets `kms_key_name` on the function (encrypts its resources + source zip).

Set `cmek_enabled = false` to deploy without CMEK. Note: KMS key rings and keys
can't be hard-deleted — `terraform destroy` removes them from state but they
persist in GCP. See https://cloud.google.com/functions/docs/securing/cmek.

## Alerting

On by default (`monitoring_enabled = true`). One **aggregated** CRITICAL alert
policy covers all the per-state checks; it fires when any check's
`uptime_check/check_passed` is false continuously for `monitoring.failure_duration`
(default `600s` ≈ 2 of the 300s runs) — sustained, so a single flaky run doesn't
page. The condition groups by `check_id`, so the incident names the failing state.

Routing (`var.monitoring`):

- **Email** → `alert_email` (default `alerts@recidiviz.org`).
- **PagerDuty** → the shared `pagerduty_forwarder_topic`
  (`projects/recidiviz-123/topics/cloud-monitoring-alerts-to-forward`); a
  subscriber there forwards to PagerDuty. The project's monitoring notification
  service agent needs `roles/pubsub.publisher` on that topic — already granted in
  `recidiviz-dashboard-{staging,production}` (typesense uses the same channel).

Tuning: `monitoring.failure_duration` (sustained-failure window),
`monitoring_enabled = false` to disable, or override `monitoring.alert_email` /
`pagerduty_forwarder_topic`.

> Synthetic monitors write `check_passed` against `resource.type="cloud_run_revision"`
> (the Cloud Run revision backing the gen2 function), **not** `uptime_url` like
> HTTP uptime checks — the condition filter pins that. If the policy never fires
> when a check is red, confirm the synthetic checks are actually producing
> `uptime_check/check_passed` time series in **Metrics Explorer** (a just-created
> or non-executing monitor emits nothing).

## Planning + deploying

```bash
nx plan   '@staff/synthetic-monitor-fn' -c staging       # build → atmos plan
nx deploy '@staff/synthetic-monitor-fn' -c staging       # build → atmos apply
nx plan   '@staff/synthetic-monitor-fn' -c production
nx deploy '@staff/synthetic-monitor-fn' -c production
```

Both targets `dependsOn` the bundle build, so `dist/apps/@staff/synthetic-monitor-fn/`
is always fresh before atmos runs. Running `atmos terraform` directly ships
whatever is currently in `dist/` and requires `NX_WORKSPACE_ROOT` to be exported.

Credentials are populated automatically from the SOPS file on apply (see
[Credentials](#credentials-sops-ephemeral--write-only)) — no manual
`gcloud secrets versions add` step.
