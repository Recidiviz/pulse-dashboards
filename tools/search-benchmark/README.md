# search-benchmark

Puppeteer-based benchmark harness for the Workflows facility/caseload search
flow (staging dashboard). Measures search duration and JS heap usage across
repeated trials, optionally batched over a list of facilities.

## Setup

Capture an authenticated session (cookies + localStorage) once, and again
whenever trials start failing to land on an authenticated page:

```
nx run tools:search-benchmark-capture-auth
```

This opens a browser window — log in manually, then press Enter in the
terminal. Saves `auth-state.json` in this project's root (gitignored — it
contains live session credentials).

## Running a single benchmark

```
nx run tools:search-benchmark-benchmark -- --trials=5 --label=firestore --state=AZ --facility=LEWIS
```

Options (all passed after `--`):

- `--state` (required) — two-letter state code, e.g. `AZ`
- `--facility` (required) — facility/caseload search query, e.g. `LEWIS`
- `--label` — tags the run in output filenames/summaries (default: `run`)
- `--trials` — number of trials to run (default: `5`)
- `--url` — base URL to test against (default: staging dashboard)
- `--cpu-throttle` — CPU throttling multiplier, e.g. `4` for 4x slower (default: `1`, no throttling)
- `--heap-sample-interval` — heap sampling interval in ms (default: `200`)

Results are written to `results/results-<label>-<state>-<facility>-<timestamp>.json`
(gitignored).

## Running a batch

Drives the benchmark over a CSV of state/facility pairs, writing a running
summary CSV as each facility finishes:

```
nx run tools:search-benchmark-batch -- --input=fixtures/facilities.csv --trials=5 --label=firestore
```

Input CSV needs `state,facility` columns — see `fixtures/facilities.csv` for
an example. Re-running with the same `--label` skips facilities that already
completed successfully and only retries errored/incomplete rows.

Summary is written to `results/batch_summary-<label>.csv`.
