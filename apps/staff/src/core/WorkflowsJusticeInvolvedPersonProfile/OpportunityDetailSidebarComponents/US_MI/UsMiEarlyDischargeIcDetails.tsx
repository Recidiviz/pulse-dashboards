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
  UsMiEarlyDischargeOpportunity,
  UsMiEarlyDischargeReferralRecord,
} from "../../../../WorkflowsStore/Opportunity/UsMi";
import {
  DetailsBorderedSection,
  DetailsHeading,
  DetailsList,
  SecureDetailsContent,
} from "../../styles";
import { OpportunityProfileProps } from "../../types";

const INTERSTATE_COPY = {
  "IC-IN": {
    text: "This client appears to be eligible for early discharge. Please review the client's eligibility status and send an early discharge request to the sending state via ICOTS.",
  },
  "IC-OUT": {
    Parole: {
      text: "This client appears to be eligible for early discharge. Request a progress report from state in which this client is being supervised and provide to the parole board.",
    },
    Probation: {
      text: "This client appears to be eligible for early discharge. Request a progress report from state in which this client is being supervised and submit to the judge.",
    },
  },
} as const;

export function UsMiEarlyDischargeIcDetails({
  opportunity,
}: OpportunityProfileProps): React.ReactElement | null {
  if (!(opportunity instanceof UsMiEarlyDischargeOpportunity)) {
    return null;
  }
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
