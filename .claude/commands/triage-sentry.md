# /triage-sentry

Autonomously triage unresolved Sentry issues: verify root cause, trace to source,
find the likely introducing commit, check for an existing Linear ticket, and — only
for issues you're genuinely confident about — file the ticket, implement a fix with
a regression test, and open a draft PR. Everything else is reported as open
questions, never guessed at.

Arguments (`$ARGUMENTS`, all optional, any order):

- `projects=<slug,slug,...>` — Sentry project slugs to pull from (e.g.
  `projects=meetings-app,meetings-server`). If omitted, ask (see Step 1).
- `environment=<env>` — Sentry environment filter. If omitted, default to
  `production` only — do not ask, just confirm this default in the summary header.
- `threshold=<N>` — minimum event count in the lookback window for an issue to be
  considered. If omitted, default to `5`. State whichever value is used.
- `lookback=<24h|7d|14d|30d|90d>` — how far back to pull unresolved issues from. If
  omitted, default to `7d`. State whichever value is used.
- `dry-run` — skip Step 4 entirely. For issues that would have qualified for
  high-confidence action, report what _would_ have been created/opened instead of
  doing it. Use this for a first pass on unfamiliar backlogs.

---

## Hard rules (apply throughout, no exceptions)

- Never post a comment on GitHub or Linear as the user — not on issues, not on PRs,
  not as a reply to a bot finding. This workflow only _creates_ new tickets/PRs; it
  never comments on existing ones.
- Never mark a PR "ready for review" — every PR this command opens stays a draft.
- Never call Sentry `update_issue` to resolve, ignore, or reassign anything. Leave
  every issue's status exactly as found, even after filing a ticket or shipping a
  fix — resolve only happens once a human confirms the fix is deployed.
- Never touch production data. Sentry/Linear reads and the git worktree used for a
  fix are the only state this command touches.
- Never put a user's email, IP address, or geolocation from a Sentry event into a
  ticket, commit, or PR — `sendDefaultPii: true` means events carry real PII. Refer
  to affected users by count and category ("5 internal users"), never by identity.
- If any hard rule would require an exception to proceed, stop and ask instead of
  proceeding.

---

## Step 1: Resolve scope

1. Parse `$ARGUMENTS` for `projects=`, `environment=`, `threshold=`, `lookback=`,
   `dry-run`.
2. **Projects**: if not given, call `find_projects` for the org and ask the user
   (via `AskUserQuestion`) which of the available projects to pull from — list them
   by name, don't guess a subset.
3. **Environment**: if not given, use `production` only. Do not ask — this is the
   documented default — but say so explicitly in the run header (see Step 5).
4. **Threshold**: if not given, use `5` events in the lookback window. Say so in the
   run header.
5. **Lookback window**: if not given, use `7d`. Must be one of the values
   `search_issues` accepts (`24h`, `7d`, `14d`, `30d`, `90d`) — say whichever is
   used in the run header, and use it consistently everywhere a window matters
   (the issue pull, the per-issue event sampling, and the sub-agent prompts).
6. Resolve the Sentry org with `find_organizations` if not already known from
   context.

## Step 2: Pull the backlog

For each resolved project, run:

```
search_issues(organizationSlug=<org>, projectSlugOrId=<project>,
  query='is:unresolved environment:<environment>', period=<lookback>, sort='freq', limit=100)
```

Then filter to issues whose event count over the window is `>= threshold`. Use
`search_events` (dataset='errors', aggregation) against the same window/environment
to get an authoritative per-issue count if `search_issues`' own count looks stale or
approximate — don't trust a single number without cross-checking when it's near the
threshold boundary.

