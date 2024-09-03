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

import { usMiSecurityClassificationCommitteeReviewRecord } from "~datatypes";

import { usMiSecurityClassificationCommitteeReviewOpportunity } from "../../../../WorkflowsStore/Opportunity/UsMi/UsMiSecurityClassificationCommitteeReviewOpportunity";
import {
  DetailsHeading,
  DetailsSection,
  DetailsSubheading,
  SecureDetailsContent,
  SecureDetailsList,
} from "../../styles";
import { OpportunityProfileProps } from "../../types";

export function UsMiRestrictiveHousing({
  opportunity,
}: OpportunityProfileProps): React.ReactElement | null {
  if (
    !(
      opportunity instanceof
      usMiSecurityClassificationCommitteeReviewOpportunity
    )
  ) {
    return null;
  }
  const opportunityRecord =
    opportunity.record as usMiSecurityClassificationCommitteeReviewRecord["output"];
  if (!opportunityRecord) return null;

  const {
    daysInCollapsedSolitarySession,
    OPT,
    lessThan24MonthsFromErd,
    recentNonbondableOffenses,
    recentBondableOffenses,
    adSegStaysAndReasonsWithin3Yrs,
  } = opportunityRecord.metadata;

  const misconductHistory = recentBondableOffenses
    ? `${recentBondableOffenses}${recentNonbondableOffenses ? ", " + recentNonbondableOffenses : ""}`
    : recentNonbondableOffenses ?? "N/A";

  // TODO(#5399): Add SMI designation and programming once the data's available
  return (
    <DetailsSection>
      <DetailsHeading>Additional Details</DetailsHeading>
      <SecureDetailsContent>
        <SecureDetailsList>
          <DetailsSubheading>Prior Segregation History</DetailsSubheading>
          <SecureDetailsContent>
            {adSegStaysAndReasonsWithin3Yrs?.length
              ? adSegStaysAndReasonsWithin3Yrs
              : "N/A"}
          </SecureDetailsContent>

          <DetailsSubheading>Misconduct History</DetailsSubheading>
          <SecureDetailsContent>{misconductHistory}</SecureDetailsContent>
          <DetailsSubheading>Less than 24 months from ERD?</DetailsSubheading>
          <SecureDetailsContent>
            {lessThan24MonthsFromErd ? "Yes" : "No"}
          </SecureDetailsContent>
          <DetailsSubheading>Mental health needs?</DetailsSubheading>
          <SecureDetailsContent>{OPT ? "Yes" : "No"}</SecureDetailsContent>
          <DetailsSubheading>{"Length of stay > 30 days?"}</DetailsSubheading>
          <SecureDetailsContent>
            {daysInCollapsedSolitarySession > 30 ? "Yes" : "No"}
          </SecureDetailsContent>
        </SecureDetailsList>
      </SecureDetailsContent>
    </DetailsSection>
  );
}
