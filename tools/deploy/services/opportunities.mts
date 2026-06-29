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

import { $ } from "zx";

import type { DeployEnv, ReleasePlan, ServiceDefinition } from "../types.mts";

/** Deploy a `-m` message for the Opportunities frontend/storybook: just the commit on
 * non-prod, version + commit on production. */
function deployMessage(plan: ReleasePlan): string {
  return plan.env === "production"
    ? `Version ${plan.nextVersion} - Commit hash ${plan.currentRevision}`
    : `${plan.currentRevision}`;
}

// there are no demo Opportunities cloud functions, staging functions serve both
const oppsBackendEnvironments: DeployEnv[] = ["staging", "production"];

/** Deploy the Opportunities (JII) cloud functions. */
export const oppsFunctions: ServiceDefinition = {
  displayName: "Opportunities Cloud Functions",
  environments: oppsBackendEnvironments,
  async deploy(plan) {
    await $`nx deploy jii-functions --configuration ${plan.env}`.pipe(
      process.stdout,
    );
  },
};

/** Deploy the Opportunities (JII) backend server via atmos. */
export const oppsBackend: ServiceDefinition = {
  displayName: "Opportunities Backend Services",
  environments: oppsBackendEnvironments,
  requiredImages: () => ["@jii/server", "@jii/import"],
  async deploy(plan) {
    const { env, currentRevision } = plan;
    // Deploy the server infrastructure changes for the applicable environment
    await $`yarn atmos:apply apps/jii -s recidiviz-jii-${env}--jii -- -auto-approve \
          -var server_container_version=${currentRevision} \
          -var migrate_db_container_version=${currentRevision} \
          -var import_job_container_version=${currentRevision}`.pipe(
      process.stdout,
    );
  },
};

/** Build and deploy the Opportunities frontend. */
export const oppsFrontend: ServiceDefinition = {
  displayName: "Opportunities Frontend",
  environments: ["staging", "demo", "production"],
  async build(plan) {
    // building separately because we want to pass extra args
    // to the deploy command but not the build command
    await $`nx build jii --configuration ${plan.env}`.pipe(process.stdout);
  },
  async deploy(plan) {
    // we built the project manually first,
    // skipping dependencies avoids passing arbitrary extra args to the build command
    await $`nx deploy jii --configuration ${plan.env} --excludeTaskDependencies -m "${deployMessage(plan)}"`.pipe(
      process.stdout,
    );
  },
};

/** Deploy the Opportunities Storybook (the deploy target includes the build). */
export const oppsStorybook: ServiceDefinition = {
  displayName: "Opportunities Storybook",
  environments: ["staging", "production"],
  async deploy(plan) {
    // deploy target includes build
    await $`nx deploy @jii/storybook --configuration ${plan.env} -m "${deployMessage(plan)}"`.pipe(
      process.stdout,
    );
  },
};
