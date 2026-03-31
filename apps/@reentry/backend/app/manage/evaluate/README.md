# Evaluation and Manual Testing Tools

This directory contains tools for evaluating and manually testing various parts of the reentry application, including action plan generation, intake conversations, and summary generation.

## Overview

This folder provides several CLI tools for:

- **Automated Evaluation**: Run complete intake conversations with AI-simulated clients
- **Summary Testing**: Test intake summary generation with fake data
- **Action Plan Evaluation**: Evaluate AI-generated action plans using LangSmith with quality metrics

## Command Line Testing Tools

All commands should be run from the `backend` directory.

> **Note:** Config YAML files are now managed via the **Config Management UI**.
> To use these testing tools, first export a config from the UI, then provide the exported YAML file.

### Interactive Conversation Testing

Test intake conversations interactively by typing client responses yourself:

```bash
# First, export a config from the Config Management UI
# Then test with the exported YAML file
uv run python -m app.manage test-conversation exported-config.yaml
```

This allows you to manually test the conversation flow and see how the system responds to different inputs.

### Automated Conversation Evaluation

Run complete intake conversations with AI-simulated clients and get quality evaluations:

```bash
# First, export a config from the Config Management UI
# Then test with the exported YAML file
uv run python -m app.manage headless-conversation-eval exported-config.yaml
```

This evaluates conversation quality including tone, repetition, section coverage, and flow. Results are saved to `experiments/headless_evaluations/`.

### Summary Generation Testing

Test intake summary generation with fake conversation and assessment data:

```bash
# First, export an output config from the Config Management UI
# Then test with the exported YAML file
uv run python -m app.manage evaluate-summary exported-summary-config.yaml

# With custom conversation and assessment JSON files
uv run python -m app.manage evaluate-summary exported-config.yaml \
  --conversation-file path/to/conversation.json \
  --assessment-file path/to/assessment.json
```

This generates both an assessment summary and client summary using the specified output config.

## Action Plan Generation Evaluation

The evaluation pipeline tests the action plan generation process using LangSmith by:

1. Loading evaluation examples (client intake data, summaries, assessments)
2. Generating action plans using the `LLMAgentGenerate` pipeline
3. Evaluating the generated plans against quality metrics (tone, clarity, actionability, etc.)
4. Storing results in LangSmith for analysis and comparison

### Prerequisites

- **LangSmith API Key**: Set `LANGCHAIN_API_KEY` in your `.env` file
- **LangSmith Endpoint**: Set `LANGCHAIN_ENDPOINT` in your `.env` file (usually `https://api.smith.langchain.com`)

### Usage

From the `backend` directory, run:

```bash
uv run python -m app.manage evaluate
```

This will launch an interactive prompt with three options:

### Evaluation Modes

#### 1. Default Mode

Uses a predefined dataset for quick testing. **Important**: The first time you run this, the `plan-generation-dev` dataset won't exist yet, so you'll need to create it first using "New" mode.

```
Your choice: Default
```

This loads examples from the `plan-generation-dev` dataset in LangSmith.

#### 2. Existing Mode

Select from available datasets in your LangSmith account:

```
Your choice: Existing
```

You'll be prompted to:

- Select a dataset from the list
- Enter an experiment prefix (optional but recommended) to identify this evaluation run

**Experiment Prefix**: A short descriptor of what you're testing (e.g., "gpt4-turbo-test", "new-prompt-v2"). This helps differentiate evaluation runs when comparing results in LangSmith.

#### 3. New Mode

Create a new dataset from a folder of JSON files:

```
Your choice: New
```

You'll be prompted for:

- **Path**: Directory containing evaluation example JSON files (e.g., `data/examples/default_eval`)
- **Dataset Name**: Unique name for this dataset (e.g., `plan-generation-dev`)
- **Experiment Prefix**: Optional descriptor for this evaluation run

## Evaluation Example Format

Each JSON file should contain:

```json
{
  "client_id": "unique_identifier",
  "messages": [
    {
      "id": "msg-001",
      "role": "assistant",
      "content": "Message content...",
      "createdAt": "2025-01-15T10:00:00Z"
    }
  ],
  "summary": "Client intake summary in markdown format...",
  "address": "An address that can be geocoded, can be a city",
  "assessment_summary": "Optional risk assessment summary...",
  "decision_tree_statements": "Optional decision tree recommendations...",
  "previous_sections": null
}
```

### Required Fields

- `client_id` (string): Unique identifier for the client
- `messages` (list[dict]): Array of intake conversation messages
- `summary` (string): Client intake summary text
- `client_extracted_info` (object): Location and transportation info for resource matching

### Optional Fields

- `assessment_summary` (string): Risk assessment summary
- `decision_tree_statements` (string): Decision tree recommendations
- `previous_sections` (list[string]): For testing regeneration scenarios

## Example Datasets

Sample evaluation examples are provided in:

```
backend/data/examples/default_eval/
```

These include diverse scenarios:

- Young adult with housing and employment needs
- Client with substance abuse and mental health challenges
- Client with education and transportation barriers
- Parent with family reunification and legal needs
- Client with critical health and financial issues

## Creating Your Own Dataset

### Step 1: Create Example Files

Create a directory with JSON files following the format above:

```bash
mkdir -p data/examples/my_evaluation
```

Add your example JSON files to this directory.

### Step 2: Upload to LangSmith

Run the evaluation command and choose "New":

```bash
uv run python -m app.manage evaluate
```

- Choose: `New`
- Enter path: `data/examples/my_evaluation`
- Enter dataset name: `my-evaluation-dataset`
- Enter experiment prefix: `initial-test`

The tool will:

1. Validate all JSON files against the `EvaluationExample` schema
2. Create a dataset in LangSmith
3. Upload all examples to the dataset
4. Run the evaluation using those examples

### Step 3: View Results

Results are saved in two places:

1. **LangSmith Dashboard**: View detailed results at `https://smith.langchain.com`

   - Compare experiments side-by-side
   - Drill into individual examples
   - Track evaluation metrics over time

2. **Local Files**: Results are saved as pickle files in the data directory (next to examples):
   ```
   backend/data/results/{dataset_name}/
   ```

## Evaluation Metrics

The evaluation uses the following metrics (defined in `markdown_evals.py`):

- **addressed_to_client**: Checks if the plan uses "you" language
- **clarity**: Evaluates if the plan is clear and understandable
- **actionable**: Checks if recommendations are specific and actionable
- **structure**: Evaluates proper markdown structure and formatting
- **tone**: Assesses supportive and non-judgmental tone
- **timeline**: Checks for realistic and concrete timelines
- **no_judgments**: Ensures no judgmental or stigmatizing language

## Troubleshooting

### "No dataset found"

If running "Default" mode for the first time, create the dataset using "New" mode with the provided examples in `data/examples/default_eval/`.

### Validation errors

Check that your JSON files match the required schema. Common issues:

- `messages` must be an array of objects, not a single object
- `client_extracted_info` must include all required location fields
- All required fields must be present

### LangSmith API errors

- Verify `LANGCHAIN_API_KEY` is set correctly in `.env`
- Check that `LANGCHAIN_ENDPOINT` points to the correct URL
- Ensure you have network access to the LangSmith API

## Related Documentation

- [Backend README](../../README.md) - Main backend documentation
- [Parent README](../../../README.md) - Overall project setup
- [Data Config README](../../../core/data_config/README.md) - Assessment and output configuration system
- [LangSmith Documentation](https://docs.smith.langchain.com/) - LangSmith evaluation platform
