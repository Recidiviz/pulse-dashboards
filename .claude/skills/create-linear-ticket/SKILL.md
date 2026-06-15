---
name: create-linear-ticket
description:
  Create a Linear ticket for the current branch on the One Big Team, auto-assigning
  the appropriate Linear project and team/product labels based on which part of the
  codebase changed. Use when the user asks to create a Linear ticket, file a Linear
  issue, or track work in Linear for changes on the current branch.
---

# Skill: Create Linear Ticket

## Overview

All Linear tickets for this repo live on the **One Big Team** workspace (identifiers `OBT-####`). This skill creates a new ticket there, and automatically picks the right **Linear project** and **team/product labels** based on which files changed (or, if no changes yet, based on context the user describes).

This skill covers CPA, Spectra, JII, and Meetings work.

Area → team/product mapping:

| Codebase area                                                                            | Team label       | Default product label                            | Typical Linear projects                                                                              |
| ---------------------------------------------------------------------------------------- | ---------------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| `apps/@cpa/`, `apps/@cpa-labeling/`, `libs/@cpa/`                                        | `Team: CPA`      | `Project: CPA`                                   | `CPA - Tech Debt`, `CPA - Internal Tools`, `CPA - Opportunities x CPA Integration`, `[CPA Launch] *` |
| `apps/@sentencing/`, `libs/@sentencing/`, `libs/sentencing-client/`                      | `Team: Spectra`  | `Project: PSI`                                   | `[US_MO] SAR Report Generation`, other PSI projects                                                  |
| `apps/jii/`, `apps/jii-functions/`, `apps/jii-proxy-server/`, `libs/@jii/`, `apps/@jii/` | `Team: JII`      | `Project: JII Facilities App`                    | `[JII] *` and state-specific JII projects                                                            |
| `apps/@jii-texting/`, `libs/@jii-texting/`                                               | `Team: JII`      | `Project: JII Texts`                             | JII Texting projects                                                                                 |
| `apps/@reentry/`, `libs/@reentry/`                                                       | `Team: CPA`      | _(varies — ask)_                                 | Reentry-specific projects                                                                            |
| `apps/case-notes-server/`, `libs/@case-notes-server/`                                    | `Team: Spectra`  | `Project: Case Note Insights`                    | Case Note Insights projects                                                                          |
| `apps/public-pathways/`, `libs/shared-pathways/`, pathways code in staff                 | `Team: Spectra`  | _(none — pathways doesn't have a product label)_ | `[US_NY] Public Pathways`                                                                            |
| `apps/staff/src/core/Workflows*`, workflow-related staff code                            | `Team: Spectra`  | `Project: Workflows`                             | State-specific workflow projects                                                                     |
| `apps/staff/src/core/Insights*`, insights-related staff code                             | `Team: Spectra`  | `Project: Insights`                              | State-specific insights projects                                                                     |
| `apps/staff/src/core/Tasks*`                                                             | `Team: Spectra`  | `Project: Tasks`                                 | `Tasks General Improvements/Maintenance`, state-specific                                             |
| `apps/@meetings/`, `libs/@meetings/`                                                     | `Team: Meetings` | `Project: Meetings`                              | `[Meetings] *`                                                                                       |

If changes span multiple areas, pick the dominant one (most changed files) and tell the user — they can override.

## Instructions

### Step 1: Determine Scope

Start by figuring out what the ticket should cover.

```bash
git branch --show-current
git status
```

Then:

- **If there are uncommitted or committed changes on a feature branch:** use the file list to classify the area. Run `git diff main...HEAD --name-only` (and `git status --porcelain` for uncommitted) to get the changed paths.
- **If on `main` with no changes, or creating a ticket for new work:** ASK the user what the ticket is about and which area it affects. Use their answer to pick the area from the table above.

### Step 2: Classify the Codebase Area

Match the changed paths (or user description) against the area table in the Overview. Rules:

1. If all/most changed files are under a single area prefix, that's the area.
2. Pathways work includes any of: `apps/public-pathways/`, `libs/shared-pathways/`, or `apps/staff/src/core/**/Pathways*` and related files.
3. Shared libs (`libs/ui/`, `libs/design-system/`, `libs/utils/`, `libs/common/`, `libs/datatypes/`) don't belong to a single team — use the downstream consumer as the signal.
4. If the branch name contains a hint (`cpa-...`, `jii-...`, `ny-pathways-...`, `meetings-...`), use it as a tiebreaker.

If you can't decide confidently, ASK the user which area applies.

### Step 3: Gather Ticket Details

Use `AskUserQuestion` to collect (skip any that are already clear from the branch/changes):

1. **Title** — aim for `[Area][STATE_CODE] Brief description` format when relevant:
   - `[CPA] Support assessment-level interstitial config`
   - `[Public Pathways][US_NY] Accessibility audit fixes`
   - `[Workflows][US_IX] Custom Tab — Full Term Discharge tool`
2. **Description** — what the ticket covers, motivation, any acceptance criteria. 1-3 short paragraphs is usually enough.
3. **Linear project** — present the "Typical Linear projects" list from the table as options, plus "None" and "Something else (specify)".
4. **Priority** — optional; default to no priority unless the user specifies.

### Step 4: Resolve the Project (if needed)

`mcp__linear__save_issue` accepts names for `team`, `labels`, and `project` — you do not need to resolve label or team IDs. Pass the label names directly (e.g. `"Team: CPA"`, `"Project: PSI"`).

The one case where you may need to disambiguate is the Linear **project** field. Project names can overlap (e.g. multiple `[US_MO] *` projects) or drift, so confirm the exact name exists before passing it:

- `mcp__linear__list_projects` with `team: "One Big Team"` and `query: "<name fragment>"`

If the exact project name from the user's choice in Step 3 matches a single result, use it verbatim. If the query returns multiple candidates, ASK the user which one. If it returns none, either the project hasn't been created yet (omit the project field) or the user gave a stale name (ask again).

### Step 5: Confirm the Draft

Before creating, show the user:

```
Team: One Big Team (OBT)
Project: <project name or "None">
Labels: <label names, comma-separated>
Title: <ticket title>
Priority: <priority or "none">

Description:
<description>

Create this ticket?
```

Wait for confirmation. Accept edits in conversation ("change the title to…", "add state label…").

### Step 6: Create the Ticket

Call `mcp__linear__save_issue` with names (the tool resolves names → IDs server-side):

```json
{
  "team": "One Big Team",
  "title": "<title>",
  "description": "<markdown description — use real newlines, not literal \\n>",
  "labels": ["Team: <area>", "Project: <product>"],
  "project": "<exact project name, or omit>",
  "priority": <1-4 or omit>
}
```

Notes:

- Always send real newlines in the description, not escaped `\n`.
- `labels` accepts names (or IDs) — pass names. Same for `team` and `project`.
- The default status (Triage) is fine unless the user asked for something else.
- Do NOT set an assignee unless the user explicitly asked.

### Step 7: Return the Ticket URL and Identifier

Show the user the ticket URL and the `OBT-####` identifier — they'll use it in branch names and PR descriptions. Follow the house convention: branch names look like `fflinstone/OBT-####-kebab-case-description`.

If the user is about to start work on this ticket, offer to `git checkout -b fflinstone/<id>-<slug>` (but only if they asked).

## Important Notes

- **Every ticket goes on One Big Team** — that's why identifiers are `OBT-####`. Do not create on the `CPA`, `Spectra (SPE)`, or `JII Squad` teams; those exist for planning but the code tickets live on OBT.
- **Team labels are how ownership is signaled** — the `Team: X` label is what makes the ticket show up in the owning squad's triage.
- **When in doubt about the project**, set the project to "None" — it's easier for the team to triage without a wrong project than to undo one.
- **Never create a ticket without confirming the draft** with the user first.
