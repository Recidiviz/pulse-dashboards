# @staff/synthetic-monitor-fn

[GCP Cloud Monitoring **Synthetic Monitor**](https://docs.cloud.google.com/monitoring/uptime-checks/introduction) that signs in to the deployed staff
dashboard through Auth0 with Playwright and asserts the authenticated app shell
loads. Source for the function deployed by the
[`apps/staff-synthetic-monitor`](../../../libs/atmos/components/terraform/apps/staff-synthetic-monitor/)
Terraform component.

## How it works

GCP Synthetic Monitors run as **2nd-gen Cloud Functions (Node.js)**. The uptime
check invokes this function on a schedule via `synthetic_monitor →
cloud_function_v2`. The function:

1. Launches a serverless-friendly headless Chromium — [`@sparticuz/chromium`](https://github.com/Sparticuz/chromium)
   driven by `playwright-core`.
2. Navigates to `STAFF_APP_URL`, which redirects to Auth0 universal login.
3. Drives the identifier-first flow (email → continue → password → continue),
   reusing the selectors from the staff app's cucumber login page object.
4. Waits for the state's assertion selector (`assertionForState(STATE_CODE)`) — sign-in succeeded.
5. Runs the state's **verification** (`verificationForState(STATE_CODE)`). The
   default (`src/workflows.ts`) opens Workflows, clicks the Clients **or**
   Residents tab, selects the first caseload-search option, and asserts the
   caseload renders per-person profile links (`a[href^="/workflows/clients/"]`
   or `…/residents/`).

### One bundle, deployed per state

The same bundle is deployed once per state (Terraform `for_each`). Each instance
gets `STATE_CODE` plus its own mounted credentials, so it signs in as that
state's test user. **Per-state customization** is data-driven and keyed by
`STATE_CODE`:

- `src/assertions.ts` (`STATE_ASSERTIONS`) — the post-login "signed-in" selector.
- `src/verifications.ts` (`STATE_VERIFICATIONS`) — the verification flow run after sign-in.
  Default is the Workflows caseload check; add an entry to override or extend it
  for a state (compose with the exported `verifyWorkflowsCaseload`, or write a
  bespoke flow). A verification throws to fail the check.

The sign-in flow itself is identical across states.

`runSyntheticHandler` (`src/handler.ts`) wraps the body and serializes the
`SyntheticResult` the monitor expects; the function is exported as
the named `SyntheticFunction` to match the TF resource's
`entry_point = "SyntheticFunction"` (no functions-framework registration needed).

> ⚠️ **Version-lock:** `@sparticuz/chromium` and `playwright-core` must
> agree on the Chromium revision. We pin `@sparticuz/chromium@131.0.1`
> (Chromium 131) with `playwright-core@1.49.1` (also Chromium 131). When bumping
> either, bump both to a matching Chromium major — see `runtime/package.json`.

## Targets

```bash
nx typecheck '@staff/synthetic-monitor-fn'
nx test      '@staff/synthetic-monitor-fn' -- --run
nx lint      '@staff/synthetic-monitor-fn'
nx build     '@staff/synthetic-monitor-fn'                       # esbuild bundle → dist/
nx smoke     '@staff/synthetic-monitor-fn' -c <staging|production> -- --state US_MI  # build → run one request
nx plan      '@staff/synthetic-monitor-fn' -c <staging|production>   # build → atmos plan
nx deploy    '@staff/synthetic-monitor-fn' -c <staging|production>   # build → atmos apply
```

`smoke`, `plan`, and `deploy` `dependsOn` the build, so
`dist/apps/@staff/synthetic-monitor-fn/` is always fresh first.

## Local smoke test

`nx smoke` runs the whole flow: it decrypts the env SOPS file for
that state's credentials, launches the functions-framework server,
issues a single request, pretty-prints the `SyntheticResult`,
prints a colored **PASS**/**FAIL** summary, and stops the
server (exiting non-zero if the result wasn't ok). Omit `--state` to **sweep every state**.

The sweep runs states **in parallel** — at most `--concurrency` browsers at a
time (default 4). Each run gets its own port and its server logs are prefixed
with the state code so the interleaved output stays readable.

```bash
nx smoke '@staff/synthetic-monitor-fn'                          # all staging states (4 at a time)
nx smoke '@staff/synthetic-monitor-fn' -- --concurrency 8       # sweep, 8 states at a time
nx smoke '@staff/synthetic-monitor-fn' -- --state US_MI         # one staging state
nx smoke '@staff/synthetic-monitor-fn' -c production -- --state US_MI
nx smoke '@staff/synthetic-monitor-fn' -c production            # all production states
nx smoke '@staff/synthetic-monitor-fn' -- --help                # every option
```

Locally the function launches your **system Google Chrome** (`channel: "chrome"`);
it is not run with a UI for easy viewing.

## Credentials

Per-state test users (and which states to monitor) are configured in the TF
component, not here. Credentials live in one SOPS file per state per environment
(`environments/<env>/<STATE_CODE>.enc.yaml`, a `{ username, password }` map — one
file per state so each can use its own KMS key). See the
[component README](../../../libs/atmos/components/terraform/apps/staff-synthetic-monitor/README.md#credentials-sops-ephemeral--write-only).

To provision the matching Auth0 users, run the provisioning script against the
same SOPS env directory. It talks to the Auth0 Management API directly: each
state's user is created if missing, or updated in place (profile **and**
password, so a password rotated in SOPS takes effect on the next run). Users are
Recidiviz-internal, scoped per state via `allowedStates`, with
`email_verified: true` so they can sign in immediately.

```bash
nx run @staff/synthetic-monitor-fn:provision-auth0-users -c staging   # or -c production
nx run @staff/synthetic-monitor-fn:provision-auth0-users -c staging -- --dry-run
```

Auth: the tenant domain and Machine-to-Machine credentials come from the
[`auth0-staff`](../../../libs/atmos/components/terraform/auth0-staff/) component's
SOPS credentials file (`secrets/<tenant>-auth0-credentials.enc.yaml`, the same
file its Terraform provider uses) — the nx configuration selects the matching
tenant's file (staging → `recidiviz-dev`, production → `recidiviz`; only the
staging file exists so far). The M2M application must be authorized for the
Management API with scopes `read:users`, `create:users`, `update:users`.
`--dry-run` reports would-create/would-update per state without writing
(only needs `read:users`).

## Layout

```
src/
  index.ts       # Cloud Function entry — exports SyntheticFunction
  handler.ts     # runSyntheticHandler: times the run, serves the SyntheticResult JSON
  config.ts      # env parsing/validation (STAFF_APP_URL / STATE_CODE / STAFF_TEST_USER / STAFF_TEST_PASSWORD)
  login.ts       # selectors + signIn(page, config, assertion): the Auth0 flow + assertion
  assertions.ts  # per-state post-login selector (STATE_ASSERTIONS keyed by STATE_CODE)
  verifications.ts # per-state verification (STATE_VERIFICATIONS keyed by STATE_CODE) + default
  workflows.ts   # default verification: Workflows caseload check (clients/residents + profile links)
  browser.ts     # env-aware Chromium launch
  log.ts         # VERBOSE-gated step breadcrumbs (→ Cloud Logging)
scripts/
  smoke.mts                 # nx smoke: decrypt creds, run the server once for a state
  provision-auth0-users.mts # create/update the Auth0 users from the env SOPS files (Management API)
runtime/
  package.json   # slim deploy manifest; CFv2 buildpack npm-installs these server-side
```

## Env vars (set by Terraform at deploy time)

| Var                   | Source               | Purpose                                        |
| --------------------- | -------------------- | ---------------------------------------------- |
| `STAFF_APP_URL`       | plain env var        | Deployed dashboard URL to sign in to           |
| `STATE_CODE`          | plain env var        | State this instance monitors (e.g. US_IA)      |
| `STAFF_TEST_USER`     | Secret Manager mount | This state's Auth0 test-user email             |
| `STAFF_TEST_PASSWORD` | Secret Manager mount | This state's Auth0 test-user password          |
| `VERBOSE`             | plain env var        | `true` → log step breadcrumbs to Cloud Logging |
