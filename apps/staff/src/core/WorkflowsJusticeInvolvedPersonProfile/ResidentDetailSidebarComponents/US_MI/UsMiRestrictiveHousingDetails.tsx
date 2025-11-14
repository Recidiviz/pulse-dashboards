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

import {
  UsMiBondableOffense,
  UsMiNonbondableOffense,
  usMiSecurityClassificationCommitteeReviewRecord,
  UsMiSegregationStay,
} from "~datatypes";
import { palette } from "~design-system";

import { formatDateRange, formatWorkflowsDate } from "../../../../utils";
import { usMiAddInPersonSecurityClassificationCommitteeReviewOpportunity } from "../../../../WorkflowsStore/Opportunity/UsMi/UsMiAddInPersonSecurityClassificationCommitteeReviewOpportunity";
import { usMiSecurityClassificationCommitteeReviewOpportunity } from "../../../../WorkflowsStore/Opportunity/UsMi/UsMiSecurityClassificationCommitteeReviewOpportunity";
import { usMiWardenInPersonSecurityClassificationCommitteeReviewOpportunity } from "../../../../WorkflowsStore/Opportunity/UsMi/UsMiWardenInPersonSecurityClassificationCommitteeReviewOpportunity";
import {
  DetailsHeading,
  DetailsSection,
  DetailsSubheading,
  SecureDetailsContent,
  SecureDetailsList,
} from "../../styles";
import { OpportunityProfileProps } from "../../types";

const OffenseCode = styled.div`
  margin-top: 0.25rem;
  color: ${palette.slate60};
`;

export const SegregationHistory: React.FC<{
  stays: UsMiSegregationStay[];
}> = ({ stays }) => {
  if (stays.length === 0) return <>N/A</>;

  return (
    <>
      {stays.map((stay) => (
        <div key={`${stay.stayStartDate}`}>
          {formatWorkflowsDate(stay.stayStartDate)} -{" "}
          {formatWorkflowsDate(stay.stayEndDate)} (
          {formatDateRange(stay.stayStartDate, stay.stayEndDate)})
          {stay.stayOffenses && stay.stayOffenses.trim() && (
            <OffenseCode>
              • Code: {stay.stayOffenses.replace(/,+$/, "")}
            </OffenseCode>
          )}
        </div>
      ))}
    </>
  );
};

export const MisconductHistory: React.FC<{
  bondableOffenses: UsMiBondableOffense[];
  nonbondableOffenses: UsMiNonbondableOffense[];
}> = ({ bondableOffenses, nonbondableOffenses }) => {
  if (bondableOffenses.length === 0 && nonbondableOffenses.length === 0) {
    return <>N/A</>;
  }

  const allOffenses = [
    ...bondableOffenses.map((o) => ({
      date: o.bondableIncidentDate,
      code: o.bondableOffense,
    })),
    ...nonbondableOffenses.map((o) => ({
      date: o.nonbondableIncidentDate,
      code: o.nonbondableOffense,
    })),
  ].sort((a, b) => (a.date?.getTime() ?? 0) - (b.date?.getTime() ?? 0));

  // Group offenses by date (offenses are already sorted, so just check the last group)
  const groupedByDate: Array<{ date: Date; codes: string[] }> = [];

  allOffenses.forEach((offense) => {
    if (!offense.date || !offense.code) return;

    const lastGroup = groupedByDate[groupedByDate.length - 1];

    if (lastGroup && lastGroup.date.getTime() === offense.date.getTime()) {
      lastGroup.codes.push(offense.code);
    } else {
      groupedByDate.push({ date: offense.date, codes: [offense.code] });
    }
  });

  return (
    <>
      {groupedByDate.map(({ date, codes }) => (
        <div key={`offense-${date.getTime()}`}>
          {formatWorkflowsDate(date)}
          <OffenseCode>• Code: {codes.join(", ")}</OffenseCode>
        </div>
      ))}
    </>
  );
};

export function UsMiRestrictiveHousing({
  opportunity,
}: OpportunityProfileProps): React.ReactElement | null {
  if (
    !(
      opportunity instanceof
        usMiSecurityClassificationCommitteeReviewOpportunity ||
      opportunity instanceof
        usMiWardenInPersonSecurityClassificationCommitteeReviewOpportunity ||
      opportunity instanceof
        usMiAddInPersonSecurityClassificationCommitteeReviewOpportunity
    )
  ) {
    return null;
  }
  const opportunityRecord =
    opportunity.record as usMiSecurityClassificationCommitteeReviewRecord["output"];
  if (!opportunityRecord) return null;

  const {
    daysInCollapsedSolitarySession,
    lessThan24MonthsFromErd,
    jsonAdSegStaysAndReasonsWithin3Yrs,
    jsonRecentBondableOffenses,
    jsonRecentNonbondableOffenses,
    solitarySessionStartDate,
    solitarySessionType,
  } = opportunityRecord.metadata;

  // TODO(#5399): Add SMI designation and programming once the data's available
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

          <DetailsSubheading>Prior Segregation History</DetailsSubheading>
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
            {daysInCollapsedSolitarySession > 30 ? "Yes" : "No"}
          </SecureDetailsContent>
        </SecureDetailsList>
      </SecureDetailsContent>
    </DetailsSection>
  );
}
