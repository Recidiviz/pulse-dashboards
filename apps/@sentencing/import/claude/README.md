# Claude Commands for Sentencing Data Import Debugging

This directory contains Claude Code slash commands to help debug the sentencing data import Cloud Run job.

## Setup

To use these commands, copy them to your local Claude configuration directory:

```bash
# Copy the command file to your Claude commands directory at the Recidiviz root
mkdir -p .claude/commands
cp check-import-logs.md .claude/commands/
```

## Available Commands

### `/check-import-logs`

Checks the Cloud Run job logs for the sentencing-data-import job and provides a summary of:
- Most recent execution status
- Any errors or failures
- Successfully imported files
- Error details (if applicable)

**Date Range Logic:**
- **Monday:** Fetches logs from Saturday, Sunday, and Monday
- **Other weekdays:** Fetches logs from today only

**Usage:**
```
/check-import-logs
```

## Prerequisites

**gcloud CLI:** You must be authenticated with gcloud and have access to the project:
```bash
gcloud auth login
gcloud config set project recidiviz-dashboard-staging
```

## How It Works

The command uses the gcloud CLI to fetch logs from Google Cloud Logging for the `sentencing-data-import` Cloud Run job and analyzes them to provide actionable insights.

## Future Enhancements

This is part of a larger AI-powered debugging assistant that will:
- Analyze BigQuery source data changes
- Suggest Postgres queries for investigation
- Explain error root causes
- Suggest who to contact in Slack for help

## Contributing

To add more commands, create a new `.md` file in this directory with the command instructions and update this README.
