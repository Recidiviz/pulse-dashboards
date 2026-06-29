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
 * Deploy the Case Notes server via atmos. Docker images are built in GitHub Actions; the
 * verification step ensures they exist.
 */
export const caseNotes: ServiceDefinition = {
  displayName: "Case Notes Server",
  environments: ["staging", "demo", "production"],
  requiredImages: () => ["case-notes-server"],
  async deploy(plan) {
    const { env, currentRevision } = plan;

    // Deploy the import, migration, and server infrastructure changes for the applicable environment
    const stack = dashboardStack(env, "case-notes");

    await $`yarn atmos:apply apps/case-notes -s ${stack} -- -auto-approve \
        -var server_container_version=${currentRevision}`.pipe(process.stdout);
  },
};
