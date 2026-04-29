---
name: pr-view
description: Generate a reviewer-optimized HTML diff page for a GitHub PR, then open it in the browser. Usage: /pr-view <pr-number-or-url>
context: fork
allowed-tools: Bash Read Write Glob Grep
---

# pr-view

Generate a reviewer-optimized HTML diff page for a GitHub PR, then open it in the browser.

## Steps

### 1. Gather structured context

Run the gather script (no shell shim needed — Python handles repo detection):

```bash
python3 .claude/skills/pr-view/gather.py $ARGUMENTS > /tmp/pr-$PR_NUMBER-context.json
```

Where `$PR_NUMBER` is the numeric part of `$ARGUMENTS`. The script will:

- Fetch PR metadata, diff, CI checks, commits, base chain, child PRs
- Check out the PR branch into a git worktree at `/tmp/pr-$PR_NUMBER-worktree`
- Include the worktree path in the JSON output

### 2. Read and understand the changed files

Read the context JSON to get `changedFiles` and `worktreePath`.

For each file in `changedFiles`, read it from the **worktree** (`worktreePath + "/" + filePath`), not from the current branch. This ensures new files added in the PR are available.

For each file understand:

- What the file's purpose is in the codebase
- What it imports and what it exports
- Its role relative to the other changed files

Also look at sibling files in the same directories that were **not** changed — note any that would help a reviewer understand context (e.g. a parallel implementation, a base class, a type this code depends on).

### 3. Check for test gaps

For each changed source file (non-test, non-fixture), check whether a corresponding test file exists and whether it was changed in this PR. Flag files where:

- A test file exists but was **not** changed (meaningful gap if the changed code adds new behaviour)
- No test file exists at all (note this but don't flag it unless the file contains logic)

### 4. Analyze and order the diffs

The goal is **comprehension order** — sequence the files so that each one makes sense given what the reviewer has already seen. This is a judgment call, not a mechanical dependency traversal.

Heuristics:

- A type or schema definition should come before any file that uses it — the reviewer needs to know the shape of the data before the logic makes sense
- A base class or shared abstraction should come before its specializations
- A config or registry change is easier to understand after you've seen what it's registering
- Tests and fixtures make the most sense after the implementation they exercise
- Pure housekeeping (isolated import additions, renamed variables, updated paths with no logic change) goes last regardless of structural position

If there are independent clusters that don't relate to each other conceptually, give them distinct labels.

Every file in `changedFiles` must appear in exactly one cluster. Do not omit any files.

**Ordering is the primary output.** The narrative, cluster descriptions, and file descriptions should all be focused on explaining _why files are ordered as they are_ — what each file unlocks for the reviewer, and why it must come before or after its neighbors. Do not describe what the files do; describe the reading order logic.

### 5. Write the analysis JSON

Write your analysis to `/tmp/pr-$PR_NUMBER-analysis.json` in this exact format:

```json
{
  "narrative": "A 3-6 sentence prose paragraph explaining the ordering logic for the review: why certain files come first, what each cluster unlocks for the next, and how the sequence was chosen. Focus on reading-order rationale, not on what the files do.",
  "clusters": [
    {
      "label": "Short cluster name (e.g. Tab Type Definition)",
      "description": "One sentence explaining why this cluster appears at this position in the reading order — what it establishes that later clusters depend on, or why it must follow the clusters before it.",
      "files": ["relative/path/from/repo/root.ts"],
      "fileDescriptions": {
        "relative/path/from/repo/root.ts": "One sentence explaining why this file is positioned here within the cluster — what it establishes for the files that follow it, or why it depends on the files before it."
      },
      "testGaps": [
        {
          "sourceFile": "relative/path/to/source.ts",
          "testFile": "relative/path/to/existing-but-unchanged-test.ts",
          "note": "Human-readable explanation of what's not covered."
        }
      ],
      "relevantUnchanged": [
        {
          "path": "relative/path/to/unchanged/file.ts",
          "note": "Why this file helps understand the PR (e.g. 'base class showing what super.tabTitle() returns')"
        }
      ]
    }
  ]
}
```

### 6. Generate the HTML

```bash
python3 .claude/skills/pr-view/generate.py \
  --context /tmp/pr-$PR_NUMBER-context.json \
  --analysis /tmp/pr-$PR_NUMBER-analysis.json \
  --output /tmp/pr-$PR_NUMBER.html
```

### 7. Open and clean up

```bash
open /tmp/pr-$PR_NUMBER.html
```

Then remove the worktree (the path is in the context JSON under `worktreePath`):

```bash
git worktree remove --force /tmp/pr-$PR_NUMBER-worktree
```
