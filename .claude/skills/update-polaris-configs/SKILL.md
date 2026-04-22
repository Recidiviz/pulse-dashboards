---
name: update-polaris-configs
description: Update Workflows and Insights opportunity configuration fixtures
disable-model-invocation: true
---

# Skill: Update Polaris Configs

## Overview

This skill automates updating Workflows and Insights configuration fixtures
from downloaded zip files and creates PRs with the changes.

## Instructions

### Step 1: Get GitHub Username

```bash
GITHUB_USERNAME=$(gh api user --jq '.login')
```

### Step 2: Create a New Branch

Ensure you are on `main` and up to date, then create a new branch:

```bash
git checkout main && git pull
git checkout -b $GITHUB_USERNAME/workflows-insights-configs
```

### Step 3: Unzip Configs

Check that `~/Downloads/workflows_configs.zip` and `~/Downloads/insights_configs.zip`
and that they were both downloaded in the last 24 hours. If not, prompt the user to open
their staging dashboard profile at "https://dashboard-staging.recidiviz.org/profile" and
download the files.

Then unzip them:

```bash
unzip ~/Downloads/workflows_configs.zip -d ./apps/staff/tools/fixtures/opportunities
unzip ~/Downloads/insights_configs.zip -d ./libs/datatypes/src/config/InsightsConfig/fixtures
```

### Step 4: Commit Changes

Use the `commit` skill to commit all changes. Suggest the commit message:

```
[Workflows][Insights] Update Workflows and Insights configuration fixtures
```

### Step 5: Create a PR

Use the `create-pr` skill to create a PR with the changes. Skip step 6 and 9
completely. For step 8, use the PR description "Updating Workflows and Insights configs
as per oncall responsibility.
