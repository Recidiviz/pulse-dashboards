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

import { CommunityReentryPlanInput } from "~datatypes";

import { resolveCommunityReentryPlan } from "../communityReentryPlan";

const EDITED_AT = new Date("2026-11-12T15:00:00Z");

const phiEdit = <T>(value: T | null) => ({
  value,
  updatedBy: "phi@us_id.gov",
  updatedAt: EDITED_AT,
});

const NOT_ENTERED = {
  value: null,
  source: "ATLAS",
  atlasValue: null,
  editedBy: null,
  editedAt: null,
};

// The schema's own type, so a schema change that no longer fits the config
// fails the type check here.
const input = (
  fields: NonNullable<CommunityReentryPlanInput["fields"]>,
): CommunityReentryPlanInput => ({ fields });

describe("resolveCommunityReentryPlan", () => {
  it("shows every box empty before the PHI writes anything", () => {
    expect(resolveCommunityReentryPlan(undefined)).toEqual({
      fields: {
        housing: NOT_ENTERED,
        employment: NOT_ENTERED,
        aftercare: NOT_ENTERED,
        transportation: NOT_ENTERED,
        supportNetwork: NOT_ENTERED,
      },
      rows: [],
    });
    expect(resolveCommunityReentryPlan({})).toEqual(
      resolveCommunityReentryPlan(undefined),
    );
  });

  it("shows the PHI's text in its box, with who wrote it, and leaves the rest empty", () => {
    const { fields } = resolveCommunityReentryPlan(
      input({ housing: phiEdit("Plans to live with a sibling.") }),
    );

    expect(fields.housing).toEqual({
      value: "Plans to live with a sibling.",
      source: "PHI",
      atlasValue: null,
      editedBy: "phi@us_id.gov",
      editedAt: EDITED_AT,
    });
    expect(fields.employment).toEqual(NOT_ENTERED);
    expect(fields.supportNetwork).toEqual(NOT_ENTERED);
  });

  it("shows a box the PHI emptied as null, marked as theirs", () => {
    const { fields } = resolveCommunityReentryPlan(
      input({ transportation: phiEdit(null) }),
    );

    expect(fields.transportation.value).toBeNull();
    expect(fields.transportation.source).toBe("PHI");
  });
});
