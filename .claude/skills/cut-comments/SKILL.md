---
name: cut-comments
description:
  Trim the comments added since the last commit down to what's actually worth
  committing — cutting development narrative, restated code, and anything already
  obvious from the code itself. Use when the user asks to cut, trim, or clean up
  comments, or before committing a change that accumulated heavy inline commentary
  while it was being written.
---

# Skill: Cut Comments

## Overview

Comments written _while developing_ and comments worth _committing_ are different artifacts. The first kind narrates the work — what changed, why it changed, what it used to be, what was tried. That's useful in the moment and noise in the repo, where the reader has the diff, the blame, and the PR.

This skill finds comments added since the last commit and cuts them to what survives that transition. Expect to remove roughly half. Removing a comment is the default outcome, not a failure.

## Step 1: Find the added comments

Default scope is uncommitted work:

```bash
git diff HEAD
```

If that's empty, the work is already committed — ask whether to widen to the whole branch (`git diff main...HEAD`) before doing anything.

From the diff, collect **added lines only** (`+`) that are comments. Cover the comment forms in this repo: `//`, `/* */`, and `/** */` in TS/TSX/JS, `#` and docstrings in Python (`apps/@reentry/backend`), `#` in YAML and Terraform.

For each one, read enough surrounding code to judge it. A comment can only be evaluated against the code it sits on.

## Step 2: Never touch these

Leaving these alone matters more than any cut you make:

- **License headers.** The GPL block at the top of every file. In a new file the entire header is an added comment — it is not a candidate.
- **Tooling directives.** `eslint-disable*`, `@ts-expect-error`, `@ts-ignore`, `prettier-ignore`, `istanbul ignore`, `biome-ignore`. These are code, not prose. Deleting one changes behavior.
- **`TODO` / `FIXME` / `HACK` carrying a ticket reference** — e.g. `TODO(OBT-1234)`. Tracked work. A bare `TODO` with no ticket is fair game to flag, but ask rather than silently deleting.
- **Anything outside the added lines.** Pre-existing comments are out of scope unless the user asks.

## Step 3: Apply the two tests

The bar for keeping a comment, in the user's words: include **what** only if it isn't abundantly clear, and **why** only if it isn't abundantly clear.

Operationally — _would a competent engineer reading this code cold, without the comment, be confused or make a wrong assumption?_ If no, delete it.

### Delete outright

- **Development narrative.** Anything about the history of the change rather than the state of the code: "previously this used X", "changed from Y", "used to be", "no longer needed because", "moved this up from below", "as of this PR", "refactored to". The diff and blame already carry this.
- **Restated code.** `// increment the counter` over `count += 1`. `// fetch the user` over `fetchUser()`. If the comment is the identifier spelled out in prose, it earns nothing.
- **Redundant JSDoc.** A `@param userId The user ID` block that adds nothing the signature doesn't already say. Keep JSDoc only where it documents something the types can't — units, invariants, throwing behavior, nullability the type doesn't capture.
- **Scaffolding.** `// --- helpers ---` banners inside a short file, `// end of function`, commented-out code.
- **Conversational filler.** "Note that", "keep in mind", "basically", "essentially", "obviously". If the sentence survives without it, the sentence probably wasn't needed either.

### Keep, but tighten

- **Non-obvious why.** External API quirks, ordering dependencies, workarounds for upstream bugs, performance reasons for an odd-looking construction, deliberate deviations from a nearby pattern.
- **Non-obvious what.** Units and formats (`ms` vs `s`, UTC vs local), the meaning of a magic number, unusual return semantics, invariants a caller must uphold.
- **Public API docs** on exported members of a shared lib (`libs/*`), where the reader is in a different project and can't see the implementation.

Tightening rules: one line if it fits. Lead with the constraint, not the story. Present tense, describing the code as it is rather than how it got there. Cut hedges.

## Step 4: Propose before applying

Show a compact verdict list — not a wall of diff:

```
apps/staff/src/core/Foo.tsx
  L42  DELETE   "// we used to compute this in the store but moved it here"
                → development narrative
  L57  TIGHTEN  "// This is needed because the API returns dates as strings
                 in some cases and numbers in others, so we normalize"
                → "// API returns dates as string | number; normalize to Date."
  L88  KEEP     "// Firestore caps `in` queries at 30 elements"

libs/shared-pathways/src/bar.ts
  L15  DELETE   "// loop through the metrics"
                → restates the code
```

Report the count: `18 added comments → 7 kept, 4 tightened, 7 deleted`.

Wait for confirmation. The user may want individual calls reversed — this is their voice going into the repo, and the judgment calls are genuinely arguable.

## Step 5: Apply and verify

After editing, confirm that **only comment lines changed**:

```bash
git diff --stat
git diff -U0 | grep -E '^[+-]' | grep -vE '^(\+\+\+|---)'
```

Every line in that output must be a comment or blank. If a line of real code appears, you deleted something you shouldn't have — restore it before reporting done.

Then report the final count and let the user re-read the result.

## Important Notes

- **Deleting is the default.** A comment has to earn its place. When genuinely torn between keeping and cutting, cut — it's cheaper to re-add one comment than to re-read a hundred.
- **Never invent new comments.** This skill only removes and shortens. If code is confusing and undocumented, say so separately rather than writing fresh commentary.
- **Don't touch the code itself.** Not even to rename something that would let a comment go away. Suggest it, but that's a different change.
- **Prettier will not do this for you.** It preserves comment text verbatim and never rewraps prose, so a "tightened" comment has to actually be rewritten — the formatter contributes nothing here.
- **A comment-only diff is not automatically a safe diff.** Tests and typecheck are unaffected by prose, but deleting an `eslint-disable` or `@ts-expect-error` breaks lint or typecheck immediately. That's the whole reason for Step 2. Run the change through the normal checks before committing.
