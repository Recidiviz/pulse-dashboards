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
  generateOpportunityHydratedHeader,
  generateOpportunityInitialHeader,
  OPPORTUNITY_LABELS,
} from "../../WorkflowsStore";
import cssVars from "../CoreConstants.module.scss";
import { CaseloadOpportunitiesHydrator } from "../OpportunitiesHydrator";
import WorkflowsNoResults from "../WorkflowsNoResults";
import { PersonListItem } from "./PersonListItem";
import { Heading, SectionLabelText, SubHeading } from "./styles";

const PersonList = styled.ul`
  column-gap: ${rem(spacing.md)};
  display: grid;
  grid-template-columns: 100%;
  list-style-type: none;
  margin: 0;
  padding: 0;
  row-gap: ${rem(spacing.sm)};

  @media screen and (min-width: ${cssVars.breakpointSm}) {
    grid-template-columns: 50% 50%;
  }
`;

export const OpportunityPersonList = observer(() => {
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

  const hydratedHeader = generateOpportunityHydratedHeader(
    opportunityType,
    totalOpps
  );
  const initialHeader = generateOpportunityInitialHeader(opportunityType);

  const initial = (
    <WorkflowsNoResults
      headerText={opportunityLabel}
      callToActionText={initialHeader}
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
        {hydratedHeader.eligibilityText} {hydratedHeader.opportunityText}
      </Heading>
      <SubHeading>{hydratedHeader.callToAction}</SubHeading>
      <>
        {eligibleOpps.length > 0 && almostEligibleOpps.length > 0 && (
          <SectionLabelText>Eligible now</SectionLabelText>
        )}
        <PersonList>
          {eligibleOpps.map((opportunity) => (
            <PersonListItem opportunity={opportunity} />
          ))}
        </PersonList>
      </>
      {almostEligibleOpps.length > 0 && (
        <>
          <SectionLabelText>Almost Eligible</SectionLabelText>
          <PersonList>
            {almostEligibleOpps.map((opportunity) => (
              <PersonListItem opportunity={opportunity} />
            ))}
          </PersonList>
        </>
      )}
    </>
  );

  return (
    <CaseloadOpportunitiesHydrator
      {...{ initial, empty, hydrated, opportunityTypes: [opportunityType] }}
    />
  );
});
