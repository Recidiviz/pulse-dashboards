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
    noteLine("Offender was convicted of", form?.currentOffenses),
    noteLine("Sex offense history:", form?.sexOffenseInformation),
    noteLine("Alcohol use and drug history:", form?.alcoholDrugInformation),
    noteLine("Employment history:", form?.employmentInformation),
    noteLine("Fee history:", form?.feeHistory),
    noteLine("Special conditions:", form?.specialConditions),
    noteLine("Revocation hearings:", form?.revocationHearings),
    noteLine(
      "New misdemeanor or felony offenses while on supervision:",
      form?.newOffenses
    ),
    noteLine(
      "History of prior violence, escape, bond jumping, etc:",
      form?.historyOfPriorViolenceEtc
    ),
    noteLine(
      "Medical or psychological history:",
      form?.medicalPsychologicalHistory
    ),
    noteLine("Gang affiliation:", form?.gangAffiliation),
    noteLine("Transfer history:", form?.transferHistory),
    noteLine(
      "Victim name and concerns for future contact with victims:",
      form?.victimInformation
    ),
    noteLine("Voter Rights Restoration:", form?.votersRightsInformation),
    noteLine("Last known address:", form?.address),
    noteLine("Additional notes:", form?.additionalNotes),
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