Issues below threshold are dropped silently from the detailed triage, but note the
dropped count in the summary header (e.g. "12 unresolved, 5 met the ≥5-event
threshold") — never let a silent cutoff read as "nothing else happened."

## Step 3: Parallel per-issue triage sub-agents

For **each** issue that met the threshold, spawn one sub-agent via the `Agent` tool.
Launch all of them in a single message (multiple tool_use blocks) so they run
concurrently — do not spawn them one at a time.

Each sub-agent gets a prompt built from this template (fill in the brackets):

> You are triaging one Sentry issue for a root-cause verdict. Do not implement
> anything — this is investigation only.
>
> **Issue**: `[org]/[project]` `[short ID]` — [title], first seen [firstSeen], last
> seen [lastSeen], [N] events / [M] users in the last [lookback]. URL: [issue URL].
>
> **First, a reality check — is this even a bug?** Read
> `.claude/skills/investigate-sentry-issue/SKILL.md`'s Step 2 and apply its method
> here — it's project-agnostic (see that skill's Scope section), so this applies
> regardless of which Sentry project the issue is from. Land on one of its four
> verdicts and put it in the `verdict` field: `real_bug`, `expected_behavior`,
> `third_party`, `insufficient_data`.
>
> If the verdict isn't `real_bug`, stop here: fill in `proposal` (a concrete
> `beforeSend`-filter or archive suggestion for `expected_behavior`/`third_party`, or
> — for `insufficient_data` — use the existing `telemetry_gap` field to say what's
> missing) and leave `confidence` and `suggested_fix` `null`. (a)-(d) below and the
> confidence rubric are for `real_bug` verdicts only — a non-bug doesn't need a
> git-blame or an existing-ticket search to justify skipping it.
>
> For a `real_bug` verdict, do these four things, in order, and stop as soon as one
> of them fails to produce solid evidence — a partial investigation with an honest
> "low confidence" beats a completed one with a guessed answer:
>
> **(a) Verify shared root cause.** Pull several sample events from this group
> (`get_sentry_resource` / `search_events` for this issue, not just the group
> summary — aim for at least 3-5 distinct events if that many exist). **Explicitly
> filter your sample to the run's configured `environment` (e.g.
> `environment:production`)** — an issue can match the entry-level query because
> _some_ of its events are in that environment while others aren't (that's
> intentional: a real production issue that was also reproduced on staging once
> shouldn't be excluded), but a default single-event lookup (e.g.
> `get_sentry_resource`'s "latest event") isn't guaranteed to return one from the
> right environment. Building your root-cause read on an off-environment event
> (staging noise, an E2E/headless-browser run, etc.) is exactly the kind of
> confident-but-wrong conclusion this whole triage is trying to avoid — so always
> re-query filtered by environment rather than trusting whichever event a default
> lookup happens to hand you. Compare the (environment-filtered) events' stack
> traces, messages, and tags. Confirm they are genuinely the same failure, not
> distinct errors that Sentry grouped together because they share an outer try/catch
> or a generic error message. **If the sampled events diverge in cause**, say so —
> this caps confidence at `low` regardless of what follows — and fill in
> `grouping_suggestion` with a concrete way to split them apart, either:
>
> - a code-level fix: a more specific fingerprint on the `Sentry.captureException`
>   call (or an equivalent `beforeSend` rule) that groups by the actual
>   distinguishing detail instead of the shared catch block/generic message, or
> - a Sentry-UI action: manually un-merging the issue into its constituent errors, or
>   adding a fingerprinting rule in the project's Sentry settings.
>   Name the specific distinguishing detail (an error subtype, a tag, a message
>   fragment) the fingerprint/rule should key on — don't just say "add fingerprinting."
>
> **(b) Trace the stack into this repo.** Frames usually arrive minified. Read
> `.claude/skills/investigate-sentry-issue/SKILL.md`'s Step 3 and apply its method —
> it's project-agnostic (the `component_stack`-first technique simply won't apply to
> a non-React-Native issue; the rest of the method does). Resolve to a real
> `file:line` within this checkout and read the surrounding code — never invent one
> from a minified frame. Note explicitly if the trace bottoms out with no resolvable
> app frame — check whether this project has consistent release/sourcemap mapping
> rather than assuming either way (some projects in this repo, e.g. Meetings' client,
> are known to have gaps here) — that caps confidence at `low`, since a fix location
> can't be confirmed without it.
>
> **(c) Check git history for the likely introducing commit.** Once you have a
> real file:line, use `git log -p --follow` / `git blame` / `git log -S'<snippet>'`
> on that file to find the commit that most plausibly introduced the bug. Cite the
> commit SHA and one-line summary. If several candidate commits touched the line and
> you can't tell which one actually caused it, say that rather than picking one.
>
> **If this issue's project is a Meetings one** (`meetings-app`, `meetings-server`,
> `meetings-data-import`, `meetings-seed-demo`, `meetings-artifact-cleanup`), read
> `.claude/skills/investigate-sentry-issue/SKILL.md`'s Step 5 and apply its method
> instead of a plain `git log -S` on the release string — Meetings' release tag and
> `ota_updates.runtime_version` need Expo-specific handling that doesn't apply (and
> would be actively misleading) for another product's release tag; see that skill's
> Scope section.
>
> **(d) Search Linear for an existing ticket — Sentry's own link first, then a
> broader search.** Check the Sentry issue itself for an existing Linear
> attachment/link first (`get_sentry_resource` on the issue returns its attachments;
> some issues already have one wired up via the Sentry-Linear integration) — if it
> has one, use that and skip the broader search. Only if it doesn't, fall back to
> searching Linear (team `OBT`) for a ticket whose title/description matches this
> error, using the `Team: <Area>` label for whichever codebase area the file:line
> from (b) belongs to (see the `create-linear-ticket` skill's area table — e.g.
> `Team: Meetings` for `apps/@meetings/`, `Team: Spectra` for `apps/@sentencing/`,
> etc. — don't assume it's Meetings). Return the ticket identifier if found, else
> `null` — never fabricate one.
>
> **Confidence rubric** — apply it strictly:
>
> - `high`: (a), (b), and (c) all landed on solid, specific evidence — a concrete
>   shared root cause, a real app file:line, and a defensible fix that doesn't
>   require a product/design judgment call.
> - `medium`: root cause is plausible and evidence points at a specific place, but
>   something is short of certain — e.g. only 1-2 events could be sampled, the fix
>   needs a judgment call, or the introducing commit is one of several candidates.
> - `low`: any of (a)/(b)/(c) failed to produce solid evidence, sampled events
>   diverge, the stack doesn't resolve into this repo, or the "fix" would be a guess.
>
> **When genuinely unsure between two levels, pick the lower one.** A confident
> root-cause claim that turns out wrong is worse than an honest low-confidence
> report with open questions — don't round up.
>
> **Internal consistency check before you answer:** `confidence: "high"` requires a
> concrete, non-null `suggested_fix` — if you can't state one, you don't actually
> have high confidence, so downgrade to `medium` and explain what's missing in
> `open_questions` instead of returning a hollow "high."
>
> If confidence is capped below `high`, also fill in **`telemetry_gap`**: is there
> a _specific_ piece of missing instrumentation (a tag, a breadcrumb, a captured
> variable, a log line) that — if it existed — would plausibly have resolved the
> ambiguity? Name it concretely (e.g. "no `meetingId` tag on this event, can't tell
> if all reports are the same meeting") or leave it `null` if more Sentry data
> wouldn't have helped (e.g. the real gap is sourcemaps, not telemetry).
>
> If (a) found the sampled events diverge (not a shared root cause), fill in
> **`grouping_suggestion`** as described in (a) above; otherwise leave it `null`.
>
> **Never put a user's email, IP address, or geolocation from a Sentry event into
> `evidence`, `root_cause`, or anywhere else in this structure** — refer to affected
> users by count/category only (see the hard rules).
>
> Return exactly this structure (as your final message — nothing else):
>
> ```
> {
>   "issue_id": "[short ID]",
>   "verdict": "real_bug" | "expected_behavior" | "third_party" | "insufficient_data",
>   "confidence": "high" | "medium" | "low" | null,
>   "root_cause": "<one paragraph, specific>",
>   "evidence": [
>     "<file:line> — <what's there and why it matters>",
>     "<Sentry event id/tag/timestamp> — <what it shows>",
>     "<commit sha> \"<summary>\" — <why it's the likely introducer>",
>     "... one entry per point of evidence, file:line or Sentry-data form"
>   ],
>   "open_questions": ["<only for medium/low — what's unresolved>"],
>   "suggested_fix": "<specific, or null if confidence is low or verdict isn't real_bug>",
>   "proposal": "<a beforeSend-filter or archive suggestion, for expected_behavior/third_party; null for real_bug/insufficient_data>",
>   "existing_ticket_or_null": "<OBT-#### or null>",
>   "telemetry_gap": "<specific missing instrumentation, or null>",
>   "grouping_suggestion": "<specific code or Sentry-UI fix to split diverging events, or null>"
> }
> ```

Collect all verdicts before moving to Step 4.

## Step 4: Act only on high confidence

Skip this step entirely (report-only) if `dry-run` was passed — instead write, for
each issue that would have qualified, "would create ticket / branch / PR" plus the
same detail Step 4 would otherwise produce, and skip to Step 5.

This step only ever applies to `verdict: "real_bug"` issues — `expected_behavior`,
`third_party`, and `insufficient_data` verdicts never get a ticket, fix, or PR
regardless of confidence; they're reported in Step 5's "not a bug" section instead,
with whatever `proposal`/`telemetry_gap` the sub-agent filled in.

For each `real_bug` issue with `confidence: "high"` and no `existing_ticket_or_null`:

1. **Ticket**: invoke the `create-linear-ticket` skill for a ticket describing the
   Sentry issue, its root cause, and the evidence. Determine the codebase area from
   the file:line found in Step 3(b) — same area table the skill itself uses — and
   let it pick the matching `Team: <Area>` + `Project: <Product>` labels; don't
   assume it's Meetings just because that's the common case. Title format
   `[<Area>] <brief description>`. This still shows the skill's own confirmation
   prompt — don't skip that.
2. **Worktree + fix**: spawn an `Agent` call with `isolation: "worktree"` that:
   - Creates a branch based on `origin/main` (not local HEAD) named
     `<user>/<OBT-id>-<slug>` per house convention.
   - **Before running anything else, `yarn install` in the worktree root.** A
     fresh worktree has no `node_modules` (it's gitignored, so `git worktree`
     doesn't bring it along) — skipping this makes `nx test`/`lint`/`typecheck`
     fail with confusing "Cannot find module" errors that look like a real bug
     rather than missing setup.
   - Implements the smallest fix that addresses the confirmed root cause.
   - Adds a regression test that **fails on the pre-fix code and passes after** —
     verify this explicitly (run it before applying the fix, then after).
   - Runs `nx test`/`nx lint`/`nx typecheck` for the affected project(s) **from
     the worktree root**, not a subdirectory — `nx typecheck` in particular
     resolves other projects' relative paths (e.g. the Prisma schema) against
     whatever the shell's cwd happens to be, and a stray `cd` into the app
     directory earlier in the session will break that resolution with an
     unrelated-looking error.
   - Invokes the `commit` skill with a commit message containing `Fixes <short ID>`
     (the Sentry issue's short ID) — Sentry's GitHub integration auto-resolves the
     issue once this commit merges, so tell `commit` to include that line
     explicitly. This doesn't touch the "never call `update_issue`" hard rule: no
     Sentry API call is made, and resolution still only happens once the draft PR
     clears human review and is merged — it just means that merge, rather than a
     separate manual Sentry visit, is what closes the loop.
   - Then invokes the `create-pr` skill for a **draft** PR whose description links
     both the Sentry issue URL and the `OBT-####` ticket via the PR template's
     dedicated "Resolve Sentry issue: Fixes ..." field, and includes the regression
     test's before/after output.
   - Returns the PR URL, branch name, and test results.

If an issue has `confidence: "high"` but _does_ have an `existing_ticket_or_null`,
don't file a duplicate ticket — still do the worktree/fix/PR step, linking the
existing ticket instead of a new one, but only after confirming with the user that
the existing ticket doesn't already have someone assigned/in-progress (check
`get_issue` state/assignee first; if it looks actively owned, skip the fix and just
note it in the summary).

For `real_bug` issues at `medium`/`low` confidence: take no action. They're reported
in Step 5 with their open questions.

## Step 5: Summary

Post one summary table covering **every** issue that met the threshold (not just the
acted-on ones). Lead with the run header:

```
Org: <org>  ·  Projects: <slugs>  ·  Environment: <environment> (default: production-only)
Lookback: <lookback> (default: 7d)  ·  Threshold: ≥<N> events  ·  <dry-run mode / live mode>
<T> unresolved in window, <K> met the threshold and were triaged below
```

Then the table, covering only `real_bug` verdicts (`expected_behavior`/`third_party`
go in the "Not a bug" section below instead; `insufficient_data` stays in this table
since it's still an open question about a possible bug):

| Issue                     | Verdict                      | Confidence                     | Root cause | Evidence                    | Suggested fix | Existing ticket  | Action                                                                          | Open questions   |
| ------------------------- | ---------------------------- | ------------------------------ | ---------- | --------------------------- | ------------- | ---------------- | ------------------------------------------------------------------------------- | ---------------- |
| `[short ID]` ([N] events) | real bug / insufficient data | 🔴 high / 🟡 medium / 🟢 low\* | one line   | key file:line + Sentry data | one line      | OBT-#### or none | ticket+PR links, or "would create..." (dry-run), or "none — <level> confidence" | — or the bullets |

_(pick whatever emoji/wording is clear; the point is confidence must be scannable)_

Below the table, add **"Not a bug (reported only)"** for every `expected_behavior`/
`third_party` verdict — one row or bullet per issue, with its one-line reasoning
and the sub-agent's `proposal` (a `beforeSend` filter or an archive suggestion).
**Never apply the filter, never call `update_issue` to archive, and never file a
ticket for these** — propose it and wait for the user to say go ahead, regardless
of how confident the verdict itself is.

Below that, for any issue with a non-null `telemetry_gap`: list it separately
under **"Telemetry gaps that would improve confidence"** — one bullet per issue,
naming the specific missing instrumentation. **Do not file a Linear ticket for
these** — propose it and wait for the user to say go ahead.

Below that, for any issue with a non-null `grouping_suggestion`: list it separately
under **"Grouping fixes for issues bundling distinct errors"** — one bullet per
issue, with the sub-agent's specific code-level or Sentry-UI suggestion for
splitting it apart. **Do not apply a fingerprint change, merge/unmerge anything in
Sentry, or file a ticket for these** — propose it and wait for the user to say go
ahead, same as telemetry gaps.

## Notes

- This command is meant to be re-run periodically against a live backlog, not just
  once — keep it idempotent: re-running should recognize tickets/PRs it already
  created (via the Sentry↔Linear link and the existing-ticket search in Step 3) and
  not duplicate them.
- Sub-agents in Step 3 are read-only investigation — don't give them worktree
  isolation, they don't need it and it's wasted setup cost.
- If an issue's event count is dominated by a single user/session (e.g. one person
  retrying a broken action 200 times), note that in evidence — it changes how urgent
  the "N events" number actually is, even though it doesn't change the threshold
  gate itself.
- For a full interactive dive on one row from the summary — including the archive
  outcomes this command never takes, since it never calls `update_issue` — run
  `/investigate-sentry-issue <short-ID>` directly.
