// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import { Link } from "react-router-dom";
import styled from "styled-components/macro";

import { palette } from "~design-system";
import { PersonInitialsAvatar } from "~ui";

import useIsMobile from "../../hooks/useIsMobile";
import { JusticeInvolvedPerson } from "../../WorkflowsStore";
import InsightsPill from "../InsightsPill";

const ViewAllLabel = styled.div<{ $isMobile: boolean }>`
  ${({ $isMobile }) => ($isMobile ? typography.Sans16 : typography.Sans18)}
  color: ${palette.signal.links};
  display: flex;
  align-items: center;
  width: 7rem;
  padding-top: ${rem(spacing.md)};
`;

const HomepageSummaryLink = styled(Link)<{
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

const HomepageHeaderWrapper = styled.div<{
  $isMobile: boolean;
}>`
  padding-right: ${({ $isMobile }) => ($isMobile ? 0 : rem(spacing.xxl))};
  width: ${({ $isMobile }) => (!$isMobile ? rem(750) : "100%")};

  ${({ $isMobile }) => $isMobile && "order: 2;"}
`;

const HomepageHeader = styled.div<{
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

const HomepageInfoWrapper = styled.div<{
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

const PersonsWrapper = styled.div<{ $isMobile: boolean }>`
  display: flex;
  flex-flow: row nowrap;

  ${({ $isMobile }) => $isMobile && "margin: 0 1rem 1rem; order: -1;"}
`;

const PersonAvatarWrapper = styled.div`
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

type ZeroGrantsSettings =
  | {
      showZeroGrantsPill: true;
      zeroGrantsTooltip: string | undefined;
    }
  | {
      showZeroGrantsPill: false;
      zeroGrantsTooltip?: string | undefined;
    };

type WorkflowsHomepageSummaryProps = ZeroGrantsSettings & {
  url: string;
  headerText: string;
  reviewStatusCounts?: Record<string, number>;
  totalCount: number;
  people: readonly JusticeInvolvedPerson[];
};

export const WorkflowsHomepageSummary = observer(
  function WorkflowsHomepageSummary({
    url,
    headerText,
    reviewStatusCounts = {},
    totalCount,
    people,
    showZeroGrantsPill,
    zeroGrantsTooltip,
  }: WorkflowsHomepageSummaryProps): React.ReactElement | null {
    const { isMobile } = useIsMobile(true);
    // TODO(#7966): the number of avatars shown is not always correct
    const defaultAvatarsShown = 4;
    const sliceIndex =
      totalCount > defaultAvatarsShown
        ? defaultAvatarsShown - 1
        : defaultAvatarsShown;
    const previewPeople = people.slice(0, sliceIndex);
    const additionalCount = totalCount - sliceIndex;

    return (
      <HomepageSummaryLink $isMobile={isMobile} to={url}>
        <HomepageHeaderWrapper $isMobile={isMobile}>
          <HomepageHeader $isMobile={isMobile}>{headerText}</HomepageHeader>
          <ReviewStatusWrapper>
            {Object.entries(reviewStatusCounts).map(([status, count]) => {
              if (count > 0) {
                return (
                  <ReviewStatusCount key={status}>
                    {status}: {count}
                  </ReviewStatusCount>
                );
              }
              return null;
            })}
          </ReviewStatusWrapper>
          <ViewAllLabel $isMobile={isMobile}>
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
        </HomepageHeaderWrapper>

        <HomepageInfoWrapper
          $isMobile={isMobile}
          showZeroGrantsPill={showZeroGrantsPill}
        >
          {showZeroGrantsPill && (
            <InsightsPill label="Zero Grants" tooltipCopy={zeroGrantsTooltip} />
          )}
          <PersonsWrapper $isMobile={isMobile}>
            {previewPeople.map((person) => (
              <PersonAvatarWrapper key={person.recordId}>
                <PersonInitialsAvatar
                  size={isMobile ? 40 : 56}
                  name={person.displayPreferredName}
                />
              </PersonAvatarWrapper>
            ))}
            {additionalCount > 0 && (
              <PersonAvatarWrapper>
                <PersonInitialsAvatar
                  size={isMobile ? 40 : 56}
                  name={`+ ${additionalCount}`}
                  splitName={false}
                />
              </PersonAvatarWrapper>
            )}
          </PersonsWrapper>
        </HomepageInfoWrapper>
      </HomepageSummaryLink>
    );
  },
);
