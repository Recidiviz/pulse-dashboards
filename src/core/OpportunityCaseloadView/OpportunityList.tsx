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
import React from "react";
import styled from "styled-components/macro";

import { useRootStore } from "../../components/StoreProvider";
import { generateOpportunityHeader } from "../../WorkflowsStore";
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
  const {
    workflowsStore: {
      almostEligibleOpportunities,
      eligibleOpportunities,
      selectedOpportunityType: opportunityType,
    },
  } = useRootStore();

  if (!opportunityType) return null;
  const eligibleOpps = eligibleOpportunities[opportunityType];
  if (!eligibleOpps.length) return null;

  const almostEligibleOpps = almostEligibleOpportunities[opportunityType];

  const header = generateOpportunityHeader(
    opportunityType,
    eligibleOpps.length + almostEligibleOpps.length
  );

  return (
    <>
      <Heading>
        {header.eligibilityText} {header.opportunityText}
      </Heading>
      <SubHeading>{header.callToAction}</SubHeading>
      <>
        {almostEligibleOpps.length > 0 && (
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
          <SectionLabelText>Almost eligible</SectionLabelText>
          <ClientList>
            {almostEligibleOpps.map((opportunity) => (
              <ClientListItem opportunity={opportunity} />
            ))}
          </ClientList>
        </>
      )}
    </>
  );
});
