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

import { rawAllResidents } from "./fixtures";
import { rawAllResidentCommon } from "./residentCommonSchemaFixtures";

/**
 * The dev seed reads from rawAllResidentCommon. Any state that has Workflows
 * fixtures (rawAllResidents) will also be served via the Prisma/tRPC path in
 * development (all_user_flags_enabled grants useNewResidentData to all dev
 * users), so it must also be registered here. If it is not, the seed logs
 * "Skipping... no fixtures available" and moves on without error, leaving the
 * DB empty for that state.
 */
test("rawAllResidentCommon covers every state present in rawAllResidents", () => {
  const seededStates = new Set(rawAllResidentCommon.map((r) => r.stateCode));
  const workflowsStates = new Set(rawAllResidents.map((r) => r.stateCode));

  for (const stateCode of workflowsStates) {
    expect(seededStates).toContain(stateCode);
  }
});
