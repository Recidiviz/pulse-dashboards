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

import { $, chalk } from "zx";

import { dashboardProject } from "../config.mts";
import type { ReleasePlan, ServiceDefinition } from "../types.mts";

/** Build and deploy the staff App Engine backend (staff-server). */
export const staffBackend: ServiceDefinition = {
  displayName: "Staff Backend",
  environments: ["staging", "demo", "production"],
  pamProjects: (env) => [dashboardProject(env)],
  async build() {
    await $`nx build staff-server`.pipe(process.stdout);
  },
  async deploy(plan) {
    const gaeVersion = plan.nextVersion.replaceAll(".", "-");
    switch (plan.env) {
      case "production":
        await $`./tools/gcloud-sops-app-deploy.sh dist/apps/staff-server/gae-production.enc.yaml --quiet --project recidiviz-dashboard-production --version ${gaeVersion}`.pipe(
          process.stdout,
        );
        break;
      case "demo":
        await $`./tools/gcloud-sops-app-deploy.sh dist/apps/staff-server/gae-staging-demo.enc.yaml --quiet --project recidiviz-dashboard-staging`.pipe(
          process.stdout,
        );
        break;
      default:
        await $`./tools/gcloud-sops-app-deploy.sh dist/apps/staff-server/gae-staging.enc.yaml --quiet --project recidiviz-dashboard-staging`.pipe(
          process.stdout,
        );
        break;
    }
  },
};

/**
 * Envs with a provisioned Cloud CDN stack (`apps/staff-frontend` atmos
 * component). While we validate the CDN on its test domain,
 * uploads are run alongside (not instead of) the Firebase
 * Hosting deploy. The upload/invalidation procedure lives in
 * tools/deploy-staff-frontend.mts (single source of truth — also runnable
 * directly or via `nx deploy-cdn staff -- <env>`).
 */
const cdnEnabledEnvs = new Set<ReleasePlan["env"]>(["staging", "production"]);

/** Build and deploy the staff frontend to Firebase hosting. */
export const staffFrontend: ServiceDefinition = {
  displayName: "Staff Frontend",
  environments: ["staging", "demo", "production"],
  // Firebase Hosting target (+ Cloud CDN on staging/prod), per .firebaserc.
  pamProjects: (env) => {
    switch (env) {
      case "production":
        return ["recidiviz-dashboard", "recidiviz-dashboard-production"];
      case "demo":
        return ["recidiviz-dashboard-demo"];
      default:
        return [
          "recidiviz-dashboard-stag-e1108",
          "recidiviz-dashboard-staging",
        ];
    }
  },
  async build(plan) {
    switch (plan.env) {
      case "production":
        await $`nx build staff --configuration production`.pipe(process.stdout);
        break;
      case "demo":
        await $`nx build staff --configuration demo`.pipe(process.stdout);
        break;
      default:
        await $`nx build staff --configuration staging`.pipe(process.stdout);
    }
  },
  async deploy(plan) {
    switch (plan.env) {
      case "production":
        await $`firebase deploy --only hosting -P production -m "Version ${plan.nextVersion} - Commit hash ${plan.currentRevision}"`.pipe(
          process.stdout,
        );
        break;
      default:
        await $`firebase deploy --only hosting -P ${plan.env} -m "${plan.currentRevision}"`.pipe(
          process.stdout,
        );
    }

    if (cdnEnabledEnvs.has(plan.env)) {
      try {
        await $`nx deploy-cdn staff --configuration ${plan.env}`.pipe(
          process.stdout,
        );
      } catch (error) {
        // Firebase Hosting stays the serving path during the CDN transition —
        // don't fail the release over the secondary target.
        console.warn(
          chalk.yellow(
            `CDN deploy (${plan.env}) failed (Firebase deploy succeeded): ${error}`,
          ),
        );
      }
    }
  },
};
