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

import { Icon, palette, spacing, typography } from "@recidiviz/design-system";
import { rem } from "polished";
import styled, { css } from "styled-components/macro";

import { OfficerVitalsMetricDetail } from "../../InsightsStore/presenters/types";
import InsightsPill from "../InsightsPill";

const HoverCta = styled.div`
  display: none;
  ${typography.Sans14};
  color: ${palette.pine4};
  border-bottom: 1px solid ${palette.pine4}; // text-decoration won't draw under the icon
  position: absolute;
  top: ${rem(spacing.md)};
  right: ${rem(spacing.md)};

  svg {
    margin-left: ${rem(spacing.xs)};
  }
`;

export const StaffCardWrapper = styled.div<{ isDrilldownEnabled?: boolean }>`
  flex: 1 1 0px;
  height: ${rem(130)};
  padding: ${rem(spacing.lg)} ${rem(0)} ${rem(spacing.md)} ${rem(spacing.lg)};
  border-radius: ${rem(2)};
  border: ${rem(1)} solid ${palette.slate30};
  border-top-width: ${rem(1)};
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  position: relative;

  ${({ isDrilldownEnabled }) =>
    isDrilldownEnabled &&
    css`
      &:hover {
        border-color: ${palette.pine4};
        box-shadow: inset 0 0 0 ${rem(1)} ${palette.pine4};
        cursor: pointer;

        ${HoverCta} {
          display: block;
        }
      }
    `}
`;

const StaffCardTitle = styled.div`
  ${typography.Sans12};
  color: ${palette.slate85};
  padding-bottom: ${rem(spacing.sm)};
`;

const StaffCardBody = styled.div``;

const PillWrapper = styled.div`
  display: flex;
  align-items: flex-end;
  padding-right: ${rem(spacing.md)};
`;

const MetricValue = styled.div`
  ${typography.Serif34}
  color: ${palette.pine2};
  line-height: ${rem(45)};
`;

const DeltaValue = styled.div<{ delta: number }>`
  ${typography.Sans12}
  color: ${({ delta }) => {
    if (delta > 0) {
      return palette.pine4;
    }
    if (delta < 0) {
      return palette.signal.error;
    }
    return palette.slate85;
  }};
`;

type InsightsStaffVitalsDetailCardProps = {
  vitalsMetricDetails: OfficerVitalsMetricDetail;
  onClick: (metricId: string) => void;
  isDrilldownEnabled: boolean;
};

export const InsightsStaffVitalsDetailCard: React.FC<
  InsightsStaffVitalsDetailCardProps
> = ({ vitalsMetricDetails, onClick, isDrilldownEnabled }) => {
  const {
    metricId,
    metric30DDelta,
    metricValue,
    tasks,
    titleDisplayName,
    bodyDisplayName,
  } = vitalsMetricDetails;

  const delta = Math.round(metric30DDelta);
  const deltaText =
    delta !== 0
      ? `${delta > 0 ? "+" : ""}${delta}% in past 30 days`
      : "0% change in past 30 days";
  const showPill = metricValue < 80;
  const hasOverdueClients = tasks.some((task) => task.isOverdue);
  const hoverCta = `See ${hasOverdueClients ? "Overdue " : ""}${bodyDisplayName}s`;

  return (
    <StaffCardWrapper
      onClick={() => onClick(metricId)}
      isDrilldownEnabled={isDrilldownEnabled}
    >
      <HoverCta>
        {hoverCta}
        <Icon kind="Arrow" size={14} style={{ display: "inline" }} />
      </HoverCta>
      <StaffCardBody>
        <StaffCardTitle>{titleDisplayName}</StaffCardTitle>
        <MetricValue>{`${metricValue}%`}</MetricValue>
        <DeltaValue delta={delta}>{deltaText}</DeltaValue>
      </StaffCardBody>
      {showPill && (
        <PillWrapper>
          <InsightsPill
            label="Low Timeliness"
            tooltipCopy="This officer is below 80% compliance."
          />
        </PillWrapper>
      )}
    </StaffCardWrapper>
  );
};
