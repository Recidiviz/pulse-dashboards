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

import { sortBy } from "lodash";
import React from "react";

import {
  formatWorkflowsDate,
  toTitleCase,
} from "../../../../utils/formatStrings";
import { UsMoWorkReleaseOpportunity } from "../../../../WorkflowsStore/Opportunity/UsMo/UsMoWorkReleaseOpportunity/UsMoWorkReleaseOpportunity";
import {
  DetailsContent,
  DetailsHeading,
  DetailsList,
  DetailsSection,
  DetailsSubheading,
  SecureDetailsContent,
} from "../../styles";
import { OpportunityProfileProps } from "../../types";

const UsMoEscapes: React.FC<OpportunityProfileProps> = ({ opportunity }) => {
  if (!(opportunity instanceof UsMoWorkReleaseOpportunity)) return null;

  const historyEscapesAbsconsions = sortBy(
    opportunity.record.formInformation.historyEscapesAbsconsions,
    (e) => -e.eventDate,
  );

  return (
    <DetailsSection>
      <DetailsHeading>Escape and Absconsion History</DetailsHeading>
      <SecureDetailsContent>
        <DetailsList>
          {historyEscapesAbsconsions.length === 0 && "None Noted"}
          {historyEscapesAbsconsions.map(({ eventType, eventDate }) => (
            <React.Fragment>
              {/* No key because we can't guarantee uniqueness */}
              <DetailsSubheading>
                {eventType === "WARRANT_ISSUED"
                  ? "Absconsion Warrant Issued"
                  : toTitleCase(eventType)}
              </DetailsSubheading>
              <DetailsContent>{formatWorkflowsDate(eventDate)}</DetailsContent>
            </React.Fragment>
          ))}
        </DetailsList>
      </SecureDetailsContent>
    </DetailsSection>
  );
};

export default UsMoEscapes;
