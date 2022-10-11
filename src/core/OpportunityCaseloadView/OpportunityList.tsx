// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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
import { spacing } from "@recidiviz/design-system";
import { autorun } from "mobx";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import React, { useEffect } from "react";
import simplur from "simplur";
import styled from "styled-components/macro";

import { useRootStore } from "../../components/StoreProvider";
import {
  generateOpportunityHeader,
  OPPORTUNITY_LABELS,
} from "../../WorkflowsStore";
import WorkflowsNoResults from "../WorkflowsNoResults";
import { ClientListItem } from "./ClientListItem";
import { Heading, SectionLabelText, SubHeading } from "./styles";

const ClientList = styled.ul`
  column-gap: ${rem(spacing.md)};
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(${rem(500)}, 1fr));
  list-style-type: none;
  margin: 0;
  padding: 0;
  row-gap: ${rem(spacing.sm)};
`;

export const OpportunityList = observer(() => {
  const { workflowsStore } = useRootStore();
  const {
    selectedOfficerIds,
    almostEligibleOpportunities,
    eligibleOpportunities,
    allOpportunitiesLoaded,
    hasOpportunities,
    selectedOpportunityType: opportunityType,
  } = workflowsStore;

  useEffect(
    () =>
      autorun(() => {
        workflowsStore.potentialOpportunities.forEach((opp) => {
          if (!opp.isHydrated) opp.hydrate();
        });
      }),
    [workflowsStore]
  );

  if (!opportunityType) return null;

  const opportunityLabel = OPPORTUNITY_LABELS[opportunityType];
  const eligibleOpps = eligibleOpportunities[opportunityType];
  const almostEligibleOpps = almostEligibleOpportunities[opportunityType];
  const totalOpps = eligibleOpps.length + almostEligibleOpps.length;
  const displayInitialState = !selectedOfficerIds.length;
  const displayOpportunityList = allOpportunitiesLoaded && hasOpportunities;
  const displayNoResults = allOpportunitiesLoaded && !hasOpportunities;

  const header = generateOpportunityHeader(opportunityType, totalOpps);

  return (
    <>
      {displayInitialState && (
        <WorkflowsNoResults
          headerText={opportunityLabel}
          callToActionText={`Search for officers above to review and refer eligible clients for ${opportunityLabel.toLowerCase()}.`}
        />
      )}

      {displayNoResults && (
        <WorkflowsNoResults
          callToActionText={simplur`None of the clients on the selected ${[
            selectedOfficerIds.length,
          ]} officer['s|s'] caseloads are eligible for ${opportunityLabel.toLowerCase()}. Search for another officer.`}
        />
      )}

      {displayOpportunityList && (
        <>
          <Heading>
            {header.eligibilityText} {header.opportunityText}
          </Heading>
          <SubHeading>{header.callToAction}</SubHeading>
          <>
            {eligibleOpps.length > 0 && almostEligibleOpps.length > 0 && (
              <SectionLabelText>Eligible now</SectionLabelText>
            )}
            <ClientList>
              {eligibleOpps.map((opportunity) => (
                <ClientListItem opportunity={opportunity} />
              ))}
            </ClientList>
          </>
          {almostEligibleOpps.length > 0 && (
            <>
              <SectionLabelText>Almost Eligible</SectionLabelText>
              <ClientList>
                {almostEligibleOpps.map((opportunity) => (
                  <ClientListItem opportunity={opportunity} />
                ))}
              </ClientList>
            </>
          )}
        </>
      )}
    </>
  );
});
