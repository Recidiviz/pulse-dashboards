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

import { dashboardProject } from "../config.mts";
import type { ServiceDefinition } from "../types.mts";

/**
 * Deploy the Firestore security rules in libs/firestore-config to the dashboard backend project.
 * Demo is excluded because it shares the staging backend, so a demo deploy would overwrite the
 * staging rules.
 */
export const firestoreRules: ServiceDefinition = {
  displayName: "Firestore rules",
  environments: ["staging", "production"],
  pamProjects: (env) => [dashboardProject(env)],
  async deploy(plan) {
    await $`nx update-rules-${plan.env} firestore-config`.pipe(process.stdout);
  },
};
