# @meetings/eval-golden

Golden-dataset regression suite for the Meetings extraction pipeline: it runs
the real extraction agent (`SpecialistCore.runExtraction`) against a curated set
of transcripts and scores the output against hand-written ground truth, so we
catch quality regressions in the pipeline and its prompts before they ship.

This is separate from the _online_ evaluators in
`libs/@meetings/tasks/src/llm/evaluators`, which judge live production runs
without ground truth. This suite is offline: fixed inputs, known-correct
outputs, deterministic pass criteria.

## How it works

The `regression` target produces two **LangSmith experiments** (extraction
accuracy and bias parity). For each dataset example it runs the extraction
agent on the transcript, scores the predicted action items against truth with
an LLM judge (gpt-4.1), and records `pass` plus the score components as
experiment feedback. Per-example scores and comments are browsable in the
LangSmith UI; the process exit code applies the `PASS_CRITERIA` gate for CI.

Only action items are scored: every bucket's pass criteria and the bias gate
read action-item precision/recall/F1 alone, so the other extraction fields are
carried in truth for reference but never judged.

| Path                       | What                                                                              |
| -------------------------- | --------------------------------------------------------------------------------- |
| `src/experiments.ts`       | Experiment runners, evaluators, filtering, retries, majority-pass aggregation.    |
| `src/cli/regression.ts`    | Entry point for the `regression` target; prints summaries, sets the exit code.    |
| `src/llm-judge.ts`         | gpt-4.1 semantic matcher with Zod-typed structured outputs.                       |
| `src/prompts.ts`           | Judge prompt.                                                                     |
| `src/types.ts`             | `TruthFile`, `ActionItemScores`, `PASS_CRITERIA` (one entry per bucket).          |
| `src/stubs.ts`             | Minimal person/agency/transcript stubs for driving the agent.                     |
| `src/cli/mirror-prompt.ts` | One-way git → LangSmith mirror of the extraction prompt (`mirror-prompt` target). |

## The dataset

The dataset lives in LangSmith, not in the repo, and is the source of truth.
Small fixes can be made directly in the UI; LangSmith versions every
modification and experiments record the version they ran against, so edits stay
auditable and revertable.

- **`meetings-eval-golden`** (53 examples), one per transcript. `inputs` are
  `{ transcript, agencySpecificRules }` (the extraction prompt's template
  variables, so Playground runs render the real user message); `outputs` is the
  truth extraction (camelCase, matching `ExtractionOutput`, plus optional
  `acceptableActionItems`); `metadata` is `{ character, episode, bucket, long }`,
  and the example's **split** is its bucket so the UI can filter by bucket.
- **`meetings-eval-golden-bias`** (5 examples), one per matched pair. `inputs`
  are `{ transcriptA, transcriptB }`; `outputs` are
  `{ canonicalTruth, truthA, truthB }`; `metadata` carries the pair id, scenario
  label, and bias dimensions.

Each example is identified by its `<character>_ep<episode>` label, composed
from metadata (e.g. `chloe_deane_ep1`); it names entries in the flaky skip
lists and labels rows in results. New examples must carry `character` and
`episode`, and `metadata.bucket` must be a `PASS_CRITERIA` key: the runner
validates all three up front, before spending money.

`acceptableActionItems` are extractions that are valid if produced but not
required; they never count as false positives or false negatives.

## Running

The regression suite hits **real** OpenAI/LangSmith APIs (extraction is
`gpt-5-mini`, the judge is `gpt-4.1`), so it costs roughly $1-2 per full run
and is slow. It is only wired to the `regression` target, never `nx test`.

```bash
nx run @meetings/eval-golden:typecheck
nx test @meetings/eval-golden -- --run    # unit tests: fast, no API, no keys

nx run @meetings/eval-golden:regression                       # everything
BUCKET_PATTERN=IdealControl nx run @meetings/eval-golden:regression
EVAL_RUNS=3 nx run @meetings/eval-golden:regression           # flakiness mode
EVAL_SUITE=extraction nx run @meetings/eval-golden:regression
nx run @meetings/eval-golden:mirror-prompt                    # re-mirror prompt
```

| Var                                       | Default   | Effect                                                                                                                                         |
| ----------------------------------------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENAI_API_KEY`                          | —         | Required. Loaded locally from `@meetings/server`'s SOPS env via the `requires-sops-env:` target prefix.                                        |
| `LANGSMITH_API_KEY` / `LANGCHAIN_API_KEY` | —         | Required, to read the datasets and record experiments. `LANGCHAIN_API_KEY` is already in the same SOPS env for tracing; either name works.     |
| `EVAL_SUITE`                              | `all`     | `extraction`, `bias`, or `all`.                                                                                                                |
| `EVAL_RUNS`                               | `1`       | Extraction passes per example (LangSmith `numRepetitions`); `>1` gates on a **strict majority** of runs, smoothing per-example flake.          |
| `BUCKET_PATTERN`                          | _(all)_   | Regex matched against bucket names and `<character>_ep<episode>` labels; filters extraction examples only.                                     |
| `EVAL_CONCURRENCY`                        | `2`       | Concurrent extractions (`maxConcurrency`). Keep low to respect rate limits.                                                                    |
| `EVAL_ERROR_RETRIES`                      | `2`       | Extra attempts when a run **throws** (API error, malformed model output). Scored failures never retry: a low F1 is signal, not noise.          |
| `EVAL_INCLUDE_FLAKY`                      | `0` (off) | `1` also runs `KNOWN_FLAKY_FILES` / `KNOWN_FLAKY_BIAS_PAIRS` (`src/types.ts`), which sit at their thresholds and carry no signal red or green. |
| `EVAL_SUMMARY_FILE`                       | _(unset)_ | Path to write a markdown summary for CI step summaries / PR comments.                                                                          |

### Bias eval

The bias experiment runs the pipeline on both variants of each matched pair
(same scenario, different demographic signal), scores each against the pair's
canonical truth, and fails parity when the action-item F1 gap reaches
`BIAS_F1_GAP_THRESHOLD` (0.15). Pairs without an authored canonical truth are
reported as inconclusive (flagged, but they don't fail the gate). Action-item
count differences by assignee are attached as evaluator comments.

## Prompt iteration without an engineer

Because example inputs carry the extraction prompt's template variables, the
LangSmith **Playground** can render the real extraction call against golden
examples. `mirror-prompt` pushes the committed prompt to LangSmith to fork
from; the flow is: fork and edit in the Playground, run it against
`meetings-eval-golden`, compare experiments, then hand the winning text to an
engineer to commit to `libs/@meetings/tasks/src/llm/prompts.ts`. Prompts stay
source-of-truth in git; the mirror is one-way.

## CI

The [`Meetings Eval`](../../../.github/workflows/meetings-eval.yml) workflow
runs this harness with thresholds asserted via the exit code; see that workflow
for the PR / nightly / manual-dispatch triggers. The fast unit tests run in the
regular `Build and Test` workflow's `test_meetings` job (this project is tagged
`meetings`).
