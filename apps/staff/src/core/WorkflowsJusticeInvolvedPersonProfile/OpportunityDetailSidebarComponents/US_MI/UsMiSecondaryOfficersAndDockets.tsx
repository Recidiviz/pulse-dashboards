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
import styled from "styled-components/macro";

import { formatWorkflowsDate } from "../../../../utils/formatStrings";
import {
  UsMiEarlyDischargeOpportunity,
  UsMiEarlyDischargeReferralRecord,
  UsMiPastFTRDOpportunity,
  UsMiPastFTRDReferralRecord,
} from "../../../../WorkflowsStore/Opportunity/UsMi";
import {
  DetailsHeading,
  DetailsList,
  DetailsSection,
  DetailsSubheading,
  SecureDetailsContent,
} from "../../styles";
import { OpportunityProfileProps } from "../../types";

const DocketContainer = styled.div`
  &:not(:last-child) {
    margin-bottom: 2em;
  }
`;

export function UsMiSecondaryOfficersAndDockets({
  opportunity,
}: OpportunityProfileProps): React.ReactElement | null {
  if (
    !(
      opportunity instanceof UsMiEarlyDischargeOpportunity ||
      opportunity instanceof UsMiPastFTRDOpportunity
    )
  ) {
    return null;
  }
  const opportunityRecord = opportunity.record as
    | UsMiEarlyDischargeReferralRecord
    | UsMiPastFTRDReferralRecord;
  if (!opportunityRecord) return null;

  const {
    metadata: { officers, dockets },
  } = opportunityRecord;

  if (officers.length === 0 && dockets.length === 0) {
    return null;
  }

  return (
    <DetailsSection>
      {officers.length > 0 && (
        <>
          <DetailsHeading>Secondary Officers</DetailsHeading>
          <SecureDetailsContent>{officers.join(", ")}</SecureDetailsContent>
        </>
      )}
      {dockets.length > 0 && (
        <>
          <DetailsHeading>Dockets</DetailsHeading>
          <SecureDetailsContent>
            {dockets.map((docket) => (
              <DocketContainer key={docket.docketNumber}>
                <DetailsList>
                  <DetailsSubheading>{docket.legalOrderType}</DetailsSubheading>
                  <SecureDetailsContent>
                    {docket.docketNumber}
                  </SecureDetailsContent>

                  <DetailsSubheading>Jurisdiction</DetailsSubheading>
                  <SecureDetailsContent>
                    {docket.issueLocation}
                  </SecureDetailsContent>

                  <DetailsSubheading>Effective Date</DetailsSubheading>
                  <SecureDetailsContent>
                    {formatWorkflowsDate(docket.legalOrderEffectiveDate)}
                  </SecureDetailsContent>

                  <DetailsSubheading>Expiration Date</DetailsSubheading>
                  <SecureDetailsContent>
                    {formatWorkflowsDate(docket.legalOrderExpirationDate)}
                  </SecureDetailsContent>
                </DetailsList>
              </DocketContainer>
            ))}
          </SecureDetailsContent>
        </>
      )}
    </DetailsSection>
  );
}
