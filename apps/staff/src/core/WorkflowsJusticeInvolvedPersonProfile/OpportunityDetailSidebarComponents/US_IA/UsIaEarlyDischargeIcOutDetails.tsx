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

import { UsIaEarlyDischargeOpportunity } from "../../../../WorkflowsStore/Opportunity/UsIa";
import {
  DetailsBorderedSection,
  DetailsHeading,
  DetailsList,
  SecureDetailsContent,
} from "../../styles";
import { OpportunityProfileProps } from "../../types";

export function UsIaEarlyDischargeIcOutDetails({
  opportunity,
}: OpportunityProfileProps): React.ReactElement | null {
  if (
    !(opportunity instanceof UsIaEarlyDischargeOpportunity) ||
    opportunity.person.record.custodialAuthority !== "OTHER_STATE"
  ) {
    return null;
  }

  const progressReportCopy =
    "This client appears to be eligible for early discharge. Request a progress report from the state in which this client is being supervised to further understand if they meet Iowa's eligibility criteria.";

  return (
    <DetailsBorderedSection>
      <DetailsHeading>{"IC-OUT"}</DetailsHeading>
      <DetailsList>
        <SecureDetailsContent>{progressReportCopy}</SecureDetailsContent>
      </DetailsList>
    </DetailsBorderedSection>
  );
}
