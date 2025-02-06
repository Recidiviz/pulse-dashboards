// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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
  palette,
  spacing,
  Tooltip,
  typography,
} from "@recidiviz/design-system";
import { rem } from "polished";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import useMeasure from "react-use-measure";
import { ResponsiveXYFrame } from "semiotic";
import styled from "styled-components/macro";

import { TargetStatus } from "~datatypes";

import useIsMobile from "../../hooks/useIsMobile";
import { MetricWithConfig } from "../../InsightsStore/presenters/types";
import { formatDate, formatPercent, getTicks } from "../../utils";
import { GOAL_COLORS } from "../InsightsSwarmPlot/constants";
import NoteComponent from "./NoteComponent";

const Wrapper = styled.div`
  .data-visualization {
    .axis-baseline {
      stroke: none;
    }

    .axis-label {
      fill: ${palette.slate60};
    }

    .axis.bottom {
      transform: translateX(4px);
    }

    .axis.left {
      ${typography.Sans12}
      transform: translate(10px, 10px);
      text-anchor: start;

      text {
        text-anchor: start;
      }
    }
  }

  .background-graphics {
    .x.tick-line {
      stroke: none;
    }

    .y.tick-line {
      stroke: none;
    }
  }

  .annotation-layer {
    .frame-hover {
      stroke: none;
    }
  }
`;

const StyledLink = styled(Link)`
  color: ${palette.signal.links} !important;
  border-bottom: 1px solid ${palette.signal.links};
`;

const StyledTooltip = styled(Tooltip).attrs({
  backgroundColor: palette.pine2,
})`
  min-width: ${rem(190)};
  position: relative;
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.xs)};
  padding: ${rem(spacing.md)};
  transform: translateX(-50%) translateY(-115%);
  border-radius: 8px;

  div:first-child {
    margin-bottom: ${rem(spacing.xs)};
  }

  div {
    display: flex;
    align-items: center;
    gap: ${rem(spacing.sm)};
    white-space: nowrap;

    span {
      font-weight: 700;
      margin-left: auto;
    }
  }
`;

const getDateRange = (
  firstDate: Date,
  lastDate: Date,
  offset: number,
): { beginDate: Date; endDate: Date } => {
  const beginDate = new Date(firstDate);
  const endDate = new Date(lastDate);

  beginDate.setDate(beginDate.getDate() - offset);
  endDate.setDate(endDate.getDate() + offset);

  if (!firstDate && !lastDate)
    return {
      beginDate: new Date(9999, 11, 31),
      endDate: new Date(9999, 11, 31),
    };

  return { beginDate, endDate };
};

const formatDateToYearRange = (date: Date, isExpanded?: boolean): string => {
  const previousYear = Number(formatDate(date, isExpanded ? "yyyy" : "yy")) - 1;

  if (isExpanded)
    return `${formatDate(date, "MMMM")} ${previousYear} – ${formatDate(
      date,
      "yyyy",
    )}`;

  return `${formatDate(date, "MMM")} '${previousYear} - '${formatDate(
    date,
    "yy",
  )}`;
};

const reduceBottomTicks = (ticks: Date[], isMobile: boolean) => {
  const result = ticks.filter((_, index: number) =>
    isMobile ? index % 2 !== 0 : index % 2 === 0,
  );
  if (isMobile ? ticks.length % 2 === 0 : ticks.length % 2 !== 0)
    return result.slice(0, -1);

  return result;
};

type InsightsLinePlotType = {
  metric: MetricWithConfig;
  officerName?: string;
  supervisionOfficerLabel: string;
  methodologyUrl: string;
  eventName: string;
};

type Point = {
  date: Date;
  value: number;
  status?: TargetStatus;
};

interface NoteConfig {
  label: string;
  text: JSX.Element;
  shouldRender: boolean;
}

