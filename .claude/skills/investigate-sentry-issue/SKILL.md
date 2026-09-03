---
name: investigate-sentry-issue
description:
  Investigate a Sentry issue from its link or short ID — establish whether it's
  actually a bug, find the root cause in the repo, and propose an action; then,
  once the user picks, either implement the fix and ship the PR, file a Linear
  ticket assigned to them, or archive the issue (until escalating, or forever).
  Use when the user pastes a Sentry issue URL, names a short ID like
  MEETINGS-APP-167, or asks to investigate, triage, fix, or archive a Sentry
  issue.
---

# Skill: Investigate Sentry Issue

## Overview

Two phases with a **hard gate** between them:

```
   INVESTIGATE (read-only)          │   ACT (only after the user picks)
   fetch → reality-check → locate   │   ├─ fix it now    → implement → send-it
   → correlate → propose            │   ├─ file a ticket → Linear, assigned
                                    │   ├─ archive       → until-escalating | forever
                                 ← STOP →   └─ nothing for now
```

Never edit code, create a branch, open a PR, or change anything in Sentry before
the user has chosen an outcome. The investigation phase touches nothing.

## Scope

Steps 1 (fetch), 2 (reality check), 3 (stack trace), and 6–9 (propose/act) are
project-agnostic — they apply to an issue from any Sentry project in this org. The
**project → code map right below, Step 4 (locate the code), and Step 5 (correlate
with a release) are Meetings/Expo-specific** and were written entirely from Meetings
issues. For an issue from another product, skip those three and locate the code and
correlate the release using that product's own conventions instead — e.g.
`@sentencing/server`'s Fastify/tRPC layout instead of Feature-Sliced Design, and
whatever that project's own release tag actually is (it may well be a plain git SHA,
unlike Meetings' `<app name>@<version>` — don't assume the SHA-lookalike trap in
Step 5 carries over).

## Inputs

A Sentry issue URL (`https://recidiviz-inc.sentry.io/issues/MEETINGS-APP-167`)
or a bare short ID (`MEETINGS-APP-167`). The org is always `recidiviz-inc`.

If given only a short ID, build the URL from it. If given neither — e.g. "look
at the Sentry board" — ask which issue; don't pick one yourself.

## Project → code map

| Sentry project              | Code                                                                                                                                                                                                        |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `meetings-app`              | [apps/@meetings/app](apps/@meetings/app) — Expo RN + web                                                                                                                                                    |
| `meetings-server`           | [apps/@meetings/server](apps/@meetings/server)                                                                                                                                                              |
| `meetings-data-import`      | [apps/@meetings/import](apps/@meetings/import)                                                                                                                                                              |
| `meetings-seed-demo`        | [apps/@meetings/seed-demo](apps/@meetings/seed-demo)                                                                                                                                                        |
| `meetings-artifact-cleanup` | [apps/@meetings/server/src/jobs/meeting-artifact-cleanup.ts](apps/@meetings/server/src/jobs/meeting-artifact-cleanup.ts) — a Cloud Run job with its own Sentry project, but it lives in the server codebase |

`meetings-app` covers **both** native and web. Check the `url` tag and the
`react_native_context` / `browser` contexts to tell which one you're looking at
— the fix location often differs (`*.native.tsx` vs `*.web.tsx`).

## Step 1: Fetch the issue

```
get_sentry_resource(url="<the issue URL>")
```

Capture: exception type and message, stacktrace frames, `release`, `environment`,
`handled`, occurrences, users impacted, first/last seen, the `url` tag, and the
`ota_updates` / `react_native_context` contexts.

If the Sentry MCP server isn't authenticated, say so and stop — the user needs to
connect it in claude.ai connector settings. Don't fall back to guessing from the
issue title.

## Step 2: Reality check — is this even a bug?

**Do this before diagnosing anything.** The most common failure mode is writing a
careful root-cause analysis of something that was never broken.

- **Read the exception message, not the issue title.** Titles are frequently just
  a minified frame name and tell you nothing. `MEETINGS-APP-167` is titled
  `Object.l`; the actual error is `NotAllowedError: Permission dismissed` — a user
  declining a browser permission prompt. Expected behavior, not a crash.
- **Check `handled`.** `handled: yes` means the app already caught it. That's a
  logged event, not necessarily an incident.
- **Check `environment` on the event itself**, not on the query you ran. A search
  filtered to production can still return an event tagged `staging`; trust the tag
  on the event.
- **Check who is affected.** If every impacted user is `@recidiviz.org`, this is
  internal dogfooding, not a user-facing incident. Weight it accordingly.
