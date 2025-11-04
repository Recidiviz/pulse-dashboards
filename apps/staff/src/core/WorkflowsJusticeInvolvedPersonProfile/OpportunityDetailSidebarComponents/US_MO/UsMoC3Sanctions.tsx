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
import { UsMoWorkReleaseOpportunity } from "../../../../WorkflowsStore/Opportunity/UsMo/UsMoWorkReleaseOpportunity/UsMoWorkReleaseOpportunity";
import {
  DetailsContent,
  DetailsHeading,
  DetailsList,
  DetailsSection,
  SecureDetailsContent,
} from "../../styles";
import { OpportunityProfileProps } from "../../types";

const UsMoC3Sanctions: React.FC<OpportunityProfileProps> = ({
  opportunity,
}) => {
  if (!(opportunity instanceof UsMoWorkReleaseOpportunity)) return null;
  if (!opportunity.record) return null;
  const { currentC3Sanctions } = opportunity.record.metadata;

  return (
    <DetailsSection>
      <DetailsHeading>Current C-3 Sanctions</DetailsHeading>
      <SecureDetailsContent>
        {currentC3Sanctions.length === 0 && "None Noted"}
        <DetailsList>
          {currentC3Sanctions.map(({ sanctionStartDate, sanctionEndDate }) => (
            <React.Fragment>
              {/* No key because we can't guarantee uniqueness */}
              <DetailsContent>
                {formatWorkflowsDate(sanctionStartDate)} -
                {formatWorkflowsDate(sanctionEndDate)}
              </DetailsContent>
            </React.Fragment>
          ))}
        </DetailsList>
      </SecureDetailsContent>
    </DetailsSection>
  );
};

export default UsMoC3Sanctions;
