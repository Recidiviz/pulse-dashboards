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

import type { ServiceDefinition } from "../types.mts";

/** Build and deploy the staff App Engine backend (staff-shared-server). */
export const staffBackend: ServiceDefinition = {
  displayName: "Staff Backend",
  environments: ["staging", "demo", "production"],
  async build() {
    await $`nx build staff-shared-server`.pipe(process.stdout);
  },
  async deploy(plan) {
    const gaeVersion = plan.nextVersion.replaceAll(".", "-");
    switch (plan.env) {
      case "production":
        await $`./tools/gcloud-sops-app-deploy.sh dist/libs/staff-shared-server/gae-production.enc.yaml --quiet --project recidiviz-dashboard-production --version ${gaeVersion}`.pipe(
          process.stdout,
        );
        break;
      case "demo":
        await $`./tools/gcloud-sops-app-deploy.sh dist/libs/staff-shared-server/gae-staging-demo.enc.yaml --quiet --project recidiviz-dashboard-staging`.pipe(
          process.stdout,
        );
        break;
      default:
        await $`./tools/gcloud-sops-app-deploy.sh dist/libs/staff-shared-server/gae-staging.enc.yaml --quiet --project recidiviz-dashboard-staging`.pipe(
          process.stdout,
        );
        break;
    }
  },
};

/** Build and deploy the staff frontend to Firebase hosting. */
export const staffFrontend: ServiceDefinition = {
  displayName: "Staff Frontend",
  environments: ["staging", "demo", "production"],
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
  },
};
