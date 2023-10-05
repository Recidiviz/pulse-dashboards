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
  spacing,
  typography,
} from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import { Link } from "react-router-dom";
import styled from "styled-components/macro";

import { useRootStore } from "../../components/StoreProvider";
import useIsMobile from "../../hooks/useIsMobile";
import {
  generateOpportunityHydratedHeader,
  Opportunity,
  OpportunityType,
} from "../../WorkflowsStore";
import { JusticeInvolvedPersonAvatar } from "../Avatar";
import { workflowsUrl } from "../views";

const OpportunityTypeSummaryWrapper = styled.div<{
  hasBorder?: boolean;
  isMobile: boolean;
}>`
  display: flex;
  flex-flow: row ${({ isMobile }) => !isMobile && "no"}wrap;
  justify-content: space-between;

  ${({ hasBorder }) =>
    hasBorder
      ? `margin-top: ${rem(spacing.xxl)};
          padding-top: ${rem(spacing.md)};   
          border-top: 1px solid ${palette.slate20};`
      : `margin: ${rem(spacing.xxl)} 6rem 4rem 6rem;`}
`;

const OpportunityHeaderWrapper = styled.div<{
  squished?: boolean;
  isMobile: boolean;
}>`
  padding-right: ${({ isMobile }) => (isMobile ? 0 : rem(spacing.xxl))};
  width: ${({ squished, isMobile }) =>
    squished && !isMobile ? rem(550) : "100%"};

  ${({ isMobile }) => isMobile && "order: 2;"}
`;

const OpportunityHeader = styled.div<{
  responsiveRevamp: boolean;
  isMobile: boolean;
}>`
  ${({ responsiveRevamp }) =>
    responsiveRevamp ? typography.Sans24 : typography.Serif24};
  ${({ isMobile }) => isMobile && typography.Sans18};
  color: ${palette.pine2};
`;

const OpportunityTypeSummaryCTA = styled(Sans18)`
  color: ${palette.slate70};
  padding-bottom: ${rem(spacing.sm)};
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

const OpportunityHighlight = styled.span`
  color: ${palette.pine2};
  border-bottom: 2px solid;
  border-color: ${palette.data.gold1};
`;

const ClientsWrapper = styled.div<{ isMobile: boolean }>`
  display: flex;
  flex-flow: row nowrap;

  ${({ isMobile }) => isMobile && "margin: 0 1rem 1rem;"}
`;

const ClientAvatarWrapper = styled.div<{
  hasBorder?: boolean;
}>`
  margin-left: ${({ hasBorder }) => (hasBorder ? "-10" : "-20")}px;

  ${({ hasBorder }) =>
    hasBorder &&
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
  const {
    workflowsStore: {
      featureVariants: { responsiveRevamp },
    },
  } = useRootStore();
  const { isMobile } = useIsMobile(true);

  const defaultAvatarsShown = responsiveRevamp ? 4 : 3;
  const sliceIndex =
    opportunities.length > defaultAvatarsShown
      ? defaultAvatarsShown - 1
      : defaultAvatarsShown;
  const previewOpportunities = opportunities.slice(0, sliceIndex);
  const numOpportunitiesToDisplay = opportunities.length - sliceIndex;

  const numIneligible = opportunities.filter(
    (opp) => opp.reviewStatus === "DENIED"
  ).length;

  const header = generateOpportunityHydratedHeader(
    opportunityType,
    opportunities.length - numIneligible
  );

  return (
    <OpportunityTypeSummaryWrapper
      isMobile={isMobile && responsiveRevamp}
      hasBorder={!!responsiveRevamp}
      className="OpportunityTypeSummaryWrapper"
    >
      <OpportunityHeaderWrapper
        isMobile={isMobile && responsiveRevamp}
        squished={!!responsiveRevamp}
      >
        <OpportunityHeader
          responsiveRevamp={!!responsiveRevamp}
          isMobile={isMobile && responsiveRevamp}
        >
          {numIneligible === opportunities.length
            ? header.callToAction
            : header.fullText ?? (
                <>
                  {header.eligibilityText}{" "}
                  {responsiveRevamp ? (
                    header.opportunityText
                  ) : (
                    <OpportunityHighlight>
                      {header.opportunityText}
                    </OpportunityHighlight>
                  )}
                </>
              )}
        </OpportunityHeader>
        {!responsiveRevamp && (
          <OpportunityTypeSummaryCTA>
            {header.callToAction}
          </OpportunityTypeSummaryCTA>
        )}
        <ReviewStatusWrapper>
          {!!responsiveRevamp && numIneligible > 0 && (
            <ReviewStatusCount>Ineligible: {numIneligible}</ReviewStatusCount>
          )}
        </ReviewStatusWrapper>
        <ViewAllLink
          $isMobile={isMobile && responsiveRevamp}
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
      <ClientsWrapper
        isMobile={isMobile && responsiveRevamp}
        className="OpportunityClientsWrapper"
      >
        {previewOpportunities.map((opportunity) => (
          <ClientAvatarWrapper
            key={opportunity.person.recordId}
            hasBorder={!responsiveRevamp}
          >
            <JusticeInvolvedPersonAvatar
              size={56}
              name={opportunity.person.displayPreferredName}
            />
          </ClientAvatarWrapper>
        ))}
        {numOpportunitiesToDisplay > 0 && (
          <ClientAvatarWrapper hasBorder={!responsiveRevamp}>
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
