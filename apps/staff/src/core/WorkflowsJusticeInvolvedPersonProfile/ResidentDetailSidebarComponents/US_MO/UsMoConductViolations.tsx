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

import React from "react";

import { formatWorkflowsDate } from "../../../../utils";
import {
  UsMoConductViolationInfo,
  UsMoConductViolationMetadata,
} from "../../../../WorkflowsStore/Opportunity/UsMo";
import {
  CaseNoteTitle,
  DetailsContent,
  DetailsHeading,
  DetailsList,
  DetailsSection,
  DetailsSubheading,
  SecureDetailsContent,
} from "../../styles";

function UsMoConductViolationsList({
  cdvs,
}: {
  cdvs: UsMoConductViolationInfo[];
}): React.ReactElement {
  return cdvs.length > 0 && cdvs ? (
    <>
      {cdvs.map(({ cdvDate, cdvRule }: UsMoConductViolationInfo) => {
        return (
          <SecureDetailsContent key={cdvRule}>
            <CaseNoteTitle>{cdvRule}:</CaseNoteTitle>{" "}
            {formatWorkflowsDate(cdvDate)}
          </SecureDetailsContent>
        );
      })}
    </>
  ) : (
    <SecureDetailsContent>None</SecureDetailsContent>
  );
}

export function UsMoConductViolations({
  majorCdvs,
  cdvsSinceLastHearing,
  numMinorCdvsBeforeLastHearing,
}: UsMoConductViolationMetadata): React.ReactElement {
  return (
    <DetailsSection>
      <DetailsHeading>Conduct Violations</DetailsHeading>
      <DetailsContent>
        <DetailsList>
          <DetailsSubheading>
            Major Conduct Violations, Past 12 Months
          </DetailsSubheading>
          <UsMoConductViolationsList cdvs={majorCdvs} />
          <DetailsSubheading>
            Conduct Violations, Since Last Hearing
          </DetailsSubheading>
          <UsMoConductViolationsList cdvs={cdvsSinceLastHearing} />
          <DetailsSubheading>
            Minor Conduct Violations, Past 6 Months
          </DetailsSubheading>
          <SecureDetailsContent>
            {numMinorCdvsBeforeLastHearing || "None"}
          </SecureDetailsContent>
        </DetailsList>
      </DetailsContent>
    </DetailsSection>
  );
}
