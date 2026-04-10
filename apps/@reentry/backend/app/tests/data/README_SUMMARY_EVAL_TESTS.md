# Summary Evaluator Test Data

This directory contains test data for the LLM-as-judge summary evaluators in
`app/manage/evaluate/summary_evals.py`.

## Test Files

### `empty_intake_good_summary.json`

An intake where the client declined to provide information, paired with a
**correct, grounded summary**.

- **Expected grounding result**: PASS (binary_score = 1)
  - Correct facts: ["The client declined to provide information"]
  - Hallucinations: []
- **Expected coverage result**: PASS (score >= 7)
  - The summary accurately captures everything that was shared

### `empty_intake_hallucinated_summary.json`

The same empty intake, paired with a **hallucinated summary** that fabricates
many details the client never mentioned.

- **Expected grounding result**: FAIL (binary_score = 0)
  - Hallucinated facts should include: age ("35-year-old"), gender ("male"),
    "history of substance abuse", "three children", employment/housing needs,
    "sober for 6 months", family reconnection motivation
- **Expected coverage result**: FAIL (score <= 3)
  - The summary doesn't cover what actually happened (client declined to share)

## How to Run

```bash
# Test a good summary
uv run python -m app.manage evaluate-summary \
  --summary-file app/tests/data/empty_intake_good_summary.json

# Test a hallucinated summary
uv run python -m app.manage evaluate-summary \
  --summary-file app/tests/data/empty_intake_hallucinated_summary.json

# Run unit tests (mocked, no LLM calls)
pytest app/tests/test_summary_evals.py -v
```

## Evaluator Behavior

### Grounding Check (`grounding_check`)

Categorizes every fact in the summary into one of three buckets:

| Category                   | Definition                                             | Example                                                     |
| -------------------------- | ------------------------------------------------------ | ----------------------------------------------------------- |
| **Correct Facts**          | Directly from intake, or accurate absence observations | "finished high school", "no employment history mentioned"   |
| **Interpretive Additions** | Professional inferences and recommendations            | "likely needs employment assistance", "at risk of relapse"  |
| **Hallucinated Facts**     | Fabricated details not in intake                       | "35-year-old male", "has 3 children" when number not stated |

**Scoring**: 1 (PASS) if no hallucinations; 0 (FAIL) if any hallucinations present.
Interpretive additions are allowed and do not cause a failure.

### Coverage Check (`coverage_check`)

Scores completeness on a 1-10 scale:

| Score | Meaning                           |
| ----- | --------------------------------- |
| 10    | All important details included    |
| 7-9   | Most details included, minor gaps |
| 4-6   | Some important details missing    |
| 1-3   | Many important details missing    |

**Passing threshold**: score >= 7.

## Adding New Test Cases

Add JSON files to this directory with the structure:

```json
{
  "description": "Human-readable description of what this tests",
  "conversation": [
    { "role": "assistant", "content": "..." },
    { "role": "user", "content": "..." }
  ],
  "expected_summary": "The summary text to evaluate"
}
```

Then run:

```bash
uv run python -m app.manage evaluate-summary --summary-file app/tests/data/<your-file>.json
```
