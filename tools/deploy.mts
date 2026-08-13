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

import {
  createLinearClient,
  createOctokit,
  createSlackClient,
} from "./deploy/clients.mts";
import { deployWithRetry } from "./deploy/deploy-with-retry.mts";
import { verifyDockerImages } from "./deploy/images.mts";
import {
  commentOnManualTestingTickets,
  extractLinearTicketIds,
  setDeployStatusLabel,
} from "./deploy/linear.mts";
import { requestPamDeployGrant } from "./deploy/pam.mjs";
import { checkCleanRepo, checkCredentials } from "./deploy/preflight.mts";
import { runPreviewDeploy } from "./deploy/preview.mts";
import { promptDeployEnv, promptServices } from "./deploy/prompts.mts";
import { finalizeProduction, preparePlan } from "./deploy/release.mts";
import { type ServiceKey, services } from "./deploy/services/index.mts";
import { postDeployNotification } from "./deploy/slack.mts";
import type { PublishedRelease } from "./deploy/types.mts";

// The default is true, but we explicitly set it here because it needs to be set to true
// in order for the gcloud stderr to display (used for the backend deploy). It is never
// flipped back: the few commands whose output should stay quiet use `.quiet()` instead.
$.verbose = true;

const startTime = Date.now();

// --- Preflight ---------------------------------------------------------------
await checkCleanRepo();
await checkCredentials();

// --- Clients + environment ---------------------------------------------------
const octokit = await createOctokit();
const slack = await createSlackClient();
const linear = await createLinearClient();
const deployEnv = await promptDeployEnv();

if (deployEnv === "preview (staff frontend only)") {
  await runPreviewDeploy();
  process.exit();
}

// --- Release plan (staging tip-check / production version math) --------------
// `preparePlan` resolves the commit being deployed and carries it (plus the env,
// version, and shipped commit messages) on the returned plan, which is all any
// downstream phase needs.
const plan = await preparePlan(octokit, deployEnv);

const ticketIds = extractLinearTicketIds(plan.shippedCommitMessages);

// --- Service selection -------------------------------------------------------
const selected = await promptServices(deployEnv);

// --- PAM deploy-app elevation ------------------------------------------------
// Request a just-in-time deploy-app grant on each GCP project the selected services will deploy
// to (each service declares its target projects via `pamProjects`), so the operator deploys
// holding no standing access. Requested concurrently and WITHOUT blocking on IAM propagation --
// the setup steps below (nx reset / yarn install / atmos) give the grants ample time to
// propagate, so the ~20s propagation delay is paid once (overlapped) rather than per grant.
// Non-fatal (see ./deploy/pam.mjs): a failure warns and continues.
const pamProjects = new Set(
  [...selected]
    .filter((key): key is ServiceKey => key in services)
    .filter((key) => services[key].environments.includes(deployEnv))
    .flatMap((key) => services[key].pamProjects?.(deployEnv) ?? []),
);
await Promise.all(
  [...pamProjects].map((projectId) =>
    requestPamDeployGrant(projectId, { waitForPropagation: false }),
  ),
);

// --- Setup -------------------------------------------------------------------
console.log("Running nx reset...");
await $`nx reset`.pipe(process.stdout);

console.log("Installing yarn packages...");
await $`yarn install`.pipe(process.stdout);

console.log("Updating atmos...");
await $`brew install atmos`.pipe(process.stdout);

// --- Verify Docker images ----------------------------------------------------
await verifyDockerImages(plan, selected);

// --- Service deploys ---------------------------------------------------------
// Walk the registry in declaration order, deploying each selected service that's available in
// this environment. The build phase runs once; the deploy phase runs inside the retry loop.
const successfullyDeployedServices: string[] = [];

for (const [key, svc] of Object.entries(services)) {
  if (!selected.has(key)) continue;
  if (!svc.environments.includes(deployEnv)) continue;

  if (svc.build) {
    console.log(`Building ${svc.displayName}...`);
    await svc.build(plan);
  }

  if (await deployWithRetry(svc.displayName, () => svc.deploy(plan))) {
    successfullyDeployedServices.push(svc.displayName);
  }
}

// --- Finalize the production release (tag, publish, release branch) ----------
const published: PublishedRelease | null =
  plan.env === "production" && successfullyDeployedServices.length > 0
    ? await finalizeProduction(octokit, plan)
    : null;

// --- Linear ticket status -----------------------------------------------------
// A Linear API hiccup shouldn't fail an otherwise-successful deploy, so this phase
// only logs on error (mirroring the Slack-post error handling below).
if (successfullyDeployedServices.length > 0 && ticketIds.length > 0) {
  try {
    const env = plan.env === "production" ? "production" : "staging";
    await Promise.all(
      ticketIds.map((ticketId) => setDeployStatusLabel(linear, ticketId, env)),
    );
    if (env === "production") {
      await commentOnManualTestingTickets(linear, ticketIds);
    }
  } catch (error) {
    console.log("There was a problem updating Linear tickets for this deploy:");
    console.error(error);
  }
}

// --- Notifications ------------------------------------------------------------
const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
const minutes = Math.floor(elapsedSeconds / 60);
const seconds = elapsedSeconds % 60;

if (successfullyDeployedServices.length > 0) {
  await postDeployNotification(
    slack,
    plan,
    successfullyDeployedServices,
    published,
    elapsedSeconds,
  );

  console.log(
    `Finished with the ${deployEnv} deploy! Commit hash: ${plan.currentRevision}`,
  );
} else {
  console.log("No services were successfully deployed.");
}
console.log(`Total execution time: ${minutes}m ${seconds}s`);

// getImageRef in ./get-image-ref.mts creates an nx daemon connection with
// no way to clean it up, so we have to explicitly exit or we'll hang forever.
process.exit(0);
