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
import { rem } from "polished";
import React from "react";
import simplur from "simplur";
import styled from "styled-components/macro";

import { OpportunityInfo } from "../../InsightsStore/models/OpportunityInfo";
import { ConfigLabels } from "../../InsightsStore/presenters/types";
import { InsightsTooltip } from "../InsightsPageLayout/InsightsPageLayout";
import { InsightsSupervisorOpportunityDetailOfficerList } from "./InsightsSupervisorOpportunityDetailOfficerList";

const WRAPPER_HEIGHT = rem(448);
const WRAPPER_WIDTH = rem(277);
const BORDER_RADIUS = rem(4);

const CardWrapper = styled.div`
  max-width: ${WRAPPER_WIDTH};
  height: ${WRAPPER_HEIGHT};
  padding: ${rem(spacing.lg)} ${rem(0)} ${rem(spacing.md)} ${rem(spacing.md)};
  gap: ${rem(32)};
  overflow: hidden;
  border-radius: ${BORDER_RADIUS};
  border: ${rem(1)} solid ${palette.slate70};
  border-top-width: ${rem(1)};
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`;

const CardHeader = styled.div`
  display: flex;
  width: 100%;
  flex-direction: row;
  justify-content: space-between;
  padding: ${rem(0)} ${rem(spacing.md)} ${rem(0)} ${rem(0)};
  min-height: ${rem(spacing.xl)};
`;

const CardHeaderText = styled.div`
  display: grid;
  gap: ${rem(4)};
  direction: column;
`;

const CardTitle = styled.h1`
  ${typography.Sans14};
  color: ${palette.pine1};
  padding: 0;
  margin: 0;
`;
const CardSubtitle = styled.h2`
  ${typography.Sans12};
  color: ${palette.slate70};
  padding: 0;
  margin: 0;
`;

type InsightsSupervisorOpportunityDetailCard = {
  opportunityInfo: OpportunityInfo;
  labels: ConfigLabels;
};

export const InsightsSupervisorOpportunityDetailCard: React.FC<
  InsightsSupervisorOpportunityDetailCard
> = ({
  labels,
  opportunityInfo: {
    label,
    priority,
    clientsEligibleCount,
    officersWithEligibleClients,
  },
}) => {
  return (
    <CardWrapper>
      <CardHeader>
        <CardHeaderText>
          <CardTitle>{label}</CardTitle>
          <CardSubtitle>{simplur`${clientsEligibleCount} ${labels.supervisionJiiLabel} opportunities`}</CardSubtitle>
        </CardHeaderText>
        {priority === "HIGH" ? (
          <InsightsTooltip contents={`High Priority`} maxWidth={310}>
            <Icon
              kind={IconSVG.Alert}
              strokeWidth={2}
              color={palette.data.gold1}
              width={16}
              height={16}
            />
          </InsightsTooltip>
        ) : undefined}
      </CardHeader>
      <InsightsSupervisorOpportunityDetailOfficerList
        label={label}
        officersWithEligibleClients={officersWithEligibleClients}
        supervisionJiiLabel={labels.supervisionJiiLabel}
      />
    </CardWrapper>
  );
};
