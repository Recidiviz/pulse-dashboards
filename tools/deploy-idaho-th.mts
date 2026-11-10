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

/**
 * Opt-in Idaho TH deploy helper.
 *
 * Not part of `yarn deploy`. Images are built by
 * `.github/workflows/build-idaho-th-images.yml` on push to
 * supported Idaho TH prototype and release branches. Staging and production
 * Cloud Run pull from the staging Artifact Registry. Client Auth0 and API URL
 * come from runtime `/config.js`.
 *
 * Applies staging `artifact_registry` and `apps/idaho-th` with SHA-pinned
 * container versions. Apply `apps/malware-scanning` separately when scanner or
 * clean-bucket IAM changes.
 *
 * Usage: `yarn deploy-idaho-th`
 *
 * Requires: clean git tree, gcloud ADC, Atmos. Local image rebuild requires
 * Docker auth to `us-central1-docker.pkg.dev`.
 */

/* eslint-disable no-await-in-loop */

import { exit } from "node:process";

import dedent from "dedent";
import inquirer from "inquirer";
import { $ } from "zx";

import { owner, repo } from "./deploy/config.mts";
import { checkCleanRepo } from "./deploy/preflight.mts";
import { getImageRef } from "./get-image-ref.mts";

$.verbose = true;

type IdahoThEnv = "staging" | "production";

const IMAGE_PROJECTS = [
  "@idaho-th/server",
  "@idaho-th/seed-db",
  "@idaho-th/client",
] as const;

const DEPLOY_BRANCHES = [
  "prototype/idaho-transitional-housing-v2",
  "prototype/idaho-transitional-housing-v4",
] as const;
// Keep this pattern aligned with the image workflow: * matches one release segment.
const RELEASE_BRANCH_PATTERN = /^release\/idaho-th\/[^/]+$/;
const DEPLOY_BRANCHES_LABEL = [...DEPLOY_BRANCHES, "release/idaho-th/*"].join(
  " or ",
);

const STACKS: Record<IdahoThEnv, string> = {
  staging: "rcdvz-transitional-housing-dev--idaho-th",
  production: "recidiviz-transitional-housing--idaho-th",
};

const IMAGE_WORKFLOW_URL = `https://github.com/${owner}/${repo}/actions/workflows/build-idaho-th-images.yml`;

await checkCleanRepo();

try {
  await $`gcloud auth application-default print-access-token --quiet`.quiet();
} catch {
  await $`gcloud auth login --update-adc`.pipe(process.stdout);
}

const { deployEnv } = (await inquirer.prompt({
  type: "list",
  name: "deployEnv",
  message: "Which environment are you deploying Idaho TH to?",
  choices: ["staging", "production"] satisfies IdahoThEnv[],
  default: "staging",
})) as { deployEnv: IdahoThEnv };

if (deployEnv === "production") {
  const { confirmed } = (await inquirer.prompt({
    type: "confirm",
    name: "confirmed",
    message: "Deploy Idaho TH to PRODUCTION?",
    default: false,
  })) as { confirmed: boolean };
  if (!confirmed) {
    console.log("Deployment cancelled.");
    exit(1);
  }
}

const branch = (await $`git rev-parse --abbrev-ref HEAD`.quiet()).stdout.trim();
if (
  !DEPLOY_BRANCHES.includes(branch as (typeof DEPLOY_BRANCHES)[number]) &&
  !RELEASE_BRANCH_PATTERN.test(branch)
) {
  if (deployEnv === "production") {
    console.error(
      `Production deploys must run from ${DEPLOY_BRANCHES_LABEL} (CI builds images there). Currently on '${branch}'.`,
    );
    exit(1);
  }
  const { proceed } = (await inquirer.prompt({
    type: "confirm",
    name: "proceed",
    message: `Not on ${DEPLOY_BRANCHES_LABEL} (CI builds images there). Proceed anyway?`,
    default: false,
  })) as { proceed: boolean };
  if (!proceed) {
    console.log("Deployment cancelled.");
    exit(1);
  }
}

const currentRevision = (
  await $`git rev-parse --short=12 HEAD`.quiet()
).stdout.trim();
const stack = STACKS[deployEnv];

console.log(
  `\nDeploying Idaho TH to ${deployEnv} (${stack}) at ${currentRevision}\n`,
);

console.log("Verifying Docker images are available...");
const imageByProject = Object.fromEntries(
  await Promise.all(
    IMAGE_PROJECTS.map(
      async (project) => [project, await getImageRef(project)] as const,
    ),
  ),
);
let missingProjects = [...IMAGE_PROJECTS];

while (missingProjects.length > 0) {
  const stillMissing: (typeof IMAGE_PROJECTS)[number][] = [];

  for (const project of missingProjects) {
    const image = imageByProject[project];
    let listed: unknown[];
    try {
      const result =
        await $`gcloud artifacts docker images list ${image} --quiet --include-tags --filter=tags:${currentRevision} --format=json`.quiet();
      listed = JSON.parse(result.stdout) as unknown[];
    } catch (error) {
      console.error(
        `Failed to list ${image}:${currentRevision} (auth/IAM/API error):\n${String(error)}`,
      );
      exit(1);
    }

    if (Array.isArray(listed) && listed.length > 0) {
      console.log(`Found ${image}:${currentRevision}`);
    } else {
      console.error(`Image not found: ${image}:${currentRevision}`);
      stillMissing.push(project);
    }
  }

  missingProjects = stillMissing;
  if (missingProjects.length === 0) {
    break;
  }

  console.error(
    dedent`
      \nSome Docker images are not available:
      ${missingProjects.map((p) => `   - ${imageByProject[p]}:${currentRevision}`).join("\n")}

      CI builds on push to ${DEPLOY_BRANCHES_LABEL}: ${IMAGE_WORKFLOW_URL}
    `,
  );

  const choices =
    deployEnv === "production"
      ? [
          { name: "Retry checking for the missing images", value: "retry" },
          { name: "Exit deployment", value: "exit" },
        ]
      : [
          { name: "Retry checking for the missing images", value: "retry" },
          {
            name: "Build missing images locally (SHA tag only)",
            value: "build",
          },
          { name: "Exit deployment", value: "exit" },
        ];

  const { action } = (await inquirer.prompt({
    type: "list",
    name: "action",
    message: "What would you like to do?",
    choices,
    default: "retry",
  })) as { action: "retry" | "build" | "exit" };

  if (action === "exit") {
    console.log("Deployment cancelled.");
    exit(1);
  }

  if (action === "build") {
    // Staging only: cherry-pick pushes the SHA tag and leaves :latest unchanged.
    console.log("Configuring Docker auth for Artifact Registry...");
    await $`gcloud auth configure-docker us-central1-docker.pkg.dev --quiet`.pipe(
      process.stdout,
    );
    for (const project of missingProjects) {
      console.log(`Building ${project}...`);
      await $`COMMIT_SHA=${currentRevision} nx container ${project} -c cherry-pick`.pipe(
        process.stdout,
      );
    }
  } else {
    console.log("Retrying image checks...");
  }
}

console.log("All required Docker images verified\n");

if (deployEnv === "staging") {
  await $`yarn atmos:apply artifact_registry -s ${stack} -- -auto-approve`.pipe(
    process.stdout,
  );
}

await $`yarn atmos:apply apps/idaho-th -s ${stack} -- -auto-approve \
    -var server_container_version=${currentRevision} \
    -var migrate_db_container_version=${currentRevision} \
    -var seed_db_container_version=${currentRevision} \
    -var frontend_container_version=${currentRevision}`.pipe(process.stdout);

console.log(
  dedent`
    \nIdaho TH ${deployEnv} apply finished @ ${currentRevision}.
    Cloud Run services and jobs pin this SHA.
    Confirm the migrate job execution in Cloud Run; re-run with gcloud run jobs execute when it did not run on this apply.
    Seed job is create/update only (exec=false).
    Apply apps/malware-scanning separately when scanner or clean-bucket IAM changes.
  `,
);

// getImageRef leaves an Nx daemon socket open; exit explicitly (see tools/deploy.mts).
exit(0);
