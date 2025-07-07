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

import { Icon, spacing, typography } from "@recidiviz/design-system";
import { subMonths } from "date-fns";
import { rem } from "polished";
import styled, { css } from "styled-components/macro";

import { palette } from "~design-system";

import { OfficerVitalsMetricDetail } from "../../InsightsStore/presenters/types";
import { formatDate } from "../../utils/formatStrings";
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

function monthBefore(date: Date) {
  const previousMonth = subMonths(date, 1);
  return formatDate(previousMonth, "MMMM");
}

function deltaText({
  metricId,
  delta,
  metricDate,
  previousMetricDate,
}: {
  metricId: string;
  delta: number;
  metricDate?: Date;
  previousMetricDate?: Date;
}) {
  // TODO(#8919) no need to check `metricDate` here
  // If there is a current date but no previous date, the delta was not calculated/is not meaningful
  if (
    metricId === "timely_contact_due_date_based" &&
    metricDate &&
    !previousMetricDate
  )
    return "";

  const sign = delta > 0 ? "+" : "";
  const change = delta === 0 ? " change" : "";
  const dateComparison =
    previousMetricDate && metricId === "timely_contact_due_date_based"
      ? `compared to ${monthBefore(previousMetricDate)}`
      : `in past 30 days`;

  return `${sign}${delta}%${change} ${dateComparison}`;
}

function titleText({
  metricId,
  titleDisplayName,
  metricDate,
}: OfficerVitalsMetricDetail) {
  let dateAddendum;
  if (!metricDate) {
    // TODO(#8919) this case will be unnecessary
    dateAddendum = "";
  } else if (metricId === "timely_contact_due_date_based") {
    // The due-date-based contacts metric is calculated based on the month before the
    // current metric date. For example, when the end date is July 1,
    // the metric was calculated for the entire month of June.
    dateAddendum = `in ${monthBefore(metricDate)}`;
  } else {
    dateAddendum = `as of ${formatDate(metricDate, "MMMM d")}`;
  }

  return `${titleDisplayName} ${dateAddendum}`;
}

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
    bodyDisplayName,
    metricDate,
    previousMetricDate,
  } = vitalsMetricDetails;

  const delta = Math.round(metric30DDelta);
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
        <StaffCardTitle>{titleText(vitalsMetricDetails)}</StaffCardTitle>
        <MetricValue>{`${metricValue}%`}</MetricValue>
        <DeltaValue delta={delta}>
          {deltaText({ metricId, delta, metricDate, previousMetricDate })}
        </DeltaValue>
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
