// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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
  INTERSTATE_COPY,
  UsMiEarlyDischargeReferralRecord,
} from "../../../../WorkflowsStore/Opportunity/UsMi";
import {
  DetailsBorderedSection,
  DetailsHeading,
  DetailsList,
  SecureDetailsContent,
} from "../../styles";
import { OpportunityProfileProps } from "../../types";

export function UsMiEarlyDischargeIcDetails({
  opportunity,
}: OpportunityProfileProps): React.ReactElement | null {
  const opportunityRecord =
    opportunity.record as UsMiEarlyDischargeReferralRecord;
  if (!opportunityRecord) return null;

  const {
    metadata: { interstateFlag, supervisionType },
  } = opportunityRecord;

  if (!interstateFlag) return null;

  return (
    <DetailsBorderedSection>
      <DetailsHeading>{interstateFlag}</DetailsHeading>
      <DetailsList>
        <SecureDetailsContent>
          {interstateFlag === "IC-IN"
            ? INTERSTATE_COPY[interstateFlag].text
            : INTERSTATE_COPY[interstateFlag][supervisionType].text}
        </SecureDetailsContent>
      </DetailsList>
    </DetailsBorderedSection>
  );
}