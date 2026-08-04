---
name: send-it
description:
  Run the full ship sequence for the current branch in one go — commit, pass CI,
  file the Linear ticket, open the PR — halting if checks fail. Use when the user
  says "send it", "ship it", "ship this branch", or asks to take a branch from
  working code to an open PR end to end.
---

# Skill: Send It

## Overview

Chains the four skills that always run in the same order at the end of a change:

```
commit  →  pass-ci  →  create-linear-ticket  →  create-pr
```

**Invoke each skill via the Skill tool — do not re-implement its steps here.** Those
skills own the details (commit message format, the CI-equivalent nx flags, the Linear
area→label mapping, the PR template). This skill owns only the sequencing, the
hand-offs between stages, and when to stop.

## Why this order

- **commit first** — `pass-ci` ends by offering to amend the last commit and
  force-push, which needs a commit to exist. Committing first means autofixes land
  as an amend instead of a stray second commit.
- **ticket before PR** — `create-pr` asks for related Linear issues so it can write
  `Closes OBT-####` into the description. Filing the ticket first means that field
  gets a real answer instead of "none".

## Instructions

### Step 0: Preflight

```bash
git branch --show-current
git status --short
git log --oneline main..HEAD
```

Stop immediately and tell the user if:

- **On `main`** — nothing to ship. Offer to create a branch (the `commit` skill
  handles branch creation).
- **No commits and no changes** — the branch is empty relative to `main`.

Also check whether a PR already exists for this branch:

```bash
gh pr view --json number,url,state 2>/dev/null
```

If one exists and is open, this is an **update**, not a first ship. Skip Steps 3 and 4;
run Steps 1 and 2, then report the existing PR URL and stop.

### Step 1: Commit

If `git status --short` is empty, skip — the work is already committed.

Otherwise invoke the **`commit`** skill.

When it asks whether to commit to the current branch or make a new one: the user
already chose this branch by running `/send-it`, so commit to the current branch. Do not
re-prompt.

### Step 2: Pass CI

Invoke the **`pass-ci`** skill.

**This is the halt gate.** Report its summary verbatim, then:

- **All checks pass** → continue to Step 3.
- **Failures, user agrees to fix, re-runs pass** → continue to Step 3.
- **Failures that remain unfixed, or the user declines to fix** → **stop here.** Do
  not file a ticket and do not open a PR. Say plainly which checks failed and that
  the remaining steps were skipped.

Let `pass-ci` run its own amend/force-push offer. Do not duplicate it.

### Step 3: Linear ticket

First check whether this branch already tracks a ticket — branches in this repo
commonly carry the issue number, e.g. `fflinstone/1234-feature-description`:

```bash
git branch --show-current
```

If the branch name contains a number that looks like an issue reference, or the user
mentioned a ticket earlier in the conversation, **ask before filing a new one**:

> This branch looks like it already tracks issue `<number>`. File a new Linear ticket
> anyway, or link the existing one on the PR?

If they say link the existing one, skip to Step 4 and pass the identifier through.

Otherwise invoke the **`create-linear-ticket`** skill. Carry its returned `OBT-####`
identifier into Step 4.

### Step 4: Open the PR

Invoke the **`create-pr`** skill.

Hand it the context already gathered so it doesn't ask twice:

- The Linear identifier from Step 3 — answers its "Any Linear issues to link?"
- Anything the user said about motivation while committing — answers its "What
  motivated this change?"
- The `pass-ci` result — partial input to "How did you verify this works?", though
  `create-pr` correctly wants verification _beyond_ CI, so still ask about manual
  testing if it isn't already known.

Let `create-pr` show its own draft and wait for confirmation. Never skip that.

### Step 5: Report

Close with a compact summary:

```
── Shipped ────────────────────────────────────────

  Commit     <sha> <title>
  CI         ✓ tests · ✓ typecheck · ✓ lint
  Ticket     OBT-#### <url>
  PR         #### (draft) <url>

───────────────────────────────────────────────────
```

Omit any row that was skipped, and say why it was skipped.

## Important Notes

- **Stop at the first hard failure.** A red CI check means no ticket and no PR — an
  open PR on broken code is worse than no PR.
- **Don't re-ask questions.** Each downstream skill prompts for context; pass forward
  what earlier stages already established. Being asked the same thing three times is
  the main way a chained flow feels worse than running the skills by hand.
- **This skill never squashes.** The branch keeps whatever commits it has; the repo
  squash-merges at the GitHub end.
- **The PR is created as a draft** — that's `create-pr`'s behavior, not an accident.
  Marking it ready for review stays a manual step.
- If the user wants only part of the chain, they should invoke that skill directly.
  Don't offer to run a partial `/send-it`.
