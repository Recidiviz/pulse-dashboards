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
import wrap from "word-wrap";

import { UsTnExpirationDraftData } from "../../../../WorkflowsStore/Opportunity/UsTnExpirationReferralRecord";

const tepeTemplate = (form?: Partial<UsTnExpirationDraftData>): string => {
  const fullNote = dedent`
  Offender expired his/her probation on ${form?.expirationDate ?? "N/A"}
  Offender plead guilty to ${form?.currentOffenses ?? "N/A"}
  Offender appeared in ${form?.convictionCounties ?? "N/A"} on case ${
    form?.docketNumbers ?? "N/A"
  }
  Any Sex Offense History: \n${form?.sexOffenseInformation ?? "N/A"}
  Last Known Address: ${form?.address ?? "N/A"}
  Employment History: \n${form?.employmentInformation ?? "N/A"}
  Fee History: \n${form?.feeHistory ?? "N/A"}
  Special Conditions: \n${form?.specialConditions ?? "N/A"}
  Voter Rights Restoration: ${form?.votersRightsInformation ?? "N/A"}`;

  return fullNote.replace(/[~`]/g, "");
};

export function charLimitedNote(
  fullText: string,
  charsPerLine: number
): string {
  return wrap(fullText, { width: charsPerLine, indent: "", trim: true });
}

export function paginateTEPENote(text: string, linesPerPage: number): string[] {
  const allLines = text.split("\n");
  const paginatedTEPENoteByLine: string[][] = [];
  while (allLines.length > 0) {
    paginatedTEPENoteByLine.push(allLines.splice(0, linesPerPage));
  }
  const paginatedTEPENote = paginatedTEPENoteByLine.map((page: string[]) =>
    page.join("\n")
  );
  return paginatedTEPENote;
}

export default tepeTemplate;
