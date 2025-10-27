# Sync Reentry Environment to GitHub

Uploads local files to GitHub secrets for use in CI workflows:
- `apps/@reentry/backend/.env` → `REENTRY_BACKEND_CI_ENV`
- `apps/@reentry/frontend/.env` → `REENTRY_FRONTEND_CI_ENV`
- `apps/@reentry/backend/.secrets/github-reentry-ci-service-account-key.json` → `REENTRY_GITHUB_CI_GCP_SERVICE_ACCOUNT`

## Prerequisites

```bash
# Install GitHub CLI
brew install gh

# Authenticate
gh auth login
```

## Usage

Run from anywhere in the repo:

```bash
"repo_dir"/apps/@reentry/scripts/sync-env-to-github.sh
```

## When to Run

- First-time CI setup
- After updating backend or frontend `.env` files
- After changing API keys or configuration
- After updating the GCP service account key
