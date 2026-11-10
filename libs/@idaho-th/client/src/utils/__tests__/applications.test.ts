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

import { APPLICATION_STAGE, APPLICATION_SUB_STAGE } from "~@idaho-th/shared";

import { getSubStageLabel } from "../applications";

describe("getSubStageLabel", () => {
  it("shows release task progress for the Release stage (dashboard annotation)", () => {
    expect(
      getSubStageLabel({
        stage: APPLICATION_STAGE.RELEASE,
        releaseTaskProgress: { completedCount: 2, totalCount: 5 },
      }),
    ).toBe("2 of 5 Tasks Complete");
  });

  it("uses the detailed suffix for modal / home-plan contexts", () => {
    expect(
      getSubStageLabel(
        {
          stage: APPLICATION_STAGE.RELEASE,
          releaseTaskProgress: { completedCount: 0, totalCount: 5 },
        },
        "detailed",
      ),
    ).toBe("0 of 5 Release Tasks Complete");
  });

  it("defaults progress counts to zero when releaseTaskProgress is missing", () => {
    expect(
      getSubStageLabel({
        stage: APPLICATION_STAGE.RELEASE,
      }),
    ).toBe("0 of 0 Tasks Complete");
  });

  it("returns an empty string when non-release stages have no sub-stage", () => {
    expect(
      getSubStageLabel({
        stage: APPLICATION_STAGE.APPLICATION,
      }),
    ).toBe("");
  });

  it("maps Application and Closed sub-stages to their PRD labels", () => {
    expect(
      getSubStageLabel({
        stage: APPLICATION_STAGE.APPLICATION,
        subStage: APPLICATION_SUB_STAGE.OFFERS_RECEIVED,
      }),
    ).toBe("Offers Received");

    expect(
      getSubStageLabel({
        stage: APPLICATION_STAGE.CLOSED,
        subStage: APPLICATION_SUB_STAGE.PLAN_REJECTED,
      }),
    ).toBe("Plan Rejected");
  });
});
