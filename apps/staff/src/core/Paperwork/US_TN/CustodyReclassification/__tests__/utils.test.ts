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

import { Resident } from "../../../../../WorkflowsStore/Resident";
import {
  COVER_SHEET_BLANK,
  COVER_SHEET_CHECKED,
  getCoverSheetTemplateArgs,
} from "../utils";

const resident = { displayName: "Phoenix Lee" } as Resident;

const gatingAnswers = {
  trusteeNotConvictedOfFirstDegreeMurder: "false",
  isServingLife: "true",
  trusteeHas10YearsOrLessRemaining: "false",
  trusteeNotServingForSexualOffense: "false",
  checklistCompletedOnOverride: "Y",
};

const CHECKED = COVER_SHEET_CHECKED;
const BLANK = COVER_SHEET_BLANK;

describe("getCoverSheetTemplateArgs gating questions", () => {
  it("fills the gating placeholders while the rework is off", () => {
    const args = getCoverSheetTemplateArgs(resident, gatingAnswers, false);

    [1, 2, 3, 4].forEach((n) => {
      expect(args[`pq${n}Y`]).toBe(CHECKED);
      expect(args[`pq${n}N`]).toBe(BLANK);
    });
    expect(args.ccY).toBe(CHECKED);
    expect(args.ccN).toBe(BLANK);
    expect(args.ccNA).toBe(BLANK);
  });

  it("defaults to the legacy behavior for callers that pass no flag", () => {
    const omitted = getCoverSheetTemplateArgs(resident, gatingAnswers);

    expect(omitted.pq1Y).toBe(CHECKED);
    expect(omitted.showTrusteeGatingQuestions).toBe(true);
  });

  it("leaves every gating placeholder blank under the rework", () => {
    const args = getCoverSheetTemplateArgs(resident, gatingAnswers, true);

    [1, 2, 3, 4].forEach((n) => {
      expect(args[`pq${n}Y`]).toBe(BLANK);
      expect(args[`pq${n}N`]).toBe(BLANK);
    });
    expect(args.ccY).toBe(BLANK);
    expect(args.ccN).toBe(BLANK);
    expect(args.ccNA).toBe(BLANK);
  });

  it("hides the gating block entirely under the rework", () => {
    expect(
      getCoverSheetTemplateArgs(resident, gatingAnswers, true)
        .showTrusteeGatingQuestions,
    ).toBe(false);

    expect(
      getCoverSheetTemplateArgs(resident, gatingAnswers)
        .showTrusteeGatingQuestions,
    ).toBe(true);
  });

  it("leaves the rest of the cover sheet alone", () => {
    const formData = { ...gatingAnswers, finalizingCounselor: "R. Diaz" };

    expect(getCoverSheetTemplateArgs(resident, formData, true)).toMatchObject({
      residentFullName: "Phoenix Lee",
      finalizingCounselor: "R. Diaz",
    });
  });
});