- **Check the volume against the window.** 6 events across 5 users in 5 days is
  not an outage. Say so plainly rather than implying urgency.
- **Check that the sampled events are actually one failure.** Pull a handful of
  events from the group, not just the latest one, and confirm they share a genuine
  root cause rather than being distinct errors Sentry grouped together because they
  share an outer try/catch or a generic error message. If they diverge, say so —
  it caps the verdict at **insufficient data** regardless of how solid any single
  event's evidence looks — and propose a concrete way to split them: either a
  tighter fingerprint on the `Sentry.captureException` call (or an equivalent
  `beforeSend` rule) keyed on the actual distinguishing detail, or manually
  un-merging the issue in the Sentry UI. Name the specific distinguishing detail
  (an error subtype, a tag, a message fragment) rather than just saying "add
  fingerprinting."

Land on one of four verdicts, because each leads to a different proposal:

| Verdict                        | Proposal shape                                                                       |
| ------------------------------ | ------------------------------------------------------------------------------------ |
| **Real bug**                   | A code fix                                                                           |
| **Expected behavior**          | Handle it gracefully, or filter it in `beforeSend` — plus resolve/ignore in Sentry   |
| **Third-party / not our code** | Usually ignore with a note; a fix only if we can guard against it                    |
| **Insufficient data**          | Say what's missing and what instrumentation would answer it — do not speculate a fix |

## Step 3: Get a usable stack trace

Frames arrive **minified**:

```
app:///index-1919fdab9cf2c3c186f605f8a5a13cfd.js:3441:3075 (ee)
app:///index-1919fdab9cf2c3c186f605f8a5a13cfd.js:216:1951 (Object.l)
```

That is not a source location. In order:

1. **Read `react_native_context.component_stack` first.** Minified frames are
   near-useless, but the component stack is the fastest route to the code, because
   React preserves the names of components it can resolve. Read it innermost-first
   and scan for the first name that is not a framework primitive — that's your
   entry point. In `MEETINGS-APP-16A`, most of the stack is minified (`Le`, `Ue`,
   `Fe`) or RN internals (`RCTView`, `CssInterop.View`), but `AgencyConfigScreen`
   sits in the middle of it and a single grep found the file.

   Raw HTML tag names in a native component stack (`div`, `section`, `p`) are
   themselves the diagnosis: something DOM-only is being rendered on native.
   Look at what the named ancestor imports.

2. **Work backwards from the other signal**: the exception message, the `url` tag
   (which route), breadcrumbs, and the API in play. Grep for the message string
   and the implicated API.

3. **Run Seer only if 1 and 2 don't get there.** `analyze_issue_with_seer` can
   symbolicate and propose a root cause, but it costs minutes, and the tool's own
   guidance is to use it when you can't determine the root cause unaided. When you
   do run it, treat the output as a lead and verify every claim against the repo —
   it confidently cites files that don't exist.

If frames stay minified and you couldn't get there any other way, the sourcemaps
for that release weren't uploaded. Note that as a finding — it's worth fixing on
its own.

**Never invent a `file:line` from a minified frame.** If you can't locate the code
with confidence, say the location is unconfirmed.

## Step 4: Locate the code

`apps/@meetings/app` uses Feature-Sliced Design — `src/features/<name>/`,
`src/entities/<name>/`, `src/shared/`. The `url` tag maps to a route under
`src/app/`. Platform splits use `.native.tsx` / `.web.tsx` suffixes.

Grep for the error string, the API name, and the feature implicated by the route.
Read enough surrounding code to explain the failure, not just the failing line.

## Step 5: Correlate with a release

The `release` tag looks like `Recidiviz Development@0.6.1` — an app name and
version, **not a git SHA**. To get to a commit:

```bash
git log -S '"0.6.1"' --oneline -- apps/@meetings/app/package.json apps/@meetings/app/app.config.ts
```

Then check how the code actually reached the user:

- `ota_updates.is_embedded_launch: false` / `is_using_embedded_assets: false` means
  the user was running an **OTA bundle**, which can be newer than the store build
  that the version number implies. Check what shipped:
  `gh run list --workflow=meetings-mobile-ota.yml --limit 10`
- Compare `firstSeen` against those OTA and native release timestamps. An error
  that starts minutes after a publish is a regression; one that predates it isn't.

**`ota_updates.runtime_version` is not a commit.** It is 40 hex characters and
looks exactly like a git SHA, but it's an Expo fingerprint hash — `git cat-file -t`
on it fails. Don't build a "what changed" diff on it. `update_id` is likewise an
Expo identifier, not a commit.

The reliable way to date a suspect line is `git log -S` on a symbol from the code
you located in Step 4:

```bash
git log --oneline --date=short --format="%h %ad %s" -S '<symbol>' -- <path>
```

That's what identified `MEETINGS-APP-16A` as latent rather than a regression — the
originating PR was titled "Add a /agency-config page to the **web app**", which
settled the intent question outright. Commit titles often tell you what the author
meant, which no amount of reading the current code will.

## Step 6: Present the diagnosis — then STOP

```
── Sentry MEETINGS-APP-167 ───────────────────────────

  TLDR       <2–3 plain sentences: what happens, to whom, and why>

  Verdict    <real bug | expected behavior | third-party | insufficient data>
  Blast      <N events · N users · env · handled?> · first seen <when>
  Release    <release> → <commit, if resolved> · <OTA | embedded>

  Root cause <explanation, with file:line references>

  Proposed   <the concrete change, with a short diff sketch>
  Risk       <what could this fix break?>
  Alt        <what else was considered and why not>

──────────────────────────────────────────────────────
```

Then offer the outcomes, via `AskUserQuestion`. Not everything worth diagnosing is
worth fixing this morning, and the on-call needs a way to say "real, but later" or
"real, but not now" without it turning into an open loop:

| Outcome                      | What it does                                                                        |
| ---------------------------- | ----------------------------------------------------------------------------------- |
| **Fix it now**               | Step 7 → Step 8. Implement, then ship via `send-it`.                                |
| **File a ticket for it**     | Step 7a. Linear ticket assigned to the user, Sentry issue assigned to them too.     |
| **Archive until escalating** | Step 7b. Silences it unless the volume jumps. The right default for real-but-minor. |
| **Archive forever**          | Step 7b. For expected behavior and third-party noise that will never be actioned.   |
| **Nothing for now**          | Leave it unresolved and untouched. Report and stop.                                 |

Lead with the one the verdict implies — "real bug" suggests fix-or-ticket,
"expected behavior" suggests archive forever — but let the user pick. Say which you
recommend and why in one line.

**Wait for a clear answer before writing code.** "Interesting", "makes sense", or
"yeah that's the bug" are acknowledgements, not a choice. If the reply is
ambiguous, ask again rather than guessing — but note that a plain "sure" or "go
ahead" in response to a direct "want me to fix this?" _is_ an answer; don't
re-litigate it.

If the verdict isn't "real bug", don't manufacture a code change to justify the
step. The proposal is an archive or a `beforeSend` filter.

## Step 7: Implement (only after approval)

- **Branch first** if on `main` — the `commit` skill handles branch creation, but
  don't start editing on `main`.
- **Keep the fix scoped to the root cause.** Don't refactor surrounding code, and
  don't fix unrelated things you noticed while reading. Mention those separately.
- `beforeSend` filters go in
  [apps/@meetings/app/src/app/index.tsx](apps/@meetings/app/src/app/index.tsx) —
  add a comment saying which Sentry issue the filter is for.

**Prove the test actually catches the bug.** Write the test, then revert the fix
and confirm it fails, then restore:

```bash
cp <file> /tmp/f.bak && <edit to undo the fix>
nx test @meetings/app -- <TestName>   # must FAIL here
cp /tmp/f.bak <file> && rm /tmp/f.bak
```

This is not ceremony. On `MEETINGS-APP-16A` the first test passed against both the
fixed and the broken code, because the component it asserted on was never rendered
in that harness — a green suite that proved nothing. A test written from a Sentry
issue is especially prone to this, since you usually can't reproduce the original
failure directly and are asserting on a proxy for it.

Reference the Sentry short ID in a comment above the test, so the next person
knows what it's defending.

## Step 7a: File a ticket instead

Invoke the **`create-linear-ticket`** skill. It owns the area → team/product label
mapping; don't reimplement it. Pass forward:

- **`assignee: "me"`** — the whole point of this branch is that the on-call is
  claiming it, so it lands in their queue rather than an unowned backlog.
- The Sentry link as a **`links` attachment**, so the ticket surfaces the issue
  in Linear's UI rather than burying the URL in prose.
- The diagnosis from Step 6 as the description.

Then assign the Sentry issue to the same person, so the two systems agree:

```
execute_sentry_tool(name='whoami', arguments={})   # → your numeric user ID
update_issue(issueUrl=..., assignedTo='user:<ID>',
             reason='Tracked in OBT-#### — <one line>')
```

Report the `OBT-####` identifier and URL. Do **not** also open a PR.

## Step 7b: Archive it

```
update_issue(issueUrl=...,
             status='ignored',
             ignoreMode='untilEscalating',   # or 'forever'
             reason='<why — this posts to the issue activity feed>')
```

- **`untilEscalating`** matches the Sentry UI's default "Archive" and is the right
  choice for anything real but not worth acting on now: it comes back if the volume
  jumps. Prefer it whenever you're unsure.
- **`forever`** is for expected behavior and third-party noise that will never be
  actioned. Reserve it — an issue archived forever is one nobody will look at again.

**Always pass `reason`.** It posts to the activity feed and is the only record of
why the board went quiet on this. An unexplained archive is indistinguishable from
an oversight six weeks later.

Note the API quirk: to move an already-archived issue between modes, set
`status='unresolved'` first, then archive again with the new mode.

## Step 8: Ship

Invoke the **`send-it`** skill. It chains `commit → pass-ci →
create-linear-ticket → create-pr` and owns all the details of each stage.

**Pass forward one thing it can't know:** the commit message must contain
`Fixes MEETINGS-APP-167` (the issue's short ID). Sentry auto-resolves the issue
when a commit referencing it merges — this is the whole reason the loop closes
without a manual Sentry visit. Tell the `commit` skill to include that line.

Also hand `create-pr` the Sentry issue link and the diagnosis from Step 6 — that's
the PR description already written. The repo's PR template has a dedicated
"Resolve Sentry issue: Fixes ..." field, so the convention is house style, not an
invention.

**Keep the PR clean.** If this session also produced unrelated work — skill edits,
scratch files, notes — stage only the fix. Check `git status` before invoking
`commit`, and say explicitly which paths to exclude. A bugfix PR carrying tooling
changes is harder to review and harder to revert.

Flag honestly what wasn't verified. A Sentry fix usually ships without the
reviewer being able to reproduce the original crash, so if you didn't test on a
real device or in a real browser, say so in the PR body rather than letting green
CI imply more than it proves.

## Step 9: Sentry housekeeping

A merged `Fixes <ID>` commit resolves the issue on its own, so after Step 8 there
is usually nothing to do. Steps 7a and 7b already made their own Sentry updates.

Offer `update_issue` here only for leftovers — reassigning to someone else, or
reopening something archived by mistake.

## Gotchas

- **The issue title is often a minified symbol** and actively misleading. Always
  read the exception message.
- **Never paste PII into a commit, PR, or Linear ticket.** `Sentry.init` sets
  `sendDefaultPii: true`, so events carry real user emails, IP addresses, and
  geolocation. Refer to affected users by count and category ("5 internal users"),
  never by identity.
- **`release` is not a SHA, and neither is `runtime_version`** despite looking
  exactly like one. See Step 5.
- **OTA means the version number can lie** about which code was running.
- **A passing new test may be proving nothing.** Verify it fails without the fix
  (Step 7). Component-level assertions are the usual culprit — the thing you're
  asserting on may not render in the test harness at all.
- **Not every real bug needs a fix today.** Step 6 offers ticket and archive
  outcomes for a reason; pushing every issue toward a PR is its own failure mode.
- **The environment tag on the event beats the environment filter on the query.**
- **`meetings-artifact-cleanup` is a separate Sentry project but not a separate
  codebase** — its code is in `apps/@meetings/server`.
- **Sourcemaps missing for a release is itself a finding.** Report it even when it
  isn't the bug you were asked about.
- **Don't batch.** This skill investigates one issue. If the user wants the whole
  board triaged, do them one at a time with a gate on each. That restriction is
  about this skill's own interactive gate (Steps 6–9) — the investigation method in
  Steps 1–5 is reused non-interactively by `/triage-sentry`'s per-issue sub-agents
  for exactly that whole-board case, without the `AskUserQuestion` stop.

## Related

- [send-it](../send-it/SKILL.md) — the ship chain invoked in Step 8
- [commit](../commit/SKILL.md) · [pass-ci](../pass-ci/SKILL.md) ·
  [create-linear-ticket](../create-linear-ticket/SKILL.md)
- [apps/@meetings/app/src/app/index.tsx](apps/@meetings/app/src/app/index.tsx) —
  `Sentry.init`, `beforeSend`, URL sanitization
- [apps/@meetings/app/app.config.ts](apps/@meetings/app/app.config.ts) —
  `@sentry/react-native/expo` plugin config
- [.github/workflows/meetings-mobile-ota.yml](.github/workflows/meetings-mobile-ota.yml) —
  OTA publishes, for release correlation
