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

import { Row } from "@tanstack/react-table";

import { OpportunityType } from "~datatypes";

import { formatWorkflowsDate } from "../../../utils";
import {
  Client,
  JusticeInvolvedPerson,
  Opportunity,
} from "../../../WorkflowsStore";
import { Resident } from "../../../WorkflowsStore/Resident";
import { getPersonReleaseDate } from "../../../WorkflowsStore/utils";
import { PersonIdCell, PersonNameCell } from "../../CaseloadTable";

export type ClientsResidentsTableColumnId =
  | "name"
  | "id"
  | "date"
  | "assignedTo"
  | "supervisionType"
  | "level";

export const US_TN_CLASSIFICATION_OPPORTUNITIES = [
  "usTnInitialClassification2026Policy",
  "usTnAnnualReclassification2026Policy",
  "usTnCustodyLevelDowngrade2026Policy",
  "usTnSpecialCustodyLevelUpgrade2026Policy",
  "usTnAnnualReclassification2026PolicyV2",
  "usTnCustodyLevelDowngrade2026PolicyV2",
  "usTnSpecialCustodyLevelUpgrade2026PolicyV2",
  "usTnTrusteeTransfer",
  "usTnBiannualOther",
  "usTnSeriousMisconductUpgrade",
  "usTnTrusteeTransferV2",
  "usTnBiannualOtherV2",
  "usTnSeriousMisconductUpgradeV2",
] satisfies OpportunityType[];

export function usTnPrioritizedOpportunity(
  resident: Resident,
): Opportunity | undefined {
  const { opportunities } = resident;

  const relevantOpps = US_TN_CLASSIFICATION_OPPORTUNITIES.map((oppType) => {
    return opportunities[oppType]?.[0];
  }).filter((x) => x !== undefined);

  // Given how these opportunities overlap, we expect users
  // to only have someone be in progress for at most one opportunity
  const inProgress = relevantOpps.find((opp) => opp.isSubmitted);

  if (inProgress) {
    return inProgress;
  }

  // The queries are written such that someone will be eligible
  // for at most one of these four opportunities
  return relevantOpps.find((opp) => opp.isEligible);
}

export type CaseloadPersonRowProps<
  Person extends JusticeInvolvedPerson = JusticeInvolvedPerson,
> = {
  row: Row<Person>;
};

export function PersonNameWrapper<Person extends JusticeInvolvedPerson>({
  row,
}: CaseloadPersonRowProps<Person>) {
  return <PersonNameCell person={row.original} />;
}

export function PersonIdCellWrapper<Person extends JusticeInvolvedPerson>({
  row,
}: CaseloadPersonRowProps<Person>) {
  return <PersonIdCell person={row.original} />;
}

export function PersonDateCell<Person extends JusticeInvolvedPerson>({
  row,
}: CaseloadPersonRowProps<Person>) {
  const person = row.original;
  if (person instanceof Resident && person.onLifeSentence) {
    return "Serving a life sentence";
  }

  const date = getPersonReleaseDate(person);
  return date ? formatWorkflowsDate(date) : "Unknown";
}

export function nameSortValue(person: JusticeInvolvedPerson): string {
  return [person.fullName.surname, person.fullName.givenNames, person.displayId]
    .filter(Boolean)
    .join(", ");
}

export function personSupervisionType(person: JusticeInvolvedPerson): string {
  if (!(person instanceof Client)) return "";
  return person.supervisionType;
}

export function personLevel(person: JusticeInvolvedPerson): string {
  if (person instanceof Client) return person.supervisionLevel;
  if (person instanceof Resident) return person.displayCustodyLevel;
  return "";
}

export function sortDisplayIds(
  rowA: Row<JusticeInvolvedPerson>,
  rowB: Row<JusticeInvolvedPerson>,
): number {
  return rowA.original.displayId.localeCompare(
    rowB.original.displayId,
    undefined,
    { numeric: true },
  );
}

export function sortOptionalDates(
  rowA: Row<JusticeInvolvedPerson>,
  rowB: Row<JusticeInvolvedPerson>,
  columnId: string,
): number {
  const dateA = rowA.getValue<Date | undefined>(columnId);
  const dateB = rowB.getValue<Date | undefined>(columnId);

  if (!dateA && !dateB) return 0;
  if (!dateA) return 1;
  if (!dateB) return -1;
  return dateA.getTime() - dateB.getTime();
}
