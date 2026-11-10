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
  ORDERED_RELEASE_TASK_TYPES,
  RELEASE_TASK_DEFS,
  ReleaseTaskOwnerRole,
  ReleaseTaskType,
} from "~@idaho-th/shared";

describe("release task definitions", () => {
  it("lists the Release-stage checkboxes in PRD precedence order", () => {
    expect(ORDERED_RELEASE_TASK_TYPES).toEqual([
      ReleaseTaskType.RESIDENT_CONFIRMED_FUNDING,
      ReleaseTaskType.FUNDING_SECURED,
      ReleaseTaskType.HOUSING_DATE_REQUESTED,
      ReleaseTaskType.HOUSING_DATE_PROVIDED,
      ReleaseTaskType.BED_CONFIRMED,
      ReleaseTaskType.TRANSPORTATION_SECURED,
      ReleaseTaskType.TRANSPORTATION_INSTRUCTIONS,
    ]);
  });

  it("assigns HP vs CM ownership so status Action Needed flips correctly", () => {
    expect(
      RELEASE_TASK_DEFS[ReleaseTaskType.RESIDENT_CONFIRMED_FUNDING].ownerRole,
    ).toBe(ReleaseTaskOwnerRole.STAFF);
    expect(RELEASE_TASK_DEFS[ReleaseTaskType.FUNDING_SECURED].ownerRole).toBe(
      ReleaseTaskOwnerRole.PROVIDER,
    );
    expect(
      RELEASE_TASK_DEFS[ReleaseTaskType.HOUSING_DATE_REQUESTED].ownerRole,
    ).toBe(ReleaseTaskOwnerRole.STAFF);
    expect(
      RELEASE_TASK_DEFS[ReleaseTaskType.HOUSING_DATE_PROVIDED].ownerRole,
    ).toBe(ReleaseTaskOwnerRole.STAFF);
    expect(RELEASE_TASK_DEFS[ReleaseTaskType.BED_CONFIRMED].ownerRole).toBe(
      ReleaseTaskOwnerRole.PROVIDER,
    );
    expect(
      RELEASE_TASK_DEFS[ReleaseTaskType.TRANSPORTATION_SECURED].ownerRole,
    ).toBe(ReleaseTaskOwnerRole.STAFF);
    expect(
      RELEASE_TASK_DEFS[ReleaseTaskType.TRANSPORTATION_INSTRUCTIONS].ownerRole,
    ).toBe(ReleaseTaskOwnerRole.PROVIDER);
  });

  it("uses PRD checkbox labels", () => {
    expect(
      RELEASE_TASK_DEFS[ReleaseTaskType.RESIDENT_CONFIRMED_FUNDING].label,
    ).toBe("Funding Type Confirmed");
    expect(RELEASE_TASK_DEFS[ReleaseTaskType.FUNDING_SECURED].label).toBe(
      "Confirm Funding Has Been Received",
    );
    expect(
      RELEASE_TASK_DEFS[ReleaseTaskType.HOUSING_DATE_REQUESTED].label,
    ).toBe("Release Date Requested");
    expect(RELEASE_TASK_DEFS[ReleaseTaskType.HOUSING_DATE_PROVIDED].label).toBe(
      "Release Date Provided",
    );
    expect(RELEASE_TASK_DEFS[ReleaseTaskType.BED_CONFIRMED].label).toBe(
      "Bed Confirmed",
    );
    expect(
      RELEASE_TASK_DEFS[ReleaseTaskType.TRANSPORTATION_SECURED].label,
    ).toBe("Transportation Secured");
    expect(
      RELEASE_TASK_DEFS[ReleaseTaskType.TRANSPORTATION_INSTRUCTIONS].label,
    ).toBe("Transportation Instructions");
  });
});
