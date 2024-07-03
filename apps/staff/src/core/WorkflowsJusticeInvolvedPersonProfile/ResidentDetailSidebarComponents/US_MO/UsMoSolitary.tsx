// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { formatWorkflowsDate } from "../../../../utils";
import { UsMoSolitaryAssignmentInfoPastYear } from "../../../../WorkflowsStore/Opportunity/UsMo";
import { Resident } from "../../../../WorkflowsStore/Resident";
import {
  DetailsHeading,
  DetailsSubheading,
  SecureDetailsContent,
  SecureDetailsList,
} from "../../styles";

export function UsMoSolitary({
  person,
}: {
  person: Resident;
}): React.ReactElement | null {
  const { metadata } = person;

  if (metadata.stateCode !== "US_MO") return null;

  const { solitaryAssignmentInfoPastYear, numSolitaryAssignmentsPastYear } =
    metadata;

  const SOLITARY_CONFINEMENT_DATE_COPY = (
    solitaryStartDate: UsMoSolitaryAssignmentInfoPastYear["startDate"],
    solitaryEndDate: UsMoSolitaryAssignmentInfoPastYear["endDate"],
  ) => {
    const startDateText = solitaryStartDate
      ? formatWorkflowsDate(new Date(solitaryStartDate))
      : "START DATE UNAVAILABLE";
    const endDateText =
      solitaryEndDate !== null
        ? formatWorkflowsDate(new Date(solitaryEndDate))
        : "Present";
    return `${startDateText} - ${endDateText}`;
  };

  return (
    <SecureDetailsList>
      <DetailsHeading>Restrictive Housing assignments</DetailsHeading>
      <DetailsSubheading>
        Restrictive Housing assignments in past year
      </DetailsSubheading>
      {solitaryAssignmentInfoPastYear &&
      solitaryAssignmentInfoPastYear.length > 0 ? (
        solitaryAssignmentInfoPastYear.map(
          ({ startDate, endDate }: UsMoSolitaryAssignmentInfoPastYear) => {
            return (
              <SecureDetailsContent key={`${startDate}${endDate}`}>
                {SOLITARY_CONFINEMENT_DATE_COPY(startDate, endDate)}
              </SecureDetailsContent>
            );
          },
        )
      ) : (
        <SecureDetailsContent>None</SecureDetailsContent>
      )}
      <DetailsSubheading>
        Number of Restrictive Housing assignments in past year
      </DetailsSubheading>
      <SecureDetailsContent>
        {numSolitaryAssignmentsPastYear}
      </SecureDetailsContent>
    </SecureDetailsList>
  );
}
