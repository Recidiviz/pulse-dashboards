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
  spacing,
  typography,
} from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import { Link } from "react-router-dom";
import styled from "styled-components/macro";

import { useOpportunityConfigurations } from "../../components/StoreProvider";
import useIsMobile from "../../hooks/useIsMobile";
import {
  countOpportunities,
  generateOpportunityHydratedHeader,
  Opportunity,
  OpportunityType,
} from "../../WorkflowsStore";
import { PersonInitialsAvatar } from "../Avatar";
import { workflowsUrl } from "../views";

const OpportunityTypeSummaryWrapper = styled.div<{
  isMobile: boolean;
}>`
  display: flex;
  flex-flow: row ${({ isMobile }) => !isMobile && "no"}wrap;
  justify-content: space-between;
  margin-top: ${rem(spacing.xxl)};
  padding-top: ${rem(spacing.md)};   
  border-top: 1px solid ${palette.slate20};}
`;

const OpportunityHeaderWrapper = styled.div<{
  isMobile: boolean;
}>`
  padding-right: ${({ isMobile }) => (isMobile ? 0 : rem(spacing.xxl))};
  width: ${({ isMobile }) => (!isMobile ? rem(550) : "100%")};

  ${({ isMobile }) => isMobile && "order: 2;"}
`;

const OpportunityHeader = styled.div<{
  isMobile: boolean;
}>`
  ${typography.Sans24};
  ${({ isMobile }) => isMobile && typography.Sans18};
  color: ${palette.pine2};
`;

const ViewAllArrow = styled.div`
  padding-left: ${rem(spacing.sm)};
  padding-bottom: 1px;
`;

const ViewAllLink = styled(Link)<{ $isMobile: boolean }>`
  ${({ $isMobile }) => ($isMobile ? typography.Sans16 : typography.Sans18)}
  color: ${palette.signal.links};
  display: flex;
  align-items: center;
  width: 7rem;
  padding-top: ${rem(spacing.md)};

  &:hover,
  &:focus {
    color: ${palette.pine4};
    font-weight: 600;
    text-decoration: underline;
  }
`;

const ClientsWrapper = styled.div<{ isMobile: boolean }>`
  display: flex;
  flex-flow: row nowrap;

  ${({ isMobile }) => isMobile && "margin: 0 1rem 1rem;"}
`;

const ClientAvatarWrapper = styled.div`
  margin-left: -20px;
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

const ReviewStatusWrapper = styled.div`
  display: flex;
  flex-flow: row nowrap;
  padding-top: ${rem(spacing.sm)};
`;

const ReviewStatusCount = styled.div`
  ${typography.Sans14};
  color: ${palette.slate70};
  padding-right: ${rem(spacing.md)};
`;

const OpportunityTypeSummary = observer(function OpportunityTypeSummary({
  opportunities,
  opportunityType,
}: {
  opportunities: Opportunity[];
  opportunityType: OpportunityType;
}): React.ReactElement | null {
  const { isMobile } = useIsMobile(true);
  const config = useOpportunityConfigurations()[opportunityType];

  const defaultAvatarsShown = 4;
  const sliceIndex =
    opportunities.length > defaultAvatarsShown
      ? defaultAvatarsShown - 1
      : defaultAvatarsShown;
  const previewOpportunities = opportunities.slice(0, sliceIndex);
  const numOpportunitiesToDisplay = opportunities.length - sliceIndex;
  const reviewStatusText = opportunities[0].config.isAlert
    ? "Overridden"
    : "Ineligible";
  const numIneligible = opportunities.filter(
    (opp) => opp.reviewStatus === "DENIED",
  ).length;

  const header = generateOpportunityHydratedHeader(
    config,
    countOpportunities(opportunities, opportunityType),
  );

  return (
    <OpportunityTypeSummaryWrapper
      isMobile={isMobile}
      className="OpportunityTypeSummaryWrapper"
    >
      <OpportunityHeaderWrapper isMobile={isMobile}>
        <OpportunityHeader isMobile={isMobile}>
          {header.fullText ?? (
            <>
              {header.eligibilityText} {header.opportunityText}
            </>
          )}
        </OpportunityHeader>
        <ReviewStatusWrapper>
          {numIneligible > 0 && (
            <ReviewStatusCount>
              {reviewStatusText}: {numIneligible}
            </ReviewStatusCount>
          )}
        </ReviewStatusWrapper>
        <ViewAllLink
          $isMobile={isMobile}
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
      <ClientsWrapper isMobile={isMobile} className="OpportunityClientsWrapper">
        {previewOpportunities.map((opportunity) => (
          <ClientAvatarWrapper key={opportunity.person.recordId}>
            <PersonInitialsAvatar
              size={56}
              name={opportunity.person.displayPreferredName}
            />
          </ClientAvatarWrapper>
        ))}
        {numOpportunitiesToDisplay > 0 && (
          <ClientAvatarWrapper>
            <PersonInitialsAvatar
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
