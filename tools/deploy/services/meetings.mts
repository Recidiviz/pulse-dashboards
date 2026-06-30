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
 * Deploy the Meetings backend services (import, migration, server, artifact cleanup, seed
 * demo) via atmos. Docker images are built in GitHub Actions; the verification step ensures
 * they exist.
 */
export const meetingsBackend: ServiceDefinition = {
  displayName: "Meetings Backend Services",
  environments: ["staging", "production"],
  requiredImages: () => [
    "@meetings/server",
    "@meetings/import",
    "@meetings/seed-demo",
  ],
  async deploy(plan) {
    const { env, currentRevision } = plan;

    // Deploy any changes to the artifact registry if we're on staging
    if (env === "staging") {
      await $`yarn atmos:apply artifact_registry -s recidiviz-dashboard-${env}--meetings -- -auto-approve`.pipe(
        process.stdout,
      );
    }

    // Deploy the import, migration, and server infrastructure changes for the applicable environment
    const stack = dashboardStack(env, "meetings");

    await $`yarn atmos:apply apps/meetings -s ${stack} -- -auto-approve \
        -var server_container_version=${currentRevision} \
        -var artifact_cleanup_container_version=${currentRevision} \
        -var migrate_db_container_version=${currentRevision} \
        -var import_container_version=${currentRevision} \
        -var seed_demo_container_version=${currentRevision}`.pipe(
      process.stdout,
    );

    // Sync the Postgres -> BQ transfer; runs after apps/meetings since it reads that component's state.
    await $`yarn atmos:apply postgres-bq-data-transfer -s ${stack} -- -auto-approve`.pipe(
      process.stdout,
    );
  },
};

/** Deploy the Meetings frontend (Expo web). */
export const meetingsFrontend: ServiceDefinition = {
  displayName: "Meetings Frontend",
  environments: ["staging", "production"],
  async deploy(plan) {
    // Remove .env.local if it exists, as it interferes with the deploy target
    await $`rm -f apps/@meetings/app/.env.local`.pipe(process.stdout);

    await $`nx deploy:web @meetings/app --configuration ${plan.env}`.pipe(
      process.stdout,
    );
  },
};
