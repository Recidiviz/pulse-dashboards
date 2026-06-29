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

// NOTE: Before modularization these two blocks pushed their name to the deployed list
// *before* attempting the load (recording success even on failure), never reset their retry
// flag (so a fail-then-succeed looped forever), and used mismatched display strings. Routing
// them through `deployWithRetry` is a deliberate, documented bugfix: success is recorded only
// when the load actually succeeds, the loop terminates, and each uses one clean display name.

/** Refresh the production Opportunities test-data fixtures. */
export const oppsTestData: ServiceDefinition = {
  displayName: "Opportunities test data",
  environments: ["production"],
  async deploy() {
    await $`nx load-demo-fixtures staff -c production`.pipe(process.stdout);
  },
};

/** Load the demo fixtures (staging-configured) for a demo deploy. */
export const demoFixtures: ServiceDefinition = {
  displayName: "Demo fixtures",
  environments: ["demo"],
  async deploy() {
    await $`nx load-demo-fixtures staff -c staging`.pipe(process.stdout);
  },
};
