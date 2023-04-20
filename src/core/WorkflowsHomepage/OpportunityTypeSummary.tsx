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

import { useRootStore } from "../../components/StoreProvider";
import {
  generateOpportunityHydratedHeader,
  Opportunity,
  OpportunityType,
} from "../../WorkflowsStore";
import { JusticeInvolvedPersonAvatar } from "../Avatar";
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

const ViewAllLink = styled(Link)`
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

const ClientAvatarWrapper = styled.div<{
  hasBorder?: boolean;
}>`
  margin-left: ${(props) => (props.hasBorder ? "-10" : "-20")}px;

  ${(props) =>
    props.hasBorder &&
    `& > div {
    border: 2px solid transparent;
  }
  &:not(:only-child) > div {
    border: 2px solid ${palette.white};
  }`}

  &:nth-child(1) {
    z-index: 0;
  }
  &:nth-child(2) {
    z-index: 1;
  }
  &:nth-child(3) {
    z-index: 2;
  }
  &:nth-child(4) {
    z-index: 3;
  }
`;

const OpportunityTypeSummary = observer(function OpportunityTypeSummary({
  opportunities,
  opportunityType,
}: {
  opportunities: Opportunity[];
  opportunityType: OpportunityType;
}): React.ReactElement | null {
  const {
    workflowsStore: { featureVariants },
  } = useRootStore();

  const defaultAvatarsShown = featureVariants.responsiveRevamp ? 4 : 3;
  const sliceIndex =
    opportunities.length > defaultAvatarsShown
      ? defaultAvatarsShown - 1
      : defaultAvatarsShown;
  const previewOpportunities = opportunities.slice(0, sliceIndex);
  const numOpportunitiesToDisplay = opportunities.length - sliceIndex;

  const header = generateOpportunityHydratedHeader(
    opportunityType,
    opportunities.length
  );

  return (
    <OpportunityTypeSummaryWrapper className="OpportunityTypeSummaryWrapper">
      <OpportunityHeaderWrapper>
        <OpportunityHeader>
          {header.eligibilityText}
          <OpportunityHighlight>{header.opportunityText}</OpportunityHighlight>
        </OpportunityHeader>
        <OpportunityTypeSummaryCTA>
          {header.callToAction}
        </OpportunityTypeSummaryCTA>
        <ViewAllLink
          className={`ViewAllLink__${opportunityType}`}
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
      <ClientsWrapper className="OpportunityClientsWrapper">
        {previewOpportunities.map((opportunity) => (
          <ClientAvatarWrapper
            key={opportunity.person.recordId}
            hasBorder={!featureVariants.responsiveRevamp}
          >
            <JusticeInvolvedPersonAvatar
              size={56}
              name={opportunity.person.displayPreferredName}
            />
          </ClientAvatarWrapper>
        ))}
        {numOpportunitiesToDisplay > 0 && (
          <ClientAvatarWrapper hasBorder={!featureVariants.responsiveRevamp}>
            <JusticeInvolvedPersonAvatar
              size={56}
              name={`+ ${numOpportunitiesToDisplay}`}
              splitName={false}
            />
          </ClientAvatarWrapper>
        )}
      </ClientsWrapper>
    </OpportunityTypeSummaryWrapper>
  );
});

export default OpportunityTypeSummary;
