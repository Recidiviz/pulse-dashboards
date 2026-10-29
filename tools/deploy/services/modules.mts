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

import { dashboardProject, dashboardStack } from "../config.mts";
import { ServiceDefinition } from "../types.mts";

export const modulesBackend: ServiceDefinition = {
  displayName: "Modules Backend Services",
  environments: ["staging"],
  defaultChecked: [],
  pamProjects: (env) => [dashboardProject(env)],
  requiredImages: () => ["@modules/server"],
  async deploy(plan) {
    const { env, currentRevision } = plan;

    const stack = dashboardStack(env, "product-modules");

    await $`yarn atmos:apply apps/product-modules -s ${stack} -- -auto-approve \
        -var server_container_version=${currentRevision} \
        -var migrate_db_container_version=${currentRevision}`.pipe(
      process.stdout,
    );
  },
};
