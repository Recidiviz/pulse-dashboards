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
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import simplur from "simplur";
import styled from "styled-components/macro";

import { useRootStore } from "../../components/StoreProvider";
import {
  generateOpportunityHeader,
  OPPORTUNITY_LABELS,
} from "../../WorkflowsStore";
import { OpportunitiesHydrator } from "../OpportunitiesHydrator";
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

export const OpportunityClientList = observer(() => {
  const {
    workflowsStore: {
      selectedOfficerIds,
      almostEligibleOpportunities,
      eligibleOpportunities,
      selectedOpportunityType: opportunityType,
    },
  } = useRootStore();

  if (!opportunityType) return null;

  const opportunityLabel = OPPORTUNITY_LABELS[opportunityType];
  const eligibleOpps = eligibleOpportunities[opportunityType];
  const almostEligibleOpps = almostEligibleOpportunities[opportunityType];
  const totalOpps = eligibleOpps.length + almostEligibleOpps.length;

  const header = generateOpportunityHeader(opportunityType, totalOpps);

  const initial = (
    <WorkflowsNoResults
      headerText={opportunityLabel}
      callToActionText={`Search for officers above to review and refer eligible clients for ${opportunityLabel.toLowerCase()}.`}
    />
  );

  const empty = (
    <WorkflowsNoResults
      callToActionText={simplur`None of the clients on the selected ${[
        selectedOfficerIds.length,
      ]} officer['s|s'] caseloads are eligible for ${opportunityLabel.toLowerCase()}. Search for another officer.`}
    />
  );

  const hydrated = (
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
  );

  return <OpportunitiesHydrator {...{ initial, empty, hydrated }} />;
});