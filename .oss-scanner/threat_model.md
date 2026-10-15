# Threat model: Recidiviz/pulse-dashboards

The scanner reads this file before it starts. It covers the public mirror of Recidiviz's
product applications. The security policy is the org-wide SECURITY.md on GitHub; reports go
to security@recidiviz.org.

## What this project does and where untrusted input enters

Recidiviz builds tools for state corrections agencies. pulse-dashboards is the Nx monorepo
that holds the web and mobile applications that state staff, and in one product the people
under supervision themselves, use every day. Every record is about a real person under
supervision or in custody. Confidentiality is the primary goal, and the boundary that matters
most is the one between states: Tennessee staff must never see Idaho data. The second
boundary is between a person and their own record: a person using the JII app must never see
another person's record.

### Where the code is

- `/src` is the checkout, with `node_modules` installed from `yarn.lock` and the two Python
  backends installed into their own `.venv` directories.
- This repository is a mirror of a private repository. The mirror omits only secrets
  (`*.enc.yaml`, `.env*`, `.sops.yaml`), the GitHub workflows, and two script directories,
  so the application code here is complete. Public history is squashed, so git blame dates
  are approximate.

### Applications and their entry points

Staff dashboard (`apps/staff`, React) and its backend (`apps/staff-server`, Express):

- The frontend reads and writes Firestore directly. `apps/staff-server` mints the Firebase
  custom token in `src/server/workflows/firebaseToken.js` from the Auth0 app_metadata, and the
  rules in `libs/firestore-config/src/rules/firestore.rules` enforce `stateCode`,
  `allowedStates`, `recidivizAllowedStates`, `app`, `user_id`, and `impersonator` on every read
  and write. Those rules are the single most important file in the repository.
- Every Express route except the exempt list runs `express-jwt` against the Auth0 JWKS
  (`src/server/app.js`). Routes under `/api/:stateCode/` also run `validateStateCode` from
  `src/server/utils/validateStateCode.js`, which compares the path's state to the token's
  state and allowed states. Cron routes check the `X-Appengine-Cron` header.
  `/api/generateFileLink` accepts a multipart upload and `/file/:name` serves it back.
- Firebase Functions in `apps/staff-functions` export Firestore collections on a schedule.

JII app (`apps/jii`, React; `apps/@jii/server`, Fastify; `apps/jii-proxy-server`, nginx):

- Serves people under supervision, and people in custody on Orijin tablets. The server's
  `src/server/routes.ts` accepts Auth0 tokens with three `userType` values: `RECIDIVIZ`,
  `STATE`, and `ORIJIN`, the last carrying a `stateCode`. The tools under `src/tools`
  decode and decrypt the JWE tokens the tablet vendor issues.
- `jii-proxy-server` is an nginx reverse proxy with fixed upstreams (Firestore, Identity
  Toolkit, Segment) so tablets on a restricted network can reach them.

tRPC services behind Fastify, all built with `libs/common/server-setup-plugin`, which
verifies Auth0 tokens with `@fastify/jwt` against the JWKS:

- `apps/@sentencing/server`. `libs/@sentencing/trpc/src/context.ts` picks the Prisma client
  from a state code request header and then checks it against the token's state. The header
  and the token must agree; a mismatch is the boundary to test.
- `apps/@modules/server` and `apps/case-notes-server`.

Fastify services that also accept Google ID tokens from Cloud Scheduler or Cloud Tasks:

- `apps/@jii-texting/server`. Sends texts to people under supervision through Twilio and
  receives Twilio webhooks in `src/server/webhooks.ts`, validated with the Twilio auth token.
  The processor scripts in `apps/@jii-texting/processor` decide who gets texted.
- `apps/@meetings/server`, with the Expo mobile app in `apps/@meetings/app`. Meetings are
  recorded conversations between staff and clients; transcripts and summaries are highly
  sensitive. Some routes verify a Google ID token in `src/server/routes.ts`.

Python services:

- `apps/@reentry/backend` (FastAPI, Auth0 in `app/auth`, with an impersonation module) and
  `apps/@reentry/frontend` (Next.js). Assessment transcripts are summarized by a language
  model and turned into action plans, so transcript text reaches a prompt. Treat transcript
  and resource content as untrusted input to that prompt.
- `apps/@cpa-labeling/backend` (FastAPI, PyJWT): a standalone labeling backend.

Public Pathways (`apps/public-pathways`, React with Auth0): aggregate views for the public
site of a state.

