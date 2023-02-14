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
import wrap from "word-wrap";

import { UsTnExpirationDraftData } from "../../../../WorkflowsStore/Opportunity/UsTnExpirationReferralRecord";

function orNA(contents: string | undefined): string {
  return contents === "" || contents === undefined ? "N/A" : contents;
}

function noteLine(prefix: string, fieldValue: string | undefined): string {
  return `${prefix} ${orNA(fieldValue)}`;
}

const tepeTemplate = (form?: Partial<UsTnExpirationDraftData>): string => {
  const lines = [
    noteLine("Subject expired his/her probation on", form?.expirationDate),
    `Offender appeared in ${orNA(form?.convictionCounties)} on case ${orNA(
      form?.docketNumbers
    )}`,
    noteLine("Offender currently serving sentences for", form?.currentOffenses),
    noteLine("SEX OFFENSE HISTORY:", form?.sexOffenseInformation),
    noteLine("ALCOHOL USE / DRUG HISTORY:", form?.alcoholDrugInformation),
    noteLine("EMPLOYMENT HISTORY:", form?.employmentInformation),
    noteLine("FEE HISTORY:", form?.feeHistory),
    noteLine("SPECIAL CONDITIONS:", form?.specialConditions),
    noteLine("REVOCATION HEARINGS:", form?.revocationHearings),
    noteLine(
      "NEW MISDEAMEANOR OR FELONY OFFENSES WHILE ON SUPERVISION:",
      form?.newOffenses
    ),
    noteLine(
      "HISTORY OF PRIOR VIOLENCE, ESCAPE, BOND JUMPING, ETC:",
      form?.historyOfPriorViolenceEtc
    ),
    noteLine(
      "MEDICAL OR PSYCHOLOGICAL HISTORY:",
      form?.medicalPsychologicalHistory
    ),
    noteLine("GANG AFFILIATION:", form?.gangAffiliation),
    noteLine("TRANSFER INFORMATION:", form?.transferHistory),
    noteLine("VICTIM INFORMATION:", form?.victimInformation),
    noteLine("VOTERS RIGHTS RESTORATION:", form?.votersRightsInformation),
    noteLine("LAST KNOWN ADDRESS:", form?.address),
    noteLine("ADDITIONAL NOTES:", form?.additionalNotes),
  ];
  return lines.join("\n").replace(/[~`]/g, "");
};

export function charLimitedNote(
  fullText: string,
  charsPerLine: number
): string {
  return wrap(fullText, { width: charsPerLine, indent: "", trim: true });
}

export function paginatedTEPENoteByLine(
  text: string,
  linesPerPage: number
): string[][] {
  const allLines = text.split("\n");
  const note: string[][] = [];
  while (allLines.length > 0) {
    note.push(allLines.splice(0, linesPerPage));
  }
  return note;
}

export function paginateTEPENote(text: string, linesPerPage: number): string[] {
  const noteByLine = paginatedTEPENoteByLine(text, linesPerPage);
  const paginatedTEPENote = noteByLine.map((page: string[]) => page.join("\n"));
  return paginatedTEPENote;
}

export default tepeTemplate;
