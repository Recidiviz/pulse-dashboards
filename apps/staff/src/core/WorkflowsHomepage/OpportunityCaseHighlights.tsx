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

const MAX_DISPLAYED_CANDIDATES_PER_OPPORTUNITY = 3;

const Container = styled.section`
  background-color: #fff5f5;
  border-color: #e00e00;
  border-style: solid;
  border-width: 0 0 0 ${rem(spacing.xs)};

  padding: ${rem(spacing.md)};
  padding-left: ${rem(22)};

  display: flex;
  flex-direction: column;

  gap: ${rem(spacing.sm)};

  width: 100%;
`;

const Header = styled.div`
  ${typography.Sans12}
  text-transform: uppercase;
  font-weight: 700;

  margin-bottom: ${rem(spacing.sm)};
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

const AllCandidatesLinkContainer = styled.div`
  margin-top: ${rem(spacing.md)};
  margin-bottom: ${rem(spacing.sm)};
`;

const AllCandidatesLinkLayout = styled.div`
  display: flex;
  gap: ${rem(4)};
`;

const AllCandidatesLink = styled(Link)`
  ${typography.Sans14}

  text-decoration: underline;
  color: ${palette.pine4};
  &:hover {
    color: ${palette.pine4};
  }
`;

const IconLink = styled(Icon)`
  &:hover {
    stroke: rgb(0, 196, 157);
  }
`;

const HighlightedCandidate = function HighlightedCandidate({
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
      <div className="fs-exclude">{opportunity.highlightCalloutText}</div>
      <Link onClick={onClick} to={opportunityUrl}>
        <IconLink
          kind={IconSVG.Arrow}
          size={16}
          strokeWidth={1.7}
          color={palette.slate85}
        />
      </Link>
    </Entry>
  );
};

const HighlightedOpportunity = function HighlightedOpportunity({
  opportunities,
}: {
  opportunities: Opportunity[];
}): ReactNode {
  const { urlSection, highlightedCaseCtaCopy } = opportunities[0].config;
  const opportunityUrl = workflowsUrl("opportunityClients", { urlSection });

  const sortedOpps = opportunities
    .sort((a, b) => ascending(a.eligibilityDate, b.eligibilityDate))
    .slice(0, MAX_DISPLAYED_CANDIDATES_PER_OPPORTUNITY);

  return (
    <Entries>
      {sortedOpps.map((o) => (
        <HighlightedCandidate
          opportunity={o}
          key={`${o.type}-${o.person.externalId}`}
        />
      ))}
      {opportunities.length > MAX_DISPLAYED_CANDIDATES_PER_OPPORTUNITY && (
        <AllCandidatesLinkContainer>
          <AllCandidatesLink to={opportunityUrl}>
            <AllCandidatesLinkLayout>
              See all {opportunities.length} {highlightedCaseCtaCopy}
              <Icon
                kind={IconSVG.Arrow}
                size={16}
                strokeWidth={1.7}
                color={palette.pine4}
              />
            </AllCandidatesLinkLayout>
          </AllCandidatesLink>
        </AllCandidatesLinkContainer>
      )}
    </Entries>
  );
};

export const OpportunityCaseHighlights = function OpportunityCaseHighlights({
  opportunityTypes,
  opportunitiesByType,
}: {
  opportunityTypes: OpportunityType[];
  opportunitiesByType: PartialRecord<OpportunityType, Opportunity[]>;
}): React.ReactNode | null {
  const highlightableTypes = opportunityTypes.filter((opportunityType) => {
    const opportunities = opportunitiesByType[opportunityType] || [];
    return opportunities[0]?.config.highlightCasesOnHomepage;
  });

  if (highlightableTypes.length === 0) return null;

  return (
    <Container>
      <Header>Overdue for transition program release</Header>
      {highlightableTypes.map((opportunityType) => (
        <HighlightedOpportunity
          key={opportunityType}
          opportunities={opportunitiesByType[opportunityType] || []}
        />
      ))}
    </Container>
  );
};
