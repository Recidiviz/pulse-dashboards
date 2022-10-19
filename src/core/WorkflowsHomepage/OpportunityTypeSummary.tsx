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

import {
  Icon,
  IconSVG,
  palette,
  Sans18,
  Serif24,
  spacing,
  typography,
} from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import { Link } from "react-router-dom";
import styled from "styled-components/macro";

import {
  generateOpportunityHydratedHeader,
  Opportunity,
  OpportunityType,
} from "../../WorkflowsStore";
import { ClientAvatar } from "../Avatar";
import { workflowsUrl } from "../views";

const OpportunityTypeSummaryWrapper = styled.div`
  margin: ${rem(spacing.xxl)} 6rem 4rem 6rem;
  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
`;

const OpportunityHeaderWrapper = styled.div`
  padding-right: ${rem(spacing.xxl)};
`;

const OpportunityHeader = styled(Serif24)`
  color: ${palette.pine2};
  padding-bottom: ${rem(spacing.sm)};
`;

const OpportunityTypeSummaryCTA = styled(Sans18)`
  color: ${palette.slate70};
  padding-bottom: ${rem(spacing.sm)};
`;

const ViewAllArrow = styled.div`
  padding-left: ${rem(spacing.sm)};
  padding-bottom: 1px;
`;

const ViewAllLink = styled(Link).attrs({ exact: true })`
  ${typography.Sans18}
  color: ${palette.signal.links};
  display: flex;
  align-items: center;
  width: 7rem;

  &:hover,
  &:focus {
    color: ${palette.pine4};
    font-weight: 600;
    text-decoration: underline;
  }
`;

const OpportunityHighlight = styled.span`
  color: ${palette.pine2};
  border-bottom: 2px solid;
  border-color: ${palette.data.gold1};
`;

const ClientsWrapper = styled.div`
  display: flex;
  flex-flow: row nowrap;
`;

const ClientAvatarWrapper = styled.div`
  &:nth-child(1) {
    transform: translateX(15px);
  }
  &:nth-child(2) {
    transform: translateX(5px);
  }
  &:nth-child(3) {
    transform: translateX(-5px);
  }
  &:nth-child(4) {
    transform: translateX(-15px);
  }
`;

const OpportunityTypeSummary = observer(
  ({
    opportunities,
    opportunityType,
  }: {
    opportunities: Opportunity[];
    opportunityType: OpportunityType;
  }): React.ReactElement | null => {
    const sliceIndex = opportunities.length > 3 ? 2 : 3;
    const previewOpportunities = opportunities.slice(0, sliceIndex);
    const numOpportunitiesToDisplay = opportunities.length - sliceIndex;

    const header = generateOpportunityHydratedHeader(
      opportunityType,
      opportunities.length
    );

    return (
      <OpportunityTypeSummaryWrapper>
        <OpportunityHeaderWrapper>
          <OpportunityHeader>
            {header.eligibilityText}
            <OpportunityHighlight>
              {header.opportunityText}
            </OpportunityHighlight>
          </OpportunityHeader>
          <OpportunityTypeSummaryCTA>
            {header.callToAction}
          </OpportunityTypeSummaryCTA>
          <ViewAllLink
            to={workflowsUrl("opportunityClients", { opportunityType })}
          >
            View all{" "}
            <ViewAllArrow>
              <Icon
                className="ViewAllLink__icon"
                kind={IconSVG.Arrow}
                fill={palette.signal.links}
                height={16}
                width={16}
              />
            </ViewAllArrow>
          </ViewAllLink>
        </OpportunityHeaderWrapper>
        <ClientsWrapper>
          {previewOpportunities.map((opportunity) => (
            <ClientAvatarWrapper>
              <ClientAvatar size={56} name={opportunity.client.displayName} />
            </ClientAvatarWrapper>
          ))}
          {numOpportunitiesToDisplay > 0 && (
            <ClientAvatarWrapper>
              <ClientAvatar
                size={56}
                name={`+ ${numOpportunitiesToDisplay}`}
                splitName={false}
              />
            </ClientAvatarWrapper>
          )}
        </ClientsWrapper>
      </OpportunityTypeSummaryWrapper>
    );
  }
);

export default OpportunityTypeSummary;
