# Golden Dataset

Test scripts and ground-truth extractions for the meetings extraction pipeline.

- `scripts/` — `*.txt` transcripts (53 files) used as input to the pipeline.
- `truth/` — `*_truth.json` ground-truth extractions paired 1:1 with scripts.
- `bias-pairs/` — Matched-pair scripts + truth files + `bias_pairs_manifest.json`
  for fairness eval (currently not run by the regression suite).
- `scenarios.json` — Slim metadata (character + episode + bucket) for each script.

## Filename convention

Scripts are named `<character_or_actor>_ep<N>[_LONG]_<Bucket>.txt`. The bucket
is the trailing token after the last episode index — e.g.
`chloe_deane_ep1_IdealControl.txt` is the `IdealControl` bucket. `LONG_`
indicates a long-form variant.

## Truth file shape

```json
{
  "action_items":          [{ "assignee", "task", "deadline", "context" }],
  "critical_updates":      [{ "category", "update_type", "details", "is_critical" }],
  "entities":              [{ "type", "value" }],
  "acceptable_action_items":     [...],
  "acceptable_critical_updates": [...],
  "next_episode_context": "..."
}
```

`acceptable_*` items are valid extractions that should not count as false
positives if produced, but are not required (won't count as false negatives
if missed).

## Updating

Scripts and truth files are generated in the sidecar `cdot-mm-eval-dataset`
repo. Re-sync after generation with the `sync-to-monorepo.sh` script there.
