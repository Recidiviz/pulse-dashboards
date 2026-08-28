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

import { AgencyConfig } from "~@meetings/config/types";

import { assigneeToConfigLabel } from "./assigneeToConfigLabel";

describe("assigneeToConfigLabel", () => {
  const agencyConfig = {
    labels: {
      client: "Client Label",
      resident: "Resident Label",
      supervisionStaff: "Supervision Staff Label",
      facilitiesStaff: "Facilities Staff Label",
    },
  } as AgencyConfig;

  it("returns the correct label for client", () => {
    expect(assigneeToConfigLabel(agencyConfig, "client", "client")).toBe(
      "Client Label",
    );
  });

  it("returns the correct label for resident", () => {
    expect(assigneeToConfigLabel(agencyConfig, "client", "resident")).toBe(
      "Resident Label",
    );
  });

  it("returns the supervision staff label when the meeting is with a client", () => {
    expect(assigneeToConfigLabel(agencyConfig, "staff member", "client")).toBe(
      "Supervision Staff Label",
    );
  });

  it("returns the facilities staff label when the meeting is with a resident", () => {
    expect(
      assigneeToConfigLabel(agencyConfig, "staff member", "resident"),
    ).toBe("Facilities Staff Label");
  });

  it("returns the assignee if no matching label is found", () => {
    expect(assigneeToConfigLabel(agencyConfig, "unknown", "client")).toBe(
      "unknown",
    );
  });

  it("returns the assignee if agencyConfig.labels is undefined", () => {
    const agencyConfigWithoutLabels = {} as AgencyConfig;
    expect(
      assigneeToConfigLabel(agencyConfigWithoutLabels, "client", "client"),
    ).toBe("client");
  });
});
