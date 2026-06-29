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

import { createOctokit, createSlackClient } from "./deploy/clients.mts";
import { deployWithRetry } from "./deploy/deploy-with-retry.mts";
import { verifyDockerImages } from "./deploy/images.mts";
import { checkCleanRepo, checkCredentials } from "./deploy/preflight.mts";
import { runPreviewDeploy } from "./deploy/preview.mts";
import { promptDeployEnv, promptServices } from "./deploy/prompts.mts";
import { finalizeProduction, preparePlan } from "./deploy/release.mts";
import { services } from "./deploy/services/index.mts";
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
const deployEnv = await promptDeployEnv();

if (deployEnv === "preview (staff frontend only)") {
  await runPreviewDeploy();
  process.exit();
}

// --- Release plan (staging tip-check / production version math) --------------
// `preparePlan` resolves the commit being deployed and carries it (plus the env and
// version) on the returned plan, which is all any downstream phase needs.
const plan = await preparePlan(octokit, deployEnv);

// --- Service selection -------------------------------------------------------
const selected = await promptServices(deployEnv);

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
