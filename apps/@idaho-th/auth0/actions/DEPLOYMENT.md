<!--
Recidiviz - a data platform for criminal justice reform
Copyright (C) 2026 Recidiviz, Inc.

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.
=============================================================================
-->

# Idaho TH — Deploying the Provider Action to the staging tenant (step-by-step)

> Read this if you are deploying to the Auth0 dashboard for the first time.
> For the design rationale and behavior contract, see [README.md](./README.md).

**Scope of this guide: the staging tenant (`recidiviz-idaho.us.auth0.com`),
provider action only.** The actions in this directory are the staging copies,
pasted into the Auth0 dashboard by hand. **They are not the production
actions.** Production runs the terraform-managed copies in
`libs/atmos/components/terraform/auth0-staff/actions/post-login/`, applied by
Atmos — never paste a file from this directory into the production tenant. The
two have diverged on purpose: production reads the Admin Panel roster and an
explicit Recidiviz allowlist, while this tenant has neither and admits testers
on a domain check alone.

Within staging, staff is already live — do **not** duplicate or reorder it.
Everything below is additive and reversible in under a minute (see
[Rollback](#rollback) if anything looks wrong). If the existing staff action is
intentionally edited or redeployed later, it needs the same backend webhook
secrets because it calls `/internal/link-staff`.

---

## 0. Before you start

You need:

- [ ] **Auth0 dashboard access** to the Idaho TH staging tenant
      (`recidiviz-idaho.us.auth0.com`). Do not create a new Auth0 tenant or
      user; see the security rules on new Auth0 tenants. Production is applied
      by terraform and needs nothing from this guide.
- [ ] The three secret values below — do **not** guess or invent them:
  - `IDAHO_TH_CLIENT_ID` — the Auth0 application (client) id of the Idaho TH
    app. Find it in Auth0 → **Applications** → the Idaho TH app → Settings
    → **Client ID** (top of the page). This is not secret; it's also
    visible in the frontend's `AUTH0_CLIENT_ID` config.
  - `BACKEND_API_URL` — the public load-balanced app origin **of the
    environment this tenant serves**, with a **trailing slash**. Staging points
    at the staging app; `https://housing.recidiviz.org/` is production's and
    belongs only in the terraform-managed action. Pointing a staging action at
    the production origin would link staging logins into production data. The
    action appends `internal/link-provider`. Do not use the raw Cloud Run
    `*.run.app` URL; the API service is locked to load-balancer-only ingress.
  - `BACKEND_WEBHOOK_SECRET` — the shared HMAC secret. This is stored
    encrypted in `libs/atmos/components/terraform/apps/idaho-th/secrets/recidiviz-transitional-housing.enc.yaml`
    (SOPS) and deployed to the backend Cloud Run service as an env var. It
    must match **exactly** — pull it from SOPS/Secret Manager, don't retype
    it by hand.

These three secrets are also required by the staff action on any tenant where
the staff action is created or redeployed. Staff is already wired on this
tenant, so use them below only for the new provider action unless you are
deliberately updating staff.

---

## 0b. Create the shared Action Module (do this first)

Both actions `require("actions:idaho-th-action-helpers")`, so the module has
to exist and be **published** before either action will run. An action bound
to a missing module fails at import — every login it owns errors out — so
create this before touching the trigger.

1. Go to **Actions → Modules** and click **Create Module**.
2. Name it exactly `idaho-th-action-helpers`. The name is what the `require`
   resolves, so a typo here breaks both actions.
3. Delete the boilerplate and paste the **entire contents** of
   [`modules/idaho-th-action-helpers.js`](./modules/idaho-th-action-helpers.js).
   Use the repo file as the source of truth — don't retype it.
4. No npm dependencies are needed: the module only uses Node's built-in
   `crypto` and the global `fetch`.
5. No secrets are set on the module. Unlike the production module, this one
   reads secrets from the `event` each action passes in, so the secrets stay
   on the actions where step 2 puts them.
6. **Publish** the module. A saved-but-unpublished module is not resolvable
   by an action.

When you later edit the module, republish it **and** confirm each action is
bound to the new version — Auth0 pins an action to the module version it was
deployed against, so a republish alone does not reach the running actions.

---

## 1. Create the Action

1. Log in to the Auth0 dashboard, switch to the **Idaho TH staging tenant**
   `recidiviz-idaho.us.auth0.com` (double-check the tenant name/environment
   switcher in the top bar — this is the step most likely to go wrong). If the
   switcher shows the shared staff tenant, stop: that one is terraform-managed
   and nothing in this guide applies to it.
2. Go to **Actions → Library**.
3. Click **Build Custom**.
4. Name it `Idaho TH - Provider Metadata` (or similar — name doesn't affect
   behavior, but keep it recognizable).
5. Trigger: **Login / Post Login**.
6. Runtime: **Node 22 (Recommended)** — leave the default; the code has no
   runtime-specific dependencies.
7. Click **Create**.

You'll land in the code editor. **Nothing is live yet** — an Action isn't
active until it's added to the post-login Trigger (step 3 below), so you
can't break anything by editing here.

## 2. Paste the code and set secrets

1. Delete the boilerplate code in the editor.
2. Copy the **entire contents** of
   [`post-login-set-idaho-th-provider-metadata.js`](./post-login-set-idaho-th-provider-metadata.js)
   from this repo and paste it in. Use the file in the repo as the source
   of truth — don't retype it.
3. No npm dependencies need to be added (the action's own code only uses the
   global `fetch` plus the shared module, both available in the Auth0
   runtime).
4. In the left sidebar, click the **modules icon** and add
   `idaho-th-action-helpers` from step 0b, selecting its published version.
   Without this the `require("actions:idaho-th-action-helpers")` at the top of
   the file cannot resolve and every login the action owns fails.
5. In the left sidebar of the editor, click the **key icon (Secrets)**.
6. Add three secrets, matching the names exactly (case-sensitive):
   | Name | Value |
   | --- | --- |
   | `IDAHO_TH_CLIENT_ID` | the client id from step 0 |
   | `BACKEND_API_URL` | the backend URL from step 0 (with trailing slash) |
   | `BACKEND_WEBHOOK_SECRET` | the shared secret from step 0 |
7. Click **Save Draft** (top right). This does **not** deploy or activate
   it yet.
8. Click **Deploy** (top right, next to Save Draft). This makes the Action
   available to add to the Trigger — it's still not running for any user
   until step 3.

## 3. Add it to the post-login Trigger

This is the step that makes it live.

1. Go to **Actions → Triggers**.
2. Click the **post-login** trigger.
3. You should see the existing staff action already in the trigger's flow
   (this confirms you're looking at the right trigger — if you don't see an
   existing action here, stop and check you're on the right tenant/trigger
   before continuing).
4. In the right-hand panel, find your new `Idaho TH - Provider Metadata`
   action under the **Custom** tab and drag it into the flow.
5. Order relative to the staff action **does not matter** — the two are
   mutually exclusive by connection (each one no-ops on logins it doesn't
   own), so either order is safe. See
   [README.md § Why two actions](./README.md#why-two-actions-instead-of-one)
   if you want the detail.
6. Click **Apply** (top right) to save the trigger.

The action is now live for every login to the Idaho TH app.

## 4. Verify

Do this immediately after applying, before telling anyone the rollout is
done:

1. **Staff login still works.** Log in as a staff user the normal way and
   confirm you land in the app as before. This is the check that matters
   most — it confirms you didn't accidentally break the existing flow. If
   the staff action was edited, also confirm backend logs show
   `/internal/link-staff` succeeding or only fail-open sync errors.
2. **Provider login works.** Have a pre-provisioned provider (an email
   that's already in the Idaho TH provider DB table) log in via the
   passwordless email flow and confirm they land in the app with provider
   access.
3. **Unprovisioned email is denied, not crashed.** Try a passwordless login
   with an email that is _not_ in the provider table — you should see the
   "Your account has not been set up" message, not a generic Auth0 error
   page. If you see a generic/ugly error, something is misconfigured
   (usually a bad `BACKEND_API_URL` or `BACKEND_WEBHOOK_SECRET`).
4. Check **Actions → your action → Monitoring** (or **Logs** in the
   dashboard) for `console.error("Backend link failed:", ...)` entries — if
   present, the action can't reach the backend (wrong URL, backend down, or
   secret mismatch causing a signature/auth failure on the backend side).

## Rollback

If anything looks wrong, you can revert instantly without touching code:

1. **Actions → Triggers → post-login.**
2. Click the `Idaho TH - Provider Metadata` node in the flow, and remove it
   (drag it out, or use the remove option in its node menu).
3. Click **Apply.**

This immediately stops the action from running for any login — no
deploy/redeploy needed, no propagation delay beyond Auth0's normal flow
save. Staff logins are unaffected either way, since the staff action is a
separate node you never touched.

---

## ⚠️ Deploying to a tenant where staff is NOT already live

Everything above assumes this staging tenant, where the staff action is
already deployed and must be left alone. **If you're setting up a further
tenant (dev, DR) that does not already have the staff action, you must also
deploy it** — otherwise staff logins to that tenant will get a token with
no `role`/`pseudonymizedId` claim at all, and every staff user will fail
authorization downstream even though login itself "succeeds."

The staff action sets exactly this claim (see
[`post-login-set-idaho-th-staff-metadata.js`](./post-login-set-idaho-th-staff-metadata.js)):

```js
const appMetadata = {
  stateCode: STATE_CODE,
  role: ROLE_STAFF,
  pseudonymizedId,
};
```

If that block never runs for a given staff login — because the action isn't
in the trigger, or it no-ops/denies before reaching it — the resulting
token has no `https://idaho_th.recidiviz.org/app_metadata` claim, and the
frontend/tRPC backend has nothing to authorize against. Symptoms look like
"login succeeds but the app treats me as unauthorized."

To deploy the staff action on a tenant that doesn't have it yet, repeat
**steps 1–4 above** with these differences:

1. Use [`post-login-set-idaho-th-staff-metadata.js`](./post-login-set-idaho-th-staff-metadata.js)
   instead of the provider file.
2. Set all three secrets: `IDAHO_TH_CLIENT_ID`, `BACKEND_API_URL`, and
   `BACKEND_WEBHOOK_SECRET`. The staff action makes two signed calls and they
   fail in opposite directions, so the secrets matter more than they used to:
   `/internal/link-staff` fails **open** (a missing secret hides the problem
   during login), while `/internal/check-staff-authorized` fails **closed** —
   without reachable backend secrets every `@recidiviz.org` login is denied
   outright, not silently degraded.
3. Add it to the **same** post-login trigger as the provider action; order
   between the two doesn't matter (see
   [README.md § Why two actions](./README.md#why-two-actions-instead-of-one)).
4. Verify by logging in as a staff user and confirming the ID token
   actually contains the `role: "staff"` claim (e.g. decode it at
   jwt.io or check the app's authorized state) — don't just confirm the
   login screen redirects successfully, since a no-op or a silent deny can
   still look like a normal redirect.
5. Confirm backend logs for `/internal/link-staff` show the staff row was
   linked/upserted. A `409` denies login; other backend/network failures are
   logged by the action and allowed so staff login is not blocked by sync
   outages.
6. Log in with an `@recidiviz.org` address and confirm backend logs show
   `/internal/check-staff-authorized` returning `200`. On staging the domain
   itself is the grant, so any Recidiviz address should pass; a `403` there
   means the request never reached the backend or the secrets do not match,
   since nothing else denies on that domain.
7. Check the domain bound before raising a bug about a denied tester. The
   action admits only IDOC's two domains, `@recidiviz.org`, and
   `pentester-housing-case-manager-<n>@recidiviz-test.org`; a QA account on any
   other domain is denied with "not authorized" and makes **no backend call at
   all**, so an absent `/internal/check-staff-authorized` log line is the
   diagnostic. Issue testers an address on one of those domains rather than
   widening `isKnownStaffEmail`.

**On a tenant that already has staff live — including this one — skip this
entire section.** Re-adding it would duplicate the node in the trigger.
