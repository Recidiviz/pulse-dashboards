---
name: pass-ci
description: Run affected tests, typecheck, and lint (with autofix) to catch CI failures locally before pushing. Use when CI is failing or before pushing to avoid CI failures. Offers to fix typecheck/test failures and to amend+push when clean.
---

# Skill: Pass CI

## Overview

Runs the same checks as CI scoped to projects affected relative to `origin/main`. Order: tests → typecheck → Prettier fix → ESLint fix → lint check. Linting runs last so autofix covers any code changes made during the fix cycle. Offers to fix typecheck and test failures, then optionally amends the last commit and force-pushes when everything is clean.

## Instructions

### Step 1: Record pre-existing staged changes

Before touching anything, capture whether the user has staged changes:

```bash
git diff --cached --name-only
```

Save this output. If it is non-empty, the user has staged changes — skip the amend/push offer at the end and warn them.

Also capture the current branch:

```bash
git rev-parse --abbrev-ref HEAD
```

### Step 2: Run affected tests

```bash
yarn nx affected -t test --base=origin/main
```

Capture the exit code and full output. Note which project(s) had failing tests.

### Step 3: Run TypeScript typecheck — CI-equivalent

```bash
yarn nx affected -t typecheck --configuration test --base=origin/main
```

Capture the exit code and full output. Note which project(s) had type errors.

### Step 4: Offer to fix test or typecheck failures

If **either** Step 2 or Step 3 had failures, ask the user:

> Tests or typecheck failed. Would you like me to try to fix the issues?

If the user says **yes**, attempt to fix the failing code:

- Read the error output carefully to identify what files and lines are failing.
- Make targeted code changes to fix the errors. Prefer minimal, surgical fixes — don't refactor surrounding code.
- Show the user a terse diff of every file you changed (just file names and what changed, no lengthy explanation):
  ```bash
  git diff --stat
  git diff
  ```
- **Always re-run both checks after making changes**, even if only one was failing originally — fixes can introduce new failures in the other:
  ```bash
  yarn nx affected -t test --base=origin/main
  yarn nx affected -t typecheck --configuration test --base=origin/main
  ```
- If both re-runs pass, proceed to linting (Step 5).
- If the re-run still has failures, report what remains and stop — do not loop endlessly. Do not proceed to linting.

If the user says **no**, stop here and report the errors. Do not proceed to linting.

### Step 5: Run Prettier autofix on affected files

```bash
yarn nx format:write --base=origin/main
```

### Step 6: Run ESLint autofix on affected projects

```bash
yarn nx affected -t lint --fix --base=origin/main
```

### Step 7: Capture autofix changes

```bash
git diff --stat
git diff --name-only
```

Note which files (if any) were changed by autofix. If none, note that.

### Step 8: Run ESLint check — CI-equivalent

```bash
yarn nx affected -t lint --max-warnings 0 --no-warn-ignored --base=origin/main
```

Capture exit code and output.

### Step 9: Display final results

Show a clean summary:

```
── CI Check Results ───────────────────────────────

  Tests          ✓ passed   (or ✗ failed)
  Typecheck      ✓ passed   (or ✗ failed)
  Lint           ✓ passed   (or ✗ failed)

  Auto-fixes applied:
    src/components/Foo.tsx   (ESLint/Prettier)
    src/utils/bar.ts         (Prettier)

───────────────────────────────────────────────────
```

If lint failed, show the raw error output. Do not truncate.

If everything passed and no auto-fixes were applied, say: "No changes needed — you're already CI-clean."

### Step 10: Offer amend and force push

Only offer if **all** of the following are true:

- The user had **no** staged changes before running (Step 1 was empty)
- Tests, typecheck, and lint all passed

Ask the user:

> Would you like to stage all changes, amend your last commit (`--no-edit`), and force-push?

If yes:

```bash
git add -A
git commit --amend --no-edit
git push --force-with-lease
```

Confirm with the resulting commit hash.

## Important Notes

- Always use `--base=origin/main` so affected detection matches CI exactly.
- `--max-warnings 0` and `--no-warn-ignored` must not be omitted from the lint check — they are what makes it match CI.
- Linting runs **after** tests and typecheck (and any fixes) so ESLint autofix covers all code changes made in this session.
- When fixing failures, keep changes minimal and surgical. Do not refactor surrounding code.
- If the user had pre-existing staged changes, warn them and skip the amend offer.
- `--force-with-lease` is safer than `--force` — it fails if someone else pushed since your last fetch.
- Never skip the lint check after autofixing — autofix can theoretically introduce new issues.
