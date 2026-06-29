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
 * Deploy the JII Texting backend services (import, migration, processor, server) via atmos.
 * Docker images are built in GitHub Actions; the verification step ensures they exist.
 */
export const jiiTexting: ServiceDefinition = {
  displayName: "JII Texting Backend Services",
  environments: ["staging", "demo", "production"],
  defaultChecked: ["staging", "production"],
  requiredImages: (env) => [
    "@jii-texting/server",
    "@jii-texting/processor",
    "@jii-texting/import",
    ...(env === "demo" ? ["@jii-texting/seed-demo"] : []),
  ],
  async deploy(plan) {
    const { env, currentRevision } = plan;

    // Deploy the import, migration, processor, and server infrastructure changes for the applicable environment
    const stack = dashboardStack(env, "jii-texting");

    // TODO(#7617) Check if ETL Cloud Run Job is running before DB migration
    await $`yarn atmos:apply apps/jii-texting -s ${stack} -- -auto-approve \
        -var server_container_version=${currentRevision} \
        -var migrate_db_container_version=${currentRevision} \
        -var processor_container_version=${currentRevision} \
        -var import_container_version=${currentRevision}`.pipe(process.stdout);

    if (env === "demo") {
      await $`yarn atmos:apply seed-demo -s recidiviz-dashboard-staging--jii-texting-demo -- -auto-approve`.pipe(
        process.stdout,
      );
    }
  },
};
