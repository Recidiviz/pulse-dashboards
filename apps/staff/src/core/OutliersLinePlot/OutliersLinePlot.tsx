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
import useMeasure from "react-use-measure";
import { ResponsiveXYFrame } from "semiotic";
import styled from "styled-components/macro";

import useIsMobile from "../../hooks/useIsMobile";
import { TargetStatus } from "../../OutliersStore/models/schemaHelpers";
import { MetricWithConfig } from "../../OutliersStore/presenters/types";
import { formatDate, formatPercent, getTicks } from "../../utils";
import {
  circleLegendIcon,
  lineLegendIcon,
} from "../OutliersLegend/OutliersLegend";
import { GOAL_COLORS } from "../OutliersSwarmPlot/constants";

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
      stroke: ${palette.slate20};
    }
  }

  .annotation-layer {
    .frame-hover {
      stroke: none;
    }
  }
`;

const StyledTooltip = styled(Tooltip)`
  min-width: ${rem(110)};
  position: relative;
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.xs)};
  padding: ${rem(spacing.md)};
  transform: translateX(-50%) translateY(-115%);

  div {
    display: flex;
    align-items: center;
    gap: ${rem(spacing.xs)};
  }
`;

const usersLineStyles = {
  stroke: palette.slate60,
  strokeWidth: 2,
};

const statewideLineStyles = {
  ...usersLineStyles,
  strokeDasharray: "5 7",
};

const pointStyles = {
  r: 8,
  stroke: palette.white,
  strokeWidth: 2,
};

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

const formatDateToYearRange = (date: Date): string => {
  const previousYear = Number(formatDate(date, "yy")) - 1;

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

type OutliersLinePlotType = {
  metric: MetricWithConfig;
};

type Point = {
  date: Date;
  value: number;
  status?: TargetStatus;
};

const OutliersLinePlot: React.FC<OutliersLinePlotType> = ({ metric }) => {
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

  const yRange = [0, maxTickValue];

  return (
    <Wrapper ref={ref}>
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
                {formatDateToYearRange(d.date)}
                {/* eslint-disable-next-line react/no-unused-prop-types */}
                {pickedPoints.map(({ data }: { data: Point }) => {
                  const icon = data.status
                    ? circleLegendIcon(GOAL_COLORS[data.status])
                    : lineLegendIcon(palette.white80);

                  return (
                    <div key={`${data.value}_${data.date}`}>
                      {icon}
                      {data.value.toFixed(1)}%
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

export default OutliersLinePlot;
