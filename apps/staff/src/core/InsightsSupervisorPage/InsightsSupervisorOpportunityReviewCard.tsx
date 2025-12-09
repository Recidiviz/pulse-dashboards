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

import { Sans16, Sans24, spacing } from "@recidiviz/design-system";
import { rem } from "polished";
import React from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";

import { OpportunityCardInfo } from "~datatypes";
import { palette } from "~design-system";

import useIsMobile from "../../hooks/useIsMobile";
import { insightsUrl } from "../views";
import {
  ViewAll,
  ViewAllLabel,
} from "../WorkflowsHomepage/WorkflowsHomepageSummary";
import { BORDER_RADIUS, CardSubtitle } from "./styles";

const CardWrapper = styled.div`
  color: ${palette.pine1};
  width: ${rem(977)};
  height: ${rem(135)};
  padding: ${rem(spacing.md)};
  border-radius: ${BORDER_RADIUS};
  border: ${rem(1)} solid ${palette.slate30};
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  ${ViewAllLabel} {
    padding: 0;
  }
`;

const SupervisorViewAll = styled(ViewAll)`
  padding-top: 0 !important;
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const HeaderText = styled(Sans16)`
  color: ${palette.pine1};
  font-weight: 600;
`;

const SupervisorReviewCardLink = styled(Link)`
  display: flex;
  width: ${rem(977)};
  margin-bottom: ${rem(spacing.lg)};

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

const SupervisorReviewItems = styled.div`
  display: flex;
`;

const SupervisorReviewItem = styled.div`
  display: flex;
  flex-direction: column;
  margin-top: ${rem(spacing.md)};
  &:not(:first-child) {
    border-left: 1px solid ${palette.slate20};
    padding-left: ${rem(spacing.md)};
    margin-left: ${rem(spacing.xxl)};
  }
`;

const StatusCount = styled(Sans24)`
  margin-top: ${rem(spacing.sm)};
`;

type InsightsSupervisorOpportunityReviewCardProps = {
  opportunityInfo: OpportunityCardInfo;
  supervisorPseudoId: string;
};

/**
 * A card rendered within the Opportunity Module that highlights how many
 * officer requests are awaiting supervisor approval for the given opportunity.
 * Links out to the Supervisor Opportunity page (where a supervisor can then take
 * action on the relevant opportunities).
 */
export const InsightsSupervisorOpportunityReviewCard: React.FC<
  InsightsSupervisorOpportunityReviewCardProps
> = ({
  opportunityInfo: { label, supervisorReviewCounts, urlSection },
  supervisorPseudoId,
}) => {
  const { isMobile } = useIsMobile(true);

  if (!supervisorReviewCounts) return null;

  const reviewLabel = `${label} requires supervisor review`;

  return (
    <SupervisorReviewCardLink
      to={insightsUrl("supervisionSupervisorOpportunity", {
        supervisorPseudoId,
        opportunityTypeUrl: urlSection,
      })}
    >
      <CardWrapper>
        <CardHeader>
          <HeaderText>{reviewLabel}</HeaderText>
          <SupervisorViewAll isMobile={isMobile} />
        </CardHeader>
        <SupervisorReviewItems>
          {Object.entries(supervisorReviewCounts).map(
            ([statusLabel, count]) => (
              <SupervisorReviewItem key={statusLabel}>
                <CardSubtitle>{statusLabel}</CardSubtitle>
                <StatusCount>{count}</StatusCount>
              </SupervisorReviewItem>
            ),
          )}
        </SupervisorReviewItems>
      </CardWrapper>
    </SupervisorReviewCardLink>
  );
};
