// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

import { usMiSecurityClassificationCommitteeReviewV2Record } from "~datatypes";

import { formatWorkflowsDate } from "../../../../utils";
import { usMiAddInPersonSecurityClassificationCommitteeReviewV2Opportunity } from "../../../../WorkflowsStore/Opportunity/UsMi/UsMiAddInPersonSecurityClassificationCommitteeReviewV2Opportunity";
import { usMiSecurityClassificationCommitteeReviewV2Opportunity } from "../../../../WorkflowsStore/Opportunity/UsMi/UsMiSecurityClassificationCommitteeReviewV2Opportunity";
import { usMiWardenInPersonSecurityClassificationCommitteeReviewV2Opportunity } from "../../../../WorkflowsStore/Opportunity/UsMi/UsMiWardenInPersonSecurityClassificationCommitteeReviewV2Opportunity";
import {
  DetailsHeading,
  DetailsSection,
  DetailsSubheading,
  SecureDetailsContent,
  SecureDetailsList,
} from "../../styles";
import { OpportunityProfileProps } from "../../types";
import {
  MisconductHistory,
  SegregationHistory,
} from "./UsMiRestrictiveHousingDetails";

// TODO(#OBT-9920): Deprecating V1 component and rename
export function UsMiRestrictiveHousingV2({
  opportunity,
}: OpportunityProfileProps): React.ReactElement<any> | null {
  if (
    !(
      opportunity instanceof
        usMiSecurityClassificationCommitteeReviewV2Opportunity ||
      opportunity instanceof
        usMiWardenInPersonSecurityClassificationCommitteeReviewV2Opportunity ||
      opportunity instanceof
        usMiAddInPersonSecurityClassificationCommitteeReviewV2Opportunity
    )
  ) {
    return null;
  }
  const opportunityRecord =
    opportunity.record as usMiSecurityClassificationCommitteeReviewV2Record["output"];
  if (!opportunityRecord) return null;

  const {
    daysInSolitarySession,
    lessThan24MonthsFromErd,
    jsonAdSegStaysAndReasonsWithin3Yrs,
    jsonRecentBondableOffenses,
    jsonRecentNonbondableOffenses,
    solitarySessionStartDate,
    solitarySessionType,
  } = opportunityRecord.metadata;

  const { SMI } = opportunityRecord.formInformation;

  return (
    <DetailsSection>
      <DetailsHeading>Additional Details</DetailsHeading>
      <SecureDetailsContent>
        <SecureDetailsList>
          <DetailsSubheading>
            Start Date in {solitarySessionType}
          </DetailsSubheading>
          <SecureDetailsContent>
            {formatWorkflowsDate(solitarySessionStartDate)}
          </SecureDetailsContent>

          <DetailsSubheading>
            Prior Administrative Segregation History
          </DetailsSubheading>
          <SecureDetailsContent>
            <SegregationHistory stays={jsonAdSegStaysAndReasonsWithin3Yrs} />
          </SecureDetailsContent>

          <DetailsSubheading>Misconduct History</DetailsSubheading>
          <SecureDetailsContent>
            <MisconductHistory
              bondableOffenses={jsonRecentBondableOffenses}
              nonbondableOffenses={jsonRecentNonbondableOffenses}
            />
          </SecureDetailsContent>
          <DetailsSubheading>Less than 24 months from ERD?</DetailsSubheading>
          <SecureDetailsContent>
            {lessThan24MonthsFromErd ? "Yes" : "No"}
          </SecureDetailsContent>
          <DetailsSubheading>{"Length of stay > 30 days?"}</DetailsSubheading>
          <SecureDetailsContent>
            {daysInSolitarySession > 30 ? "Yes" : "No"}
          </SecureDetailsContent>
          <DetailsSubheading>{"SMI?"}</DetailsSubheading>
          <SecureDetailsContent>{SMI ? "Yes" : "No"}</SecureDetailsContent>
        </SecureDetailsList>
      </SecureDetailsContent>
    </DetailsSection>
  );
}
