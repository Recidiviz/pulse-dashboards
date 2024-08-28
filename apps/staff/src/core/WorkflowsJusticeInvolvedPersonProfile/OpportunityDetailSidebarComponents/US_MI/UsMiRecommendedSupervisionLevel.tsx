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

import {
  UsMiClassificationReviewOpportunity,
  UsMiClassificationReviewReferralRecord,
} from "../../../../WorkflowsStore/Opportunity/UsMi/UsMiClassificationReviewOpportunity";
import {
  DetailsHeading,
  DetailsSection,
  SecureDetailsContent,
  Separator,
} from "../../styles";
import { OpportunityProfileProps } from "../../types";

export function UsMiRecommendedSupervisionLevel({
  opportunity,
}: OpportunityProfileProps): React.ReactElement | null {
  if (!(opportunity instanceof UsMiClassificationReviewOpportunity)) {
    return null;
  }
  const opportunityRecord =
    opportunity.record as UsMiClassificationReviewReferralRecord;
  if (!opportunityRecord) return null;

  const {
    metadata: { recommendedSupervisionLevel },
  } = opportunityRecord;

  if (!recommendedSupervisionLevel) return null;

  return (
    <DetailsSection>
      <DetailsHeading>
        Recommended Supervision Level <Separator> • </Separator>
        {recommendedSupervisionLevel}
      </DetailsHeading>
      <SecureDetailsContent>
        Client is eligible for a classification review based on their
        supervision start date and last classification review date.
      </SecureDetailsContent>
    </DetailsSection>
  );
}
