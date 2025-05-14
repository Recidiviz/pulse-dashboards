// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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
import { UsNeSupervisionDowngradeOpportunity } from "../../../../WorkflowsStore/Opportunity/UsNe";
import {
  DetailsHeading,
  DetailsList,
  DetailsSection,
  DetailsSubheading,
  SecureDetailsContent,
} from "../../styles";
import { OpportunityProfileProps } from "../../types";

export const UsNeORASScores: React.FC<OpportunityProfileProps> = ({
  opportunity,
}) => {
  if (!(opportunity instanceof UsNeSupervisionDowngradeOpportunity)) {
    return null;
  }

  const scores = opportunity.record.metadata.recentOrasScores;

  return (
    <DetailsSection>
      <DetailsHeading>Recent ORAS Scores</DetailsHeading>
      <SecureDetailsContent>
        <DetailsList>
          {scores.map(({ assessmentDate, assessmentLevel }) => (
            <React.Fragment key={assessmentDate.toString()}>
              <DetailsSubheading>
                {formatWorkflowsDate(assessmentDate)}
              </DetailsSubheading>
              <SecureDetailsContent>{assessmentLevel}</SecureDetailsContent>
            </React.Fragment>
          ))}
        </DetailsList>
      </SecureDetailsContent>
    </DetailsSection>
  );
};
