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

import { UsTnExpirationDraftData } from "../../../../../WorkflowsStore/Opportunity/UsTnExpirationReferralRecord";
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
  Offender was convicted of offense
  Sex offense history: N/A
  Alcohol use and drug history: N/A
  Employment history: N/A
  Fee history: N/A
  Special conditions: N/A
  Revocation hearings: N/A
  New misdemeanor or felony offenses while on supervision: N/A
  History of prior violence, escape, bond jumping, etc: N/A
  Medical or psychological history: N/A
  Gang affiliation: N/A
  Transfer history: N/A
  Victim name and concerns for future contact with victims: N/A
  Voter Rights Restoration: N/A
  Last Known Address: N/A`);
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
    expect(line.length).toBeLessThanOrEqual(charsPerLine)
  );
});