const InsightsLinePlot: React.FC<InsightsLinePlotType> = ({
  metric,
  officerName,
  supervisionOfficerLabel,
  methodologyUrl,
  eventName,
}) => {
  const { isMobile, isLaptop } = useIsMobile(true);
  const [ref, bounds] = useMeasure();

  const usersPoints: Point[] = metric.statusesOverTime.map((d) => ({
    date: d.endDate,
    value: d.metricRate * 100,
    status: d.status,
  }));
  const statewidePoints: Point[] = metric.benchmark.benchmarks.map((d) => ({
    date: d.endDate,
    value: d.target * 100,
  }));

  const usersLineStyles = {
    stroke: palette.data.teal1,
    strokeWidth: 2,
  };

  const statewideLineStyles = {
    ...usersLineStyles,
    strokeDasharray: "5 7",
  };

  const pointStyles = {
    r: 6,
    stroke: palette.white,
    strokeWidth: 2,
  };

  const usersLine = {
    lineStyles: usersLineStyles,
    data: usersPoints,
  };
  const statewideLine = {
    lineStyles: statewideLineStyles,
    data: statewidePoints,
  };

  const { beginDate, endDate } = getDateRange(
    statewidePoints[0]?.date,
    statewidePoints.slice(-1)[0]?.date,
    16,
  );

  const bottomTickValues = statewidePoints.map((d) => d.date);
  const reducedBottomTickValues = reduceBottomTicks(bottomTickValues, isMobile);

  const { maxTickValue } = getTicks(
    Math.max(...usersPoints.concat(statewidePoints).map((d) => d.value)),
  );

  const yRange = [0, maxTickValue + 5];

  const OverOneHundredNoteText = (
    <>
      This rate is calculated by taking the total number of {eventName} on this{" "}
      {supervisionOfficerLabel}'s caseload in the past 12 months and dividing it
      by the {supervisionOfficerLabel}'s average <i>daily</i> caseload. As a
      result, this rate can be over 100%.
    </>
  );

  const DataUnavailableNoteText = (
    <>
      {supervisionOfficerLabel[0].toUpperCase() +
        supervisionOfficerLabel.slice(1)}{" "}
      was excluded from some portion of this chart due to unusual patterns in
      their caseload. For more, see{" "}
      <StyledLink to={methodologyUrl}>methodology</StyledLink>.
    </>
  );

  const notes: NoteConfig[] = [
    {
      label: `Why is this rate over 100%?`,
      text: OverOneHundredNoteText,
      shouldRender: usersPoints.some((point) => point.value > 100),
    },
    {
      label: `Data is unavailable`,
      text: DataUnavailableNoteText,
      shouldRender: metric.statusesOverTime.length < 6,
    },
  ];

  const [currentNoteIndex, setCurrentNoteIndex] = useState(0);
  const renderedNotes = notes.filter((note) => note.shouldRender);

  const handleNextNote = () => {
    if (currentNoteIndex < renderedNotes.length - 1) {
      setCurrentNoteIndex(currentNoteIndex + 1);
    }
  };
  const handlePreviousNote = () => {
    if (currentNoteIndex > 0) {
      setCurrentNoteIndex(currentNoteIndex - 1);
    }
  };

  return (
    <Wrapper ref={ref}>
      {renderedNotes.length > 0 && (
        <NoteComponent
          key={currentNoteIndex}
          showFooter={renderedNotes.length > 1}
          onNext={handleNextNote}
          onPrevious={handlePreviousNote}
          index={currentNoteIndex}
          numNotes={renderedNotes.length}
          label={renderedNotes[currentNoteIndex].label}
          text={renderedNotes[currentNoteIndex].text}
        />
      )}

      <ResponsiveXYFrame
        responsiveWidth={!bounds.width}
        hoverAnnotation
        // eslint-disable-next-line react/no-unstable-nested-components
        tooltipContent={(d: any) => {
          const pickedPoints = d.points.filter(({ data }: { data: Point }) => {
            return new Date(data.date).getTime() === new Date(d.x).getTime();
          });

          return (
            d.parentLine.key === 0 && (
              <StyledTooltip>
                <div>{formatDateToYearRange(d.date)}</div>
                {/* eslint-disable-next-line react/no-unused-prop-types */}
                {pickedPoints.map(({ data }: { data: Point }) => {
                  return (
                    <div key={`${data.value}_${data.date}`}>
                      {data.status ? officerName : "Statewide Rate"}
                      <span>{data.value.toFixed(1)}%</span>
                    </div>
                  );
                })}
              </StyledTooltip>
            )
          );
        }}
        // @ts-ignore
        lines={[usersLine, statewideLine]}
        lineDataAccessor="data"
        lineStyle={(l: any) => l.lineStyles}
        xAccessor="date"
        yAccessor="value"
        size={[bounds.width - 10, 300]}
        margin={{
          bottom: 32,
        }}
        // @ts-ignore
        xExtent={[beginDate, endDate]}
        yExtent={yRange}
        showLinePoints
        pointStyle={(p: any) => {
          if (p.status) {
            return {
              fill: GOAL_COLORS[p.status as TargetStatus],
              ...pointStyles,
            };
          }
          return { fill: "none" };
        }}
        axes={[
          {
            orient: "left",
            ticks: 5,
            tickFormat: (n: number, t: number) =>
              t === 0 ? null : formatPercent(n),
          },
          {
            orient: "bottom",
            // @ts-ignore
            tickValues: isLaptop ? reducedBottomTickValues : bottomTickValues,
            tickFormat: (d: Date) => formatDateToYearRange(d),
          },
        ]}
      />
    </Wrapper>
  );
};

export default InsightsLinePlot;
