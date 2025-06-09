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

import { Icon, IconSVG, spacing, typography } from "@recidiviz/design-system";
import { groupBy } from "lodash";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import { Link } from "react-router-dom";
import styled from "styled-components/macro";

import { OpportunityType } from "~datatypes";
import { palette } from "~design-system";
import { PersonInitialsAvatar } from "~ui";

import { useOpportunityConfigurations } from "../../components/StoreProvider";
import useIsMobile from "../../hooks/useIsMobile";
import {
  countOpportunities,
  Opportunity,
  OpportunityTabGroup,
} from "../../WorkflowsStore";
import InsightsPill from "../InsightsPill";
import { insightsUrl, workflowsUrl } from "../views";

const ViewAllLabel = styled.div<{ $isMobile: boolean }>`
  ${({ $isMobile }) => ($isMobile ? typography.Sans16 : typography.Sans18)}
  color: ${palette.signal.links};
  display: flex;
  align-items: center;
  width: 7rem;
  padding-top: ${rem(spacing.md)};
`;

const OpportunityTypeSummaryLink = styled(Link)<{
  $isMobile: boolean;
}>`
  display: flex;
  flex-flow: row ${({ $isMobile }) => !$isMobile && "no"}wrap;
  justify-content: space-between;
  padding: ${rem(spacing.md)} ${rem(spacing.md)} ${rem(spacing.xxl)}
    ${rem(spacing.md)};
  border-bottom: 1px solid ${palette.slate20};
  :first-child {
    border-top: 1px solid ${palette.slate20};
  }
  &:hover,
  &:focus {
    ${ViewAllLabel} {
      color: ${palette.pine4};
      text-decoration: underline;
      text-underline-offset: ${rem(spacing.xs)};
    }
    background-color: ${palette.slate10};
  }
`;

const OpportunityHeaderWrapper = styled.div<{
  $isMobile: boolean;
}>`
  padding-right: ${({ $isMobile }) => ($isMobile ? 0 : rem(spacing.xxl))};
  width: ${({ $isMobile }) => (!$isMobile ? rem(750) : "100%")};

  ${({ $isMobile }) => $isMobile && "order: 2;"}
`;

const OpportunityHeader = styled.div<{
  $isMobile: boolean;
}>`
  ${typography.Sans24};
  ${({ $isMobile }) => $isMobile && typography.Sans18};
  color: ${palette.pine2};
`;

const ViewAllArrow = styled.div`
  padding-left: ${rem(spacing.sm)};
  padding-bottom: 1px;
`;

const OpportunityInfoWrapper = styled.div<{
  $isMobile: boolean;
  showZeroGrantsPill: boolean;
}>`
  display: flex;
  ${({ $isMobile }) => $isMobile && `gap: ${rem(spacing.md)};`}
  width: ${({ showZeroGrantsPill }) =>
    showZeroGrantsPill ? rem(300) : "fit-content"};
  justify-content: ${({ $isMobile }) =>
    $isMobile ? "flex-start" : "space-between"};
  flex-shrink: 0;
`;

const ClientsWrapper = styled.div<{ $isMobile: boolean }>`
  display: flex;
  flex-flow: row nowrap;

  ${({ $isMobile }) => $isMobile && "margin: 0 1rem 1rem; order: -1;"}
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
  officerPseudoId,
  showZeroGrantsPill,
}: {
  opportunities: Opportunity[];
  opportunityType: OpportunityType;
  officerPseudoId?: string;
  showZeroGrantsPill?: boolean;
}): React.ReactElement | null {
  const { isMobile } = useIsMobile(true);
  const { eligibilityTextForCount, urlSection, zeroGrantsTooltip, tabGroups } =
    useOpportunityConfigurations()[opportunityType];

  // TODO(#7966): the number of avatars shown is not always correct
  const defaultAvatarsShown = 4;
  const totalOpportunityCount = countOpportunities(opportunities);
  const sliceIndex =
    totalOpportunityCount > defaultAvatarsShown
      ? defaultAvatarsShown - 1
      : defaultAvatarsShown;
  const previewOpportunities = opportunities.slice(0, sliceIndex);
  const additionalOpportunityCount = totalOpportunityCount - sliceIndex;

  // there should always be at least one tab group to display the tab names from
  const tabGroup = Object.keys(tabGroups)[0] as OpportunityTabGroup;
  const tabNames = tabGroups[tabGroup] ?? [];
  const opportunitiesByTab = groupBy(opportunities, (opp) =>
    opp.tabTitle(tabGroup),
  );

  const navigationURL = officerPseudoId
    ? insightsUrl("supervisionOpportunity", {
        officerPseudoId,
        opportunityTypeUrl: urlSection,
      })
    : workflowsUrl("opportunityClients", { urlSection });

  return (
    <OpportunityTypeSummaryLink
      $isMobile={isMobile}
      className="OpportunityTypeSummaryLink"
      to={navigationURL}
    >
      <OpportunityHeaderWrapper $isMobile={isMobile}>
        <OpportunityHeader $isMobile={isMobile}>
          {eligibilityTextForCount(totalOpportunityCount)}
        </OpportunityHeader>
        <ReviewStatusWrapper>
          {tabNames.map((tabName) => {
            const opps = opportunitiesByTab[tabName];
            if (opps && opps.length > 0) {
              return (
                <ReviewStatusCount key={tabName}>
                  {tabName}: {opportunitiesByTab[tabName].length}
                </ReviewStatusCount>
              );
            }
            return null;
          })}
        </ReviewStatusWrapper>
        <ViewAllLabel
          $isMobile={isMobile}
          className={`ViewAllLabel__${opportunityType}`}
        >
          View all{" "}
          <ViewAllArrow>
            <Icon
              className="ViewAllLabel__icon"
              kind={IconSVG.Arrow}
              fill={palette.signal.links}
              height={16}
              width={16}
            />
          </ViewAllArrow>
        </ViewAllLabel>
      </OpportunityHeaderWrapper>
      <OpportunityInfoWrapper
        $isMobile={isMobile}
        showZeroGrantsPill={!!showZeroGrantsPill}
      >
        {showZeroGrantsPill && (
          <InsightsPill label="Zero Grants" tooltipCopy={zeroGrantsTooltip} />
        )}
        <ClientsWrapper
          $isMobile={isMobile}
          className="OpportunityClientsWrapper"
        >
          {previewOpportunities.map((opportunity) => (
            <ClientAvatarWrapper key={opportunity.person.recordId}>
              <PersonInitialsAvatar
                size={isMobile ? 40 : 56}
                name={opportunity.person.displayPreferredName}
              />
            </ClientAvatarWrapper>
          ))}
          {additionalOpportunityCount > 0 && (
            <ClientAvatarWrapper>
              <PersonInitialsAvatar
                size={isMobile ? 40 : 56}
                name={`+ ${additionalOpportunityCount}`}
                splitName={false}
              />
            </ClientAvatarWrapper>
          )}
        </ClientsWrapper>
      </OpportunityInfoWrapper>
    </OpportunityTypeSummaryLink>
  );
});

export default OpportunityTypeSummary;