Untrusted input enters through: every HTTP request to the services above; Firestore writes
from the staff and JII frontends, which the rules must constrain; Twilio webhooks; vendor
tokens from the tablet provider; uploaded files on the staff backend; transcript and
free-text content that later reaches a language model or another user's screen; and query
and path parameters that select a state, a person, or a metric.

### Trust model

Actors, from least to most privileged:

1. **Anonymous**: untrusted. Can reach login, health, the JII proxy, and any route on the
   exempt lists.
2. **A person using the JII app**: may read and write only their own record.
3. **A state staff user**: an Auth0 token whose `app_metadata.stateCode` names one state.
   They may read only that state, and only the routes and feature variants their metadata
   grants.
4. **A Recidiviz user**: `stateCode` `RECIDIVIZ`, limited to `recidivizAllowedStates` in
   Firestore and `allowedStates` elsewhere. Not every Recidiviz user may see every state.
   A Recidiviz user may impersonate a state user to reproduce an issue; the rules forbid an
   impersonator in production from writing person updates.
5. **Vendors and schedulers**: Twilio by auth token, the tablet vendor by JWE, Cloud Scheduler
   and Cloud Tasks by Google ID token or the App Engine cron header. Each may call only its
   own routes.
6. **Operator input**: Secret Manager, the SOPS-encrypted env files, Terraform under
   `libs/atmos`, and Firebase project configuration are trusted.

The boundaries a finding must cross, in order of importance:

- **State to state.** Any path by which data for one state reaches a user of another,
  through a service, a Firestore rule, a Prisma client, or an export.
- **Person to person inside the JII app.** One person's record reaching another person.
- **User to user inside a state.** A staff user reading or changing a record, a caseload, a
  meeting, or a message their role does not cover.
- **Frontend to Firestore.** A write the rules should reject but accept: a document in
  another state's collection, a person update by an impersonator in production, a claim the
  token does not carry.
- **Vendor or scheduler route to user route.** A webhook or task payload that acts as a user,
  or a user request that reaches a cron or task route.
- **Impersonation.** A non-Recidiviz token that obtains an impersonated Firebase token.

## Components that matter most and least

Highest priority, with the files to read first:

1. `libs/firestore-config/src/rules/firestore.rules` and the tests next to it under
   `rules/tests`.
2. `apps/staff-server/src/server/app.js` (the JWT and state code middleware, the exempt
   lists, the upload and file routes) and `src/server/workflows/firebaseToken.js`.
3. `libs/common/server-setup-plugin/src/index.ts` and every tRPC context that scopes by
   state: `libs/@sentencing/trpc/src/context.ts` first.
4. `apps/@jii/server/src/server/routes.ts` and the token tools under `src/tools`.
5. `apps/@jii-texting/server/src/server/webhooks.ts` and `authUtils.ts`;
   `apps/@meetings/server/src/server/routes.ts`.
6. `apps/@reentry/backend/app/auth` and the prompt construction in the reentry backend.
7. The Firestore reads and writes in `libs/firestore-api` and the stores under
   `apps/staff/src`, which decide what documents the frontend asks for.

Lower priority or out of scope:

- `libs/atmos` and the Terraform stacks: in scope only for a public resource or a missing
  authorization that the application code relies on.
- `apps/@typesense`, `libs/fixture-generator`, `libs/design-system`, Storybook files, and
  `plugins/`.
- Offline and demo modes: anything guarded by `isOfflineMode`, `validateOfflineRequest`, or
  the `DEMO_` collection prefix. They run without authentication by design and never in
  production.
- Tests, fixtures, `tools/`, docs, and CI configuration.

## What counts as a finding

A report needs all four:

- **Entry point**: the route, the Firestore rule, or the handler, with file and line.
- **Actor**: the least privileged actor that works. Use a JII user or a state user before a
  Recidiviz user, and anonymous before either. Say which state the token names.
- **Input**: the request value, document, or token claim and how it reaches the sink.
- **Impact**: what the actor reads, writes, sends, or runs that they should not. Name the
  boundary crossed.

One report per root cause, listing every route or rule it reaches. Say whether sibling
routes have the same gap. Prove impact without maximizing it: read one record, do not dump a
collection.

## How to exercise it

- Nx runs every project's tests: `yarn nx test <project> --skip-nx-cache`. Project names are
  in each `project.json` or `package.json`; `datatypes`, `auth`, `firebase-auth`, and
  `staff` are a good first set. `NX_DAEMON=false` is already set in the image.
