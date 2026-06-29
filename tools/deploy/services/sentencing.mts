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

import { dashboardStack } from "../config.mts";
import type { ServiceDefinition } from "../types.mts";

/**
 * Deploy the Sentencing Assistant backend services (import, migration, server) via atmos.
 * Docker images are built in GitHub Actions; the verification step ensures they exist.
 */
export const sentencing: ServiceDefinition = {
  displayName: "Sentencing Assistant Backend Services",
  environments: ["staging", "demo", "production"],
  defaultChecked: ["staging", "production"],
  requiredImages: (env) => [
    "@sentencing/server",
    "@sentencing/import",
    ...(env === "demo" ? ["@sentencing/seed-demo"] : []),
  ],
  async deploy(plan) {
    const { env, currentRevision } = plan;

    // Deploy any changes to the artifact registry if we're on staging
    if (env === "staging") {
      await $`yarn atmos:apply artifact_registry -s recidiviz-dashboard-${env}--sentencing -- -auto-approve`.pipe(
        process.stdout,
      );
    }

    // Deploy the import, migration, and server infrastructure changes for the applicable environment
    const stack = dashboardStack(env, "sentencing");

    await $`yarn atmos:apply apps/sentencing -s ${stack} -- -auto-approve \
        -var server_container_version=${currentRevision} \
        -var migrate_db_container_version=${currentRevision} \
        -var import_container_version=${currentRevision}`.pipe(process.stdout);

    if (env === "demo") {
      // If we're in demo mode, deploy the seed demo job
      await $`yarn atmos:apply apps/sentencing-seed-demo -s ${stack} -- -auto-approve -var container_version=${currentRevision}`.pipe(
        process.stdout,
      );
    } else if (env === "production") {
      await $`yarn atmos:apply postgres-bq-data-transfer -s recidiviz-dashboard-production--sentencing -- -auto-approve`.pipe(
        process.stdout,
      );
    }
  },
};
