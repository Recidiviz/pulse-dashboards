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

import {
  CLOSE_APPLICATION_REASONS,
  REASON_TO_CLOSED_OUTCOME,
} from "~@idaho-th/shared";

describe("close application reasons", () => {
  it("exposes every Closed-stage popup option from the PRD", () => {
    expect(CLOSE_APPLICATION_REASONS.map((r) => r.value)).toEqual([
      "client_released",
      "application_withdrawn",
      "release_denied",
      "housing_plan_rejected",
      "other",
    ]);
  });

  it("maps every reason to a ClosedOutcome", () => {
    CLOSE_APPLICATION_REASONS.forEach((r) =>
      expect(REASON_TO_CLOSED_OUTCOME[r.value]).toBeDefined(),
    );
  });
});