- The Firestore rules tests under `libs/firestore-config/src/rules/tests` need the Firestore
  emulator, which is not in the image. Reason about the rules directly, and write the
  reproducer as a rules test that a maintainer can run.
- Projects tagged `sentencing`, `meetings`, and `jii-texting` need PostgreSQL, generated
  Prisma clients, and SOPS-decrypted environment variables. None of those is in the image.
  Review the source and write the reproducer as a unit test against the tRPC context or the
  handler with mocked dependencies.
- The Python backends: `cd apps/@reentry/backend && uv run pytest` and the same under
  `apps/@cpa-labeling/backend`. Tests that need PostgreSQL or Redis will fail; the rest run.
- Express and Fastify handlers can be exercised with `supertest` or Fastify's `inject` in a
  vitest file next to the handler, with the JWT verification mocked to return the claims the
  scenario needs. `apps/@jii/server/src/server/routes.test.ts` shows the pattern.
- No frontend build is needed for a backend finding. A browser is not in the image, so
  Playwright and WebdriverIO suites do not run.

## How we rate severity

Severity follows the attacker's position and the boundary crossed, not the bug class.

- **Critical**: an anonymous caller, a JII user, or any state user reads or changes another
  state's data or another person's record; an authentication bypass on any service; a
  Firestore rule that lets a token read or write outside its state; remote code execution;
  SSRF that reaches the GCP metadata server or returns a secret; exposure of many person
  records; a prompt injection in reentry that exfiltrates another client's assessment.
- **High**: a state user reads or changes a record, meeting, message, or caseload inside
  their own state that their role does not cover; SQL injection through a Prisma raw query
  or SQLModel with a valid token; a missing or bypassable Twilio, Google ID token, or cron
  check; an impersonated token obtained by a non-Recidiviz user; stored cross-site scripting
  that reaches another staff user; path traversal or arbitrary file read through the upload
  and file routes; a text sent to a phone number the caller chose.
- **Medium**: information disclosure without person data, such as stack traces, internal
  hostnames, or configuration; denial of service or rate-limit bypass from a single request;
  logging of a name, date of birth, identifier, or address, which is a policy violation here
  even without an attacker; an open redirect in a login flow.
- **Low**: defects only reachable in offline or demo mode, in `tools/`, in Storybook, or in a
  dependency with no reachable call path.

A Recidiviz user is trusted to see the states in their allowed list and to impersonate.
An issue that needs that role is at most medium unless it reaches another state, a secret,
or the host. A report that could not be reproduced in this image because it needs the
Firestore emulator, PostgreSQL, or a browser should say so; it is a lead for the
maintainers, not a confirmed finding, and is rated one level lower.

## Anything to leave alone

By design or already known. Do not report these on their own:

- Offline mode (`nx offline staff`) and demo collections run without authentication and
  serve fixture data. They are guarded by `isOfflineMode` and the `DEMO_` prefix.
- Impersonation of a state user by a Recidiviz user is a supported feature. Report it only
  when a non-Recidiviz token can use it, or when an impersonator can write in production.
- The Auth0 domains, audiences, and Firebase project ids in `libs/auth-utils` and the
  Firebase config files are public client configuration, not secrets.
- The Sentry DSN strings are intentionally public.
- The nginx proxy in `apps/jii-proxy-server` has fixed upstreams. Report it only if a caller
  can choose the upstream host.
- `env.*.enc.yaml` files are SOPS-encrypted and are not in this mirror.
- Dependency versions are pinned in `yarn.lock` and the `uv.lock` files and tracked
  separately. Report a dependency only with a reachable call path.
- Missing security headers beyond what `helmet` sets, version disclosure, user enumeration
  on login, self-XSS, and volumetric denial of service.
- The staff backend already runs `express-rate-limit`; a missing limit on one route is not a
  finding unless it enables one of the outcomes above.

## How reports and patches should look

Send reports to security@recidiviz.org, one per root cause. Give the commit, the entry point
with file and line, the actor and the state their token names, the input, the boundary
crossed, and a vitest or pytest reproducer where the module runs in this image. Patches as a
unified diff against `main`, fixing the check at the place that enforces it rather than at
one caller, with a regression test. The fix lands in the private repository and mirrors here
about two weeks later, so a small rebase may be needed. Use only synthetic names and
identifiers in a report; never copy a fixture row that looks real.
