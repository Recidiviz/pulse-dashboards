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

import { palette, spacing, typography } from "@recidiviz/design-system";
import { rem } from "polished";
import styled from "styled-components/macro";

import { OfficerVitalsMetricDetail } from "../../InsightsStore/presenters/types";
import InsightsPill from "../InsightsPill";

export const StaffCardWrapper = styled.div`
  flex: 1 1 0px;
  height: ${rem(130)};
  padding: ${rem(spacing.lg)} ${rem(0)} ${rem(spacing.md)} ${rem(spacing.lg)};
  border-radius: ${rem(4)};
  border: ${rem(1)} solid ${palette.slate30};
  border-top-width: ${rem(1)};
  display: flex;
  flex-direction: row;
  justify-content: space-between;
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

const DeltaValue = styled.div<{ positiveDelta: boolean }>`
  ${typography.Sans12}
  ${({ positiveDelta }) =>
    positiveDelta
      ? `color: ${palette.pine4};`
      : `color: ${palette.signal.error};`}
`;

type InsightsStaffVitalsDetailCardProps = {
  vitalsMetricDetails: OfficerVitalsMetricDetail;
};

export const InsightsStaffVitalsDetailCard: React.FC<
  InsightsStaffVitalsDetailCardProps
> = ({ vitalsMetricDetails }) => {
  const positiveDelta = vitalsMetricDetails.metric30DDelta > 0;
  const deltaText = `${positiveDelta ? "+" : ""}${Math.round(vitalsMetricDetails.metric30DDelta)}% in past 30 days`;
  const showPill = vitalsMetricDetails.metricValue < 80;
  return (
    <StaffCardWrapper>
      <StaffCardBody>
        <StaffCardTitle>{vitalsMetricDetails.label}</StaffCardTitle>
        <MetricValue>{`${vitalsMetricDetails.metricValue}%`}</MetricValue>
        <DeltaValue positiveDelta={positiveDelta}>{deltaText}</DeltaValue>
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
