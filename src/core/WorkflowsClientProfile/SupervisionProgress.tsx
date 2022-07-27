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
import { Supervision } from "./Details";
import { ClientProfileProps } from "./types";

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
  stroke: ${palette.data.gold1};
  stroke-width: ${rem(1)};
`;

const TimelineToday = styled.circle`
  fill: ${palette.data.gold1};
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
    today > lastDay ? "past EXP" : "to go"
  }`;
}

export const SupervisionProgress = ({
  client,
}: ClientProfileProps): React.ReactElement => {
  const { supervisionStartDate, expirationDate, officerId } = client;

  // can't visualize anything if we don't have both valid dates
  if (
    !supervisionStartDate ||
    !expirationDate ||
    expirationDate <= supervisionStartDate
  )
    return <Supervision client={client} />;

  const today = startOfDay(new Date());
  const timelinePosition = scaleTime()
    .domain([
      supervisionStartDate,
      // timeline must extend past expiration if it's in the past
      Math.max(expirationDate.valueOf(), today.valueOf()),
    ])
    .range([0, 100]);

  return (
    <Wrapper>
      <VizHeader>
        <div>
          <Title>Supervision</Title>
          <Sans14>
            {formatSentenceLength(supervisionStartDate, expirationDate)} (
            {formatTimeToGo(expirationDate)})
          </Sans14>
        </div>
        <OfficerAssignment>
          Assigned to <WorkflowsOfficerName officerId={officerId} />
        </OfficerAssignment>
      </VizHeader>

      <TimelineChart>
        <TimelineSentence
          x1={0}
          x2={`${timelinePosition(expirationDate)}%`}
          y1="50%"
          y2="50%"
        />
        <TimelineToday
          cx={`${timelinePosition(today)}%`}
          cy="50%"
          r={rem(4.5)}
        />
      </TimelineChart>

      <TimelineDates style={{ width: `${timelinePosition(expirationDate)}%` }}>
        <div>
          Start: <span>{formatWorkflowsDate(supervisionStartDate)}</span>
        </div>
        <div>
          EXP: <span>{formatWorkflowsDate(expirationDate)}</span>
        </div>
      </TimelineDates>
    </Wrapper>
  );
};
