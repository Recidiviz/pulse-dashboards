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

import { palette, Sans14, spacing, typography } from "@recidiviz/design-system";
import { scaleTime } from "d3-scale";
import {
  differenceInMonths,
  formatDuration,
  intervalToDuration,
  startOfDay,
} from "date-fns";
import { rem } from "polished";
import React from "react";
import styled from "styled-components/macro";

import { formatWorkflowsDate } from "../../utils";
import WorkflowsOfficerName from "../WorkflowsOfficerName";
import { Supervision } from "./ClientDetailSidebarComponents/Supervision";
import { Incarceration } from "./ResidentDetailSidebarComponents/Incarceration";
import { ClientProfileProps, ResidentProfileProps } from "./types";

const Wrapper = styled.div``;

const VizHeader = styled.div`
  ${typography.Sans14}
  display: flex;
  justify-content: space-between;

  & > *:first-child {
    margin-right: ${rem(spacing.lg)};
  }
`;

const Title = styled.div`
  color: ${palette.pine2};
  margin-bottom: ${rem(spacing.xs)};
`;

const OfficerAssignment = styled(Sans14)`
  flex: 0 0 auto;
`;

const TimelineDates = styled(Sans14)`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;

  & > *:first-child {
    margin-right: ${rem(spacing.sm)};
    text-align: left;
  }

  & > div {
    flex: 1 0 auto;
    text-align: right;
  }

  span {
    color: ${palette.signal.links};
  }
`;

const TimelineChart = styled.svg`
  height: ${rem(9)};
  margin-bottom: ${rem(spacing.sm)};
  margin-top: ${rem(spacing.md)};
  overflow: visible;
  width: 100%;
`;

const TimelineSentence = styled.line`
  stroke-width: ${rem(1)};
`;

const TimelineToday = styled.circle`
  r: ${rem(4.5)};
`;

function formatDateRange(start: Date, end: Date): string {
  const monthDiff = Math.abs(differenceInMonths(end, start));

  const durationFromExp = intervalToDuration({ start, end });
  return `${formatDuration(durationFromExp, {
    format: monthDiff < 6 ? ["months", "days"] : ["years", "months"],
    delimiter: " and ",
  })}`;
}

function formatSentenceLength(startDate: Date, expirationDate: Date): string {
  return formatDateRange(startDate, expirationDate);
}

function formatTimeToGo(expirationDate: Date): string {
  const today = startOfDay(new Date());
  const lastDay = startOfDay(expirationDate);

  return `${formatDateRange(today, lastDay)} ${
    today > lastDay ? "past end" : "to go"
  }`;
}

type TimelineLabels = {
  start: string;
  end: string;
};

export const ProgressTimeline = ({
  header,
  startDate,
  endDate,
  officerId,
  fallbackComponent,
  timelineLabels,
}: {
  header: string;
  startDate?: Date;
  endDate?: Date;
  officerId?: string;
  fallbackComponent: React.ReactNode;
  timelineLabels: TimelineLabels;
}): React.ReactElement => {
  // can't visualize anything if we don't have both valid dates
  if (!startDate || !endDate || endDate <= startDate)
    return <>{fallbackComponent}</>;

  const today = startOfDay(new Date());
  const expired = endDate < today;

  const timelinePosition = scaleTime()
    .domain([
      startDate,
      // timeline must extend past expiration if it's in the past
      Math.max(endDate.valueOf(), today.valueOf()),
    ])
    .range([0, 100]);

  const timelineOffset = timelinePosition(today) - timelinePosition(endDate);

  return (
    <Wrapper className="SentenceProgress">
      <VizHeader>
        <div>
          <Title>{header}</Title>
          <Sans14>
            {formatSentenceLength(startDate, endDate)} (
            {formatTimeToGo(endDate)})
          </Sans14>
        </div>
        {officerId && (
          <OfficerAssignment>
            Assigned to <WorkflowsOfficerName officerId={officerId} />
          </OfficerAssignment>
        )}
      </VizHeader>

      <TimelineChart>
        <TimelineSentence
          stroke={palette.data.gold1}
          x1={0}
          x2={`${timelinePosition(endDate) - (expired ? 0.5 : 0)}%`}
          y1="50%"
          y2="50%"
        />
        {expired && (
          <>
            <TimelineSentence
              stroke={palette.slate80}
              x1={`${timelinePosition(endDate)}%`}
              x2={`${timelinePosition(endDate)}%`}
              y1="0%"
              y2="100%"
            />
            <TimelineSentence
              stroke={palette.signal.error}
              x1={`${timelinePosition(endDate) + 0.5}%`}
              x2={`${timelinePosition(today)}%`}
              y1="50%"
              y2="50%"
            />
          </>
        )}
        <TimelineToday
          fill={expired ? palette.signal.error : palette.data.gold1}
          cx={`${timelinePosition(today)}%`}
          cy="50%"
        />
      </TimelineChart>

      <TimelineDates
        style={{
          width: `${
            expired && timelineOffset > 10
              ? timelinePosition(endDate) + timelinePosition(today) / 10
              : timelinePosition(endDate)
          }%`,
        }}
      >
        <div>
          {timelineLabels.start}: <span>{formatWorkflowsDate(startDate)}</span>
        </div>
        <div>
          {timelineLabels.end}: <span>{formatWorkflowsDate(endDate)}</span>
        </div>
      </TimelineDates>
    </Wrapper>
  );
};

export function SupervisionProgress({
  client,
}: ClientProfileProps): React.ReactElement {
  const {
    supervisionStartDate,
    expirationDate,
    assignedStaffId: officerId,
  } = client;

  return (
    <ProgressTimeline
      header="Supervision"
      startDate={supervisionStartDate}
      endDate={expirationDate}
      officerId={officerId}
      fallbackComponent={<Supervision client={client} />}
      timelineLabels={{ start: "Start", end: "End" }}
    />
  );
}

export function IncarcerationProgress({
  resident,
}: ResidentProfileProps): React.ReactElement {
  const { admissionDate, releaseDate, assignedStaffId: officerId } = resident;

  return (
    <ProgressTimeline
      header="Incarceration"
      startDate={admissionDate}
      endDate={releaseDate}
      officerId={officerId}
      fallbackComponent={<Incarceration resident={resident} />}
      timelineLabels={{ start: "Start", end: "Release" }}
    />
  );
}
