# Evaluation and Manual Testing Tools

This directory contains tools for evaluating and manually testing various parts of the reentry application, including action plan generation, intake conversations, and summary generation.

## Overview

This folder provides several CLI tools for:
- **Automated Evaluation**: Run complete intake conversations with AI-simulated clients
- **Summary Testing**: Test intake summary generation with fake data
- **Action Plan Evaluation**: Evaluate AI-generated action plans using LangSmith with quality metrics

## Setup for Evaluation Only

If you only want to run evaluations (without setting up the full backend), follow these minimal setup steps:

### 1. Install System Dependencies

**macOS:**
```bash
brew install cairo pango glib gobject-introspection gdk-pixbuf uv
```

**Ubuntu/Debian:**
```bash
sudo apt-get install -y libcairo2-dev libpango1.0-dev libglib2.0-dev gobject-introspection libgirepository1.0-dev libgdk-pixbuf2.0-dev
```

### 2. Install Python Dependencies

Navigate to the backend directory and install dependencies:
```bash
cd apps/@reentry/backend
uv sync
```

### 3. Configure Environment Variables

Create a `.env` file in `apps/@reentry/backend/` with the following minimal configuration:

```bash
# LLM Provider API Keys (you need at least one)
RECIDIVIZ_OPENAI_API_KEY=your_openai_key_here
# OR
RECIDIVIZ_ANTHROPIC_API_KEY=your_anthropic_key_here
# OR
RECIDIVIZ_GOOGLE_GENAI_API_KEY=your_google_gemini_key_here

# LangSmith Configuration (required for evaluations)
RECIDIVIZ_LANGCHAIN_API_KEY=your_langsmith_key_here
RECIDIVIZ_LANGCHAIN_ENDPOINT=https://api.smith.langchain.com
RECIDIVIZ_LANGCHAIN_PROJECT=reentry-evaluations

# Required fields (use dummy values for evaluation-only setup)
RECIDIVIZ_FABRK_BEARER_TOKEN=dummy_token
RECIDIVIZ_AUTH0_AUDIENCE=dummy_audience
RECIDIVIZ_AUTH0_CLIENT_ID=dummy_client_id
RECIDIVIZ_AUTH0_DOMAIN=dummy_domain.auth0.com
RECIDIVIZ_JWT_ALGORITHM=HS256
RECIDIVIZ_JWT_SECRET_KEY=dummy_secret_key
RECIDIVIZ_GCS_BUCKET_NAME=dummy_bucket
RECIDIVIZ_DEEPGRAM_API_KEY=dummy_deepgram_key
```

**Note:** You do **not** need:
- Database configuration (no PostgreSQL required)
- Redis configuration
- GCP service account credentials
- Full backend setup

### 4. Verify Setup

Test that your environment is configured correctly:

```bash
# Test summary evaluation (uses default data)
uv run python -m app.manage evaluate-summary summary-default-v0.yaml

# Test action plan evaluation (requires LangSmith)
uv run python -m app.manage evaluate
```

If these commands run without errors, you're ready to use the evaluation tools!

## Command Line Testing Tools

All commands should be run from the `backend` directory.


### Interactive Conversation Testing

Test intake conversations interactively by typing client responses yourself:

```bash
# Test with a specific assessment config file
uv run python -m app.manage test-conversation UT-CCCI-v0.yaml
```

This allows you to manually test the conversation flow and see how the system responds to different inputs.

### Automated Conversation Evaluation

Run complete intake conversations with AI-simulated clients and get quality evaluations:

```bash
# Test with a specific assessment config file
uv run python -m app.manage headless-conversation-eval UT-CCCI-v0.yaml
```

This evaluates conversation quality including tone, repetition, section coverage, and flow. Results are saved to `experiments/headless_evaluations/`.

### Summary Generation Testing

Test intake summary generation with fake conversation and assessment data:

```bash
# With default data (recommended for quick testing)
uv run python -m app.manage evaluate-summary summary-default-v0.yaml

# With custom conversation and assessment JSON files
uv run python -m app.manage evaluate-summary summary-CCCI-v0.yaml \
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
