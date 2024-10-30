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

import {
  Icon,
  IconSVG,
  palette,
  spacing,
  typography,
} from "@recidiviz/design-system";
import { ascending } from "d3-array";
import { rem } from "polished";
import { ReactNode } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components/macro";

import { OpportunityType } from "~datatypes";

import { useRootStore } from "../../components/StoreProvider";
import { PartialRecord } from "../../utils/typeUtils";
import { Opportunity } from "../../WorkflowsStore";
import { workflowsUrl } from "../views";

const MAX_DISPLAYED_OPPORTUNITIES = 5;

const Container = styled.section`
  background-color: #fff5f5;
  border-color: ${palette.signal.error};
  border-style: solid;
  border-width: 0 0 0 ${rem(spacing.xs)};

  padding: ${rem(spacing.md)};
  padding-left: ${rem(22)};

  display: flex;
  flex-direction: column;

  gap: ${rem(spacing.md)};

  width: 100%;
`;

const Header = styled.div`
  ${typography.Sans12}
  text-transform: uppercase;
  font-weight: 700;
`;

const Entries = styled.ul`
  list-style-type: none;
  padding-left: 0;
`;

const Entry = styled.li`
  ${typography.Sans14}

  color: ${palette.pine1};

  display: flex;

  &:not(:last-child) {
    margin-bottom: ${rem(spacing.sm)};
  }

  gap: ${rem(14)};
`;

const HighlightedOpportunity = function HighlightedOpportunity({
  opportunity,
}: {
  opportunity: Opportunity;
}): ReactNode {
  const { workflowsStore } = useRootStore();
  const onClick = () => {
    workflowsStore.updateSelectedOpportunity(opportunity.selectId);
    workflowsStore.updateSelectedPerson(opportunity.person.pseudonymizedId);
  };

  const { urlSection } = opportunity.config;
  const opportunityUrl = workflowsUrl("opportunityClients", { urlSection });

  return (
    <Entry>
      <Icon kind={IconSVG.Error} size={16} color={palette.signal.error} />
      <div>{opportunity.highlightCalloutText}</div>
      <Link onClick={onClick} to={opportunityUrl}>
        <Icon
          kind={IconSVG.Arrow}
          size={16}
          strokeWidth={1.7}
          color={palette.slate85}
        />
      </Link>
    </Entry>
  );
};

export const OpportunityCaseHighlights = function OpportunityCaseHighlights({
  opportunityTypes,
  opportunitiesByType,
}: {
  opportunityTypes: OpportunityType[];
  opportunitiesByType: PartialRecord<OpportunityType, Opportunity[]>;
}): React.ReactNode | null {
  const highlightableOpportunities = opportunityTypes
    .flatMap((opportunityType) => {
      const opportunities = opportunitiesByType[opportunityType] || [];
      if (!opportunities[0]?.config.highlightCasesOnHomepage) return [];

      return opportunities;
    })
    .sort((a, b) => ascending(a.eligibilityDate, b.eligibilityDate));

  if (highlightableOpportunities.length === 0) return null;

  return (
    <Container>
      <Header>Overdue for transition program release</Header>
      <Entries>
        {highlightableOpportunities
          .slice(0, MAX_DISPLAYED_OPPORTUNITIES)
          .map((o) => (
            <HighlightedOpportunity
              opportunity={o}
              key={`${o.type}-${o.person.externalId}`}
            />
          ))}
      </Entries>
    </Container>
  );
};
