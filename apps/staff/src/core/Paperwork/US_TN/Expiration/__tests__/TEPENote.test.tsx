// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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

import dedent from "dedent";

import { UsTnExpirationDraftData } from "../../../../../WorkflowsStore/Opportunity/UsTn";
import tepeTemplate, { charLimitedNote } from "../TEPENote";

test("TEPE with invalid characters", () => {
  const formWithError: Partial<UsTnExpirationDraftData> = {
    currentOffenses: "~offense`",
    convictionCounties: "county A",
  };

  const tepeForm = tepeTemplate(formWithError);
  expect(tepeForm).toEqual(dedent`
  Subject expired his/her probation on N/A
  Offender appeared in county A on case N/A
  Offender currently serving sentences for offense
  SEX OFFENSE HISTORY: N/A
  ALCOHOL USE / DRUG HISTORY: N/A
  EMPLOYMENT HISTORY: N/A
  FEE HISTORY: N/A
  SPECIAL CONDITIONS: N/A
  REVOCATION HEARINGS: N/A
  NEW MISDEAMEANOR OR FELONY OFFENSES WHILE ON SUPERVISION: N/A
  HISTORY OF PRIOR VIOLENCE, ESCAPE, BOND JUMPING, ETC: N/A
  MEDICAL OR PSYCHOLOGICAL HISTORY: N/A
  GANG AFFILIATION: N/A
  TRANSFER INFORMATION: N/A
  VICTIM INFORMATION: N/A
  VOTERS RIGHTS RESTORATION: N/A
  LAST KNOWN ADDRESS: N/A
  ADDITIONAL NOTES: N/A`);
});

test("Ensure note is char limited", () => {
  const form: Partial<UsTnExpirationDraftData> = {
    specialConditions:
      "OPEN TEXT FOR SPECIAL CONDITIONS, OPEN TEXT FOR SPECIAL CONDITIONS, OPEN TEXT FOR SPECIAL CONDITIONS, OPEN TEXT FOR SPECIAL CONDITIONS",
  };

  const tepeForm = tepeTemplate(form);
  const charsPerLine = 70;

  const charLimitedForm = charLimitedNote(tepeForm, charsPerLine);
  const formByLine = charLimitedForm.split("\n");

  formByLine.forEach((line) =>
    expect(line.length).toBeLessThanOrEqual(charsPerLine),
  );
});
