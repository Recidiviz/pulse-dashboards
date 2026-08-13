// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.
// =============================================================================

/* eslint-disable no-await-in-loop */

import { $ } from "zx";

// Entitlement that grants the app deploy/operate roles just-in-time. Created per
// project by the PAM rollout; see recidiviz-security-operations-automation.
const ENTITLEMENT_ID = "pam-deploy-app";
const LOCATION = "global";
// 2 hours is comfortably longer than a deploy; the entitlement's max is 12h.
const GRANT_DURATION = "7200s";
const JUSTIFICATION =
  "Automated deploy-time elevation via the pulse-dashboards deploy script.";
const ACTIVE_POLL_ATTEMPTS = 24;
const POLL_INTERVAL_MS = 5000;
// IAM bindings created by an activated grant take a short while to propagate.
const PROPAGATION_WAIT_MS = 20000;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function parseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/**
 * Requests a just-in-time PAM `deploy-app` grant on `projectId` so the deploying
 * engineer holds the deploy roles for the duration of the deploy, then evaporates.
 *
 * Ported from recidiviz-data's `request_pam_deploy_grant` (deploy_helpers.sh).
 * Non-fatal by design: if PAM is unreachable, the entitlement is missing, or the
 * caller is not eligible, it logs a warning and returns so the deploy proceeds --
 * it will either succeed via the caller's existing access or fail later at the
 * real deploy step with a clear error.
 *
 * @param {string} projectId - GCP project the `pam-deploy-app` entitlement lives on.
 * @param {{ waitForPropagation?: boolean }} [options] - Set `waitForPropagation: false` (default
 *   true) to return as soon as the grant is ACTIVE, skipping the IAM-propagation pause -- for
 *   callers that request several grants up front and let later steps (e.g. `yarn install`) cover
 *   propagation, so the ~20s delay is paid once, overlapped, rather than per grant.
 * @returns {Promise<void>}
 */
export async function requestPamDeployGrant(
  projectId,
  { waitForPropagation = true } = {},
) {
  const label = `PAM deploy-app grant on ${projectId}`;

  // 1. Is the entitlement reachable here? If not, skip quietly.
  const describe =
    await $`gcloud pam entitlements describe ${ENTITLEMENT_ID} --location=${LOCATION} --project=${projectId} --format=json`
      .nothrow()
      .quiet();
  if (describe.exitCode !== 0) {
    console.warn(
      `⚠️  ${label}: entitlement not found or PAM unreachable -- proceeding without elevation.`,
    );
    return;
  }

  const account = (
    await $`gcloud config get-value account`.nothrow().quiet()
  ).stdout.trim();

  // 2. Reuse an existing ACTIVE grant for this requester, if one is already open.
  const listed =
    await $`gcloud pam grants list --entitlement=${ENTITLEMENT_ID} --location=${LOCATION} --project=${projectId} --filter=state=ACTIVE --format=json`
      .nothrow()
      .quiet();
  if (listed.exitCode === 0) {
    const active = (parseJson(listed.stdout) ?? []).find(
      (grant) => grant.requester === account,
    );
    if (active) {
      console.log(`✅ ${label}: reusing your active grant.`);
      return;
    }
  }

  // 3. Create a short grant.
  console.log(`⏳ Requesting ${label} for ${GRANT_DURATION}...`);
  const created =
    await $`gcloud pam grants create --entitlement=${ENTITLEMENT_ID} --location=${LOCATION} --project=${projectId} --requested-duration=${GRANT_DURATION} --justification=${JUSTIFICATION} --format=json`
      .nothrow()
      .quiet();
  if (created.exitCode !== 0) {
    console.warn(
      `⚠️  ${label}: could not create grant (not eligible, or PAM error) -- proceeding.\n${created.stderr.trim()}`,
    );
    return;
  }
  const grantName = parseJson(created.stdout)?.name;

  // 4. Wait for the grant to activate and its IAM bindings to propagate.
  for (let attempt = 0; attempt < ACTIVE_POLL_ATTEMPTS; attempt += 1) {
    const state = grantName
      ? parseJson(
          (
            await $`gcloud pam grants describe ${grantName} --format=json`
              .nothrow()
              .quiet()
          ).stdout,
        )?.state
      : undefined;
    if (state === "ACTIVE") {
      if (waitForPropagation) {
        console.log(`✅ ${label}: active. Waiting for IAM propagation...`);
        await wait(PROPAGATION_WAIT_MS);
      } else {
        console.log(`✅ ${label}: active.`);
      }
      return;
    }
    if (state === "DENIED" || state === "REVOKED") {
      console.warn(
        `⚠️  ${label}: grant ${state} -- proceeding without elevation.`,
      );
      return;
    }
    await wait(POLL_INTERVAL_MS);
  }
  console.warn(
    `⚠️  ${label}: grant did not reach ACTIVE in time -- proceeding; the deploy may fail if access has not propagated.`,
  );
}
