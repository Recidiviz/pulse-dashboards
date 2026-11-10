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

import { describe, expect, it } from "vitest";

import { getDecisionField } from "../ApprovalsPanel.utils";

describe("getDecisionField", () => {
  it("attributes a save to the release decision when one was sent", () => {
    expect(getDecisionField({ releaseDecision: "PROBATION_GRANTED" })).toBe(
      "releaseDecision",
    );
  });

  it("attributes a save to the investigation when no release decision was sent", () => {
    expect(getDecisionField({ homePlanInvestigation: "APPROVED" })).toBe(
      "homePlanInvestigation",
    );
  });

  it("attributes an empty save to the investigation", () => {
    expect(getDecisionField({})).toBe("homePlanInvestigation");
  });

  it("prefers the release decision when a save carries both", () => {
    expect(
      getDecisionField({
        releaseDecision: "PROBATION_GRANTED",
        homePlanInvestigation: "APPROVED",
      }),
    ).toBe("releaseDecision");
  });
});
