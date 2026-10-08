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

import { CheckInQuestionInfo } from "./usNeCheckInToolSchema";
import { getVisibleQuestions } from "./usNeCheckInUtils";

describe("getVisibleQuestions", () => {
  const idsFrom = (info: CheckInQuestionInfo[]) =>
    info.map(({ questionId }) => questionId);

  it("correctly handles radio conditions", () => {
    expect(idsFrom(getVisibleQuestions({}))).not.toInclude(
      "HOUSING_BACKUP_PLAN_DESCRIPTION",
    );
    expect(
      idsFrom(getVisibleQuestions({ HOUSING_BACKUP_PLAN: "NO" })),
    ).not.toInclude("HOUSING_BACKUP_PLAN_DESCRIPTION");

    expect(
      idsFrom(getVisibleQuestions({ HOUSING_BACKUP_PLAN: "YES" })),
    ).toInclude("HOUSING_BACKUP_PLAN_DESCRIPTION");
  });

  it("correctly handles checkbox conditions", () => {
    expect(idsFrom(getVisibleQuestions({}))).not.toInclude(
      "WELLNESS_SUPPORT_OTHER",
    );
    expect(
      idsFrom(
        getVisibleQuestions({
          WELLNESS_SUPPORT: ["SUPPORT_GROUP", "COUNSELOR"],
        }),
      ),
    ).not.toInclude("WELLNESS_SUPPORT_OTHER");

    expect(
      idsFrom(getVisibleQuestions({ WELLNESS_SUPPORT: ["OTHER"] })),
    ).toInclude("WELLNESS_SUPPORT_OTHER");
    expect(
      idsFrom(
        getVisibleQuestions({ WELLNESS_SUPPORT: ["SUPPORT_GROUP", "OTHER"] }),
      ),
    ).toInclude("WELLNESS_SUPPORT_OTHER");
  });
});
