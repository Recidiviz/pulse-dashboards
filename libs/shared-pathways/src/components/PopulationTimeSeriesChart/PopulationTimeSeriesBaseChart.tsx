// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

import { scaleTime } from "d3-scale";
import React from "react";
import { ResponsiveXYFrame } from "semiotic";
import styled, { useTheme } from "styled-components";

import useIsMobile from "~utils/react/useIsMobile";

import {
  ScrollLayout,
  ScrollWrapper,
  StickyAxis,
  useChartScroll,
} from "../chartScrollUtils";
import { PathwaysTheme } from "../PathwaysTheme";
import VizPathways from "../VizPathways";
import { ChartPoint, formatMonthAndYear, getTickValues } from "./helpers";
import PopulationTimeSeriesTooltip from "./PopulationTimeSeriesTooltip";

const ChartWrapper = styled(VizPathways)`
  .PopulationTimeSeriesChart__projectedLine {
    stroke: ${({ theme }) => theme.palette.data.indigo1};
    stroke-width: 2;
    stroke-dasharray: 2 3;
  }

  .projection-area-label {
    fill: ${({ theme }) => theme.palette.slate80};
  }

  .projection-area {
    fill: ${({ theme }) => theme.palette.marble4};
    fill-opacity: 0;
  }
`;

type PlotLine = {
  data: ChartPoint[];
  class: string;
};

type Props = {
  title: string;
  subtitle?: string;
  historicalPopulation: ChartPoint[];
  projectedPopulation?: ChartPoint[];
  chartTop: number;
  chartBottom: number;
  dateSpacing: number;
  beginDate: Date;
  endDate: Date;
  [k: string]: unknown;
};

const SCROLL_THRESHOLD = 20;
const MIN_POINT_WIDTH = 40;
const SCROLL_LEFT_MARGIN = 40;
const MARGIN_RIGHT = 50;
const CHART_HEIGHT = 558;
const MARGIN_TOP = 56;
const MARGIN_BOTTOM = 96;

function computeYTicks(bottom: number, top: number): number[] {
  const ticks: number[] = [];
  const step = Math.ceil((top - bottom) / 5);
  if (step <= 0) return [bottom];
  for (let v = bottom; v <= top; v += step) {
    ticks.push(v);
  }
  return ticks;
}

const PopulationTimeSeriesBaseChart: React.FC<Props> = ({
  title,
  subtitle,
  historicalPopulation,
  projectedPopulation,
  chartTop,
  chartBottom,
  dateSpacing,
  beginDate,
  endDate,
  ...chartProps
}) => {
  const theme = useTheme() as PathwaysTheme;
  const { isMobile } = useIsMobile(true);
  const charWidth = theme.chart.axisLabel.charWidth;
  const leftMargin = (chartTop.toString().length + 1.5) * charWidth;

  const historicalLine = {
    class: "VizPathways__historicalLine",
    data: historicalPopulation,
  };

  const projectedLine = {
    class: "PopulationTimeSeriesChart__projectedLine",
    data: projectedPopulation,
  };

  const allPoints = projectedPopulation
    ? historicalPopulation.concat(projectedPopulation.slice(1))
    : historicalPopulation;

  const tickValues = getTickValues(allPoints, dateSpacing);

  const needsScroll = isMobile && allPoints.length > SCROLL_THRESHOLD;
  const scrollWidth = needsScroll
    ? allPoints.length * MIN_POINT_WIDTH + SCROLL_LEFT_MARGIN + MARGIN_RIGHT
    : undefined;

  const { scrollRef, wrapperRef, scrollOffset, fadeRight, fadeLeft } =
    useChartScroll({
      needsScroll,
      scrollWidth,
      itemCount: allPoints.length,
      leftMargin: SCROLL_LEFT_MARGIN,
      rightMargin: MARGIN_RIGHT,
    });

  const plotHeight = CHART_HEIGHT - MARGIN_TOP - MARGIN_BOTTOM;

  const yTickValues = computeYTicks(chartBottom, chartTop);

  const frameProps = {
    responsiveWidth: true,
    summaryDataAccessor: "data",
    summaryClass: "projection-area",
    hoverAnnotation: true,
    // eslint-disable-next-line react/no-unstable-nested-components
    tooltipContent: (d: ChartPoint) => <PopulationTimeSeriesTooltip d={d} />,
    lines: projectedPopulation
      ? [historicalLine, projectedLine]
      : [historicalLine],
    lineDataAccessor: "data",
    lineClass: (l: PlotLine) => l.class,
    xScaleType: scaleTime(),
    xAccessor: "date",
    yAccessor: "value",
    size: [558, CHART_HEIGHT],
    margin: {
      left: leftMargin,
      bottom: MARGIN_BOTTOM,
      right: MARGIN_RIGHT,
      top: MARGIN_TOP,
    },
    xExtent: [beginDate, endDate],
    yExtent: [chartBottom, chartTop],
    showLinePoints: true,
    pointClass: "VizPathways__point",
    axes: [
      { orient: "left", tickFormat: (n: number) => n.toLocaleString() },
      {
        orient: "bottom",
        tickValues,
        tickFormat: (d: Date) => formatMonthAndYear(d),
      },
    ],
    ...chartProps,
  };

  const scrollFrameProps = needsScroll
    ? {
        ...frameProps,
        margin: {
          left: SCROLL_LEFT_MARGIN,
          bottom: MARGIN_BOTTOM,
          right: MARGIN_RIGHT,
          top: MARGIN_TOP,
        },
        axes: [
          {
            orient: "left" as const,
            tickFormat: () => "",
            tickValues: yTickValues,
          },
          {
            orient: "bottom" as const,
            tickValues,
            tickFormat: (d: Date) => formatMonthAndYear(d),
          },
        ],
      }
    : undefined;

  return (
    <ChartWrapper title={title} subtitle={subtitle}>
      <div ref={wrapperRef}>
        {needsScroll ? (
          <ScrollLayout>
            <StickyAxis width={leftMargin} height={CHART_HEIGHT}>
              {yTickValues.map((tick: number) => {
                const y =
                  MARGIN_TOP +
                  (1 - (tick - chartBottom) / (chartTop - chartBottom)) *
                    plotHeight;
                return (
                  <text
                    key={tick}
                    x={leftMargin - 8}
                    y={y}
                    textAnchor="end"
                    dominantBaseline="middle"
                  >
                    {tick.toLocaleString()}
                  </text>
                );
              })}
            </StickyAxis>
            <ScrollWrapper
              ref={scrollRef}
              $fadeRight={fadeRight}
              $fadeLeft={fadeLeft}
            >
              <div
                style={{
                  width: scrollWidth,
                  flexShrink: 0,
                  transform: `translateX(-${scrollOffset}px)`,
                }}
              >
                {/* @ts-expect-error semiotic types don't accept Date[] tickValues */}
                <ResponsiveXYFrame {...scrollFrameProps} />
              </div>
            </ScrollWrapper>
          </ScrollLayout>
        ) : (
          // @ts-expect-error semiotic types don't accept Date[] tickValues
          <ResponsiveXYFrame {...frameProps} />
        )}
      </div>
      <div id="chart-description" className="sr-only">
        A line chart showing the population over time.
      </div>
      <div id="chart-instructions" className="sr-only">
        Press tab to access the line, and tab again to access the points. Use
        arrow keys to hear more information about each point.
      </div>
    </ChartWrapper>
  );
};

export default PopulationTimeSeriesBaseChart;
