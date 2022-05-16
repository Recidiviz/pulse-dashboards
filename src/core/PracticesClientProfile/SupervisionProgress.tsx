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

import { palette, spacing } from "@recidiviz/design-system";
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

import { UiSans14 } from "../../components/typography";
import { formatPracticesDate } from "../../utils";
import PracticesOfficerName from "../PracticesOfficerName";
import { Supervision } from "./Details";
import { ClientProfileProps } from "./types";

const Wrapper = styled.div``;

const VizHeader = styled.div`
  display: flex;
  justify-content: space-between;

  & > *:first-child {
    margin-right: ${rem(spacing.lg)};
  }
`;

const Title = styled(UiSans14)`
  color: ${palette.pine2};
`;

const TimelineDates = styled(UiSans14)`
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

function formatTimeToGo(expirationDate: Date): string {
  const today = startOfDay(new Date());
  const lastDay = startOfDay(expirationDate);

  const monthDiff = Math.abs(differenceInMonths(lastDay, today));

  const durationFromExp = intervalToDuration({ start: today, end: lastDay });
  return `${formatDuration(durationFromExp, {
    format: monthDiff < 6 ? ["months", "days"] : ["years", "months"],
    delimiter: ", ",
  })} ${today > lastDay ? "past EXP" : "to go"}`;
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
          <UiSans14>{formatTimeToGo(expirationDate)}</UiSans14>
        </div>
        <UiSans14>
          Assigned to <PracticesOfficerName officerId={officerId} />
        </UiSans14>
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
          Start: <span>{formatPracticesDate(supervisionStartDate)}</span>
        </div>
        <div>
          EXP: <span>{formatPracticesDate(expirationDate)}</span>
        </div>
      </TimelineDates>
    </Wrapper>
  );
};
