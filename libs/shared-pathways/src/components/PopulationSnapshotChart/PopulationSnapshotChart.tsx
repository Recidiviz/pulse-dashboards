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

import { typography } from "@recidiviz/design-system";
import React, { useState } from "react";
import { ResponsiveOrdinalFrame } from "semiotic";
import { ResponsiveFrameProps } from "semiotic/lib/ResponsiveFrame";
import styled, { css, useTheme } from "styled-components";

import { getTicks, pluralize, pluralizeWord } from "~utils";

import { SupervisionPopulationSnapshotRecord } from "../../types";
import {
  ScrollLayout,
  ScrollWrapper,
  StickyAxis,
  useChartScroll,
} from "../chartScrollUtils";
import { PathwaysTheme } from "../PathwaysTheme";
import PopulationSnapshotTooltip from "../PopulationSnapshotTooltip/PopulationSnapshotTooltip";
import VizPathways from "../VizPathways";

type SnapshotDataPoint = {
  index: number;
  accessorValue: string;
  accessorLabel: string;
  tooltipLabel: string;
  value: string;
};

type OrdinalPiece = SnapshotDataPoint & Record<string, unknown>;

type ColumnHoverAnnotation = {
  d: {
    type: string;
    pieces: Array<{ data: OrdinalPiece }>;
  };
};

type TooltipData = {
  pieces?: OrdinalPiece[];
  data?: OrdinalPiece;
};

type PopulationSnapshotChartProps = {
  metricId: string;
  data: SnapshotDataPoint[];
  title: string;
  subtitle?: string;
  latestUpdate?: string;
  chartXAxisTitle?: string;
  accessor: string;
  isRate: boolean;
  isHorizontal: boolean;
  rotateLabels: boolean;
  isGeographic: boolean;
  pickedId: string[];
  dataSeries: SupervisionPopulationSnapshotRecord[];
  horizontalLabelFormatter?: (label: string) => string;
};

const ChartWrapper = styled.div<{
  $rotateLabels: boolean;
  $isHorizontal: boolean;
}>`
  background: #fff;
  ${typography.Sans14}
  border-radius: 0.5rem;
  line-height: 1.5rem;
  width: 100%;

  .background-graphics {
    .axis.axis-tick-lines {
      stroke: none;
    }
    .left.tick-line {
      stroke: ${({ theme }) => theme.palette.slate20};
      stroke-width: 1px;
    }
  }

  .data-visualization {
    .axis-baseline.y {
      stroke: none;
    }

    .axis-label {
      fill: ${({ theme }) => theme.chart.axisLabel.color};
      font-family: ${({ theme }) => theme.chart.axisLabel.fontFamily};
      font-weight: ${({ theme }) => theme.chart.axisLabel.fontWeight};
      font-size: ${({ theme }) => theme.chart.axisLabel.fontSize};
      line-height: ${({ theme }) => theme.chart.axisLabel.lineHeight};
      letter-spacing: ${({ theme }) => theme.chart.axisLabel.letterSpacing};
    }
  }

  .foreground-graphics {
    transform: translate(0, 2rem);

    .ordinal-labels text {
      fill: ${({ theme }) => theme.chart.axisLabel.color};
      font-family: ${({ theme }) => theme.chart.axisLabel.fontFamily};
      font-weight: ${({ theme }) => theme.chart.axisLabel.fontWeight};
      font-size: ${({ theme }) => theme.chart.axisLabel.fontSize};
      line-height: ${({ theme }) => theme.chart.axisLabel.lineHeight};
      letter-spacing: ${({ theme }) => theme.chart.axisLabel.letterSpacing};
      transform: rotate(-45deg) translate(-1rem, -2rem);
    }
  }

  .annotation-layer {
    .xythreshold > .annotation-subject {
      path {
        opacity: 0.3;
        stroke-dasharray: 7;
      }
    }
  }

  ${({ $rotateLabels }) =>
    !$rotateLabels &&
    css`
      .foreground-graphics {
        transform: translate(0, 1.5rem) !important;

        .ordinal-labels text {
          transform: initial !important;
        }
      }
    `}

  ${({ $isHorizontal }) =>
    $isHorizontal &&
    css`
      .background-graphics {
        .top.tick-line {
          stroke: none;
        }
      }

      .foreground-graphics {
        transform: translate(-1rem, 0) !important;
      }
    `}
`;

const ChartXAxisTitle = styled.div`
  text-align: center;
  padding-bottom: 2rem;
  color: ${({ theme }) => theme.palette.slate85};
`;

function defaultOLabel(accessorLabel: string) {
  return <text textAnchor="middle">{accessorLabel}</text>;
}

function makeHorizontalOLabel(formatter: (label: string) => string) {
  return function horizontalOLabel(accessorLabel: string) {
    return (
      <text textAnchor="end" dominantBaseline="central">
        <tspan key={accessorLabel} x="0">
          {formatter(accessorLabel)}
        </tspan>
      </text>
    );
  };
}

function rotatedOLabel(accessorLabel: string) {
  return (
    <text textAnchor="middle">
      {accessorLabel.split(/(.*?\/)/g).map((wrapPart) => (
        <tspan key={accessorLabel} dy="1.5em" x="0">
          {wrapPart}
        </tspan>
      ))}
    </text>
  );
}

function makeDefaultTooltipContent(isRate: boolean) {
  return function defaultTooltipContent(d: TooltipData) {
    const pieceData = d.pieces?.[0] ?? d.data;
    return (
      <PopulationSnapshotTooltip
        label={pieceData?.tooltipLabel ?? ""}
        value={
          isRate
            ? `${pieceData?.value}%`
            : Number(pieceData?.value).toLocaleString() ?? ""
        }
      />
    );
  };
}

function makeHorizontalTooltipContent(
  isRate: boolean,
  dataSeries: SupervisionPopulationSnapshotRecord[],
) {
  return function horizontalTooltipContent(d: TooltipData) {
    const pieces = d.pieces ?? [];
    const pieceData = pieces[0];

    const caseloadData = dataSeries[
      pieceData.index
    ] as SupervisionPopulationSnapshotRecord;

    return (
      <PopulationSnapshotTooltip
        label={pieceData.tooltipLabel}
        value={
          isRate
            ? `${pieceData.value}%`
            : Number(pieceData.value).toLocaleString()
        }
        average={
          isRate
            ? `(${pluralize(caseloadData.count, "admission")} / ${
                caseloadData.caseload
              } unique ${pluralizeWord({
                term: "person",
                count: caseloadData.caseload,
              })} on caseload)`
            : undefined
        }
      />
    );
  };
}

const PopulationSnapshotChart: React.FC<PopulationSnapshotChartProps> = ({
  metricId,
  data,
  title,
  subtitle,
  latestUpdate,
  chartXAxisTitle,
  accessor,
  isRate,
  isHorizontal,
  rotateLabels,
  isGeographic,
  pickedId,
  dataSeries,
  horizontalLabelFormatter,
}) => {
  const theme = useTheme() as PathwaysTheme;
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  const { maxTickValue, tickValues, ticksMargin } = getTicks(
    Math.max(...data.map((d) => Number(d.value))),
  );

  const yRange = [0, maxTickValue];

  const hoverAnnotation = (annotation: ColumnHoverAnnotation) => {
    const { d } = annotation;
    const { data: pieceData } = d.pieces[0];
    setHoveredId(pieceData.index);
  };

  const SCROLL_THRESHOLD = 20;
  const MIN_BAR_WIDTH = 28;
  const SCROLL_LEFT_MARGIN = 40;
  const CHART_HEIGHT = 558;
  const MARGIN_TOP = 56;
  const MARGIN_RIGHT = 50;
  const needsScroll = !isHorizontal && data.length > SCROLL_THRESHOLD;
  const scrollWidth = needsScroll
    ? data.length * MIN_BAR_WIDTH + SCROLL_LEFT_MARGIN + MARGIN_RIGHT
    : undefined;
  const effectiveMarginBottom = rotateLabels ? 116 : 75;

  const { scrollRef, wrapperRef, scrollOffset, fadeRight, fadeLeft } =
    useChartScroll({
      needsScroll,
      scrollWidth,
      itemCount: data.length,
      leftMargin: SCROLL_LEFT_MARGIN,
      rightMargin: MARGIN_RIGHT,
    });

  const barColor = isGeographic
    ? theme.palette.data.gold2
    : theme.palette.data.forest2;

  const chartProps = {
    key: metricId,
    responsiveWidth: true,
    hoverAnnotation: true,
    type: "bar" as const,
    data,
    oAccessor: "accessorLabel",
    projection: "vertical",
    customHoverBehavior: (piece: OrdinalPiece | undefined) => {
      if (piece) {
        setHoveredId(piece.index);
      } else {
        setHoveredId(null);
      }
    },
    baseMarkProps: { transitionDuration: { default: 500 } },
    size: [558, 558],
    margin: {
      left: ticksMargin,
      bottom: 75,
      right: 50,
      top: 56,
    },
    oPadding: data.length > 25 ? 2 : 15,
    style: (d: OrdinalPiece) => {
      const isPicked = pickedId.includes(d.accessorValue);
      const isHovered = d.index === hoveredId;
      const opacity =
        (hoveredId === null && pickedId[0] === "ALL") ||
        (hoveredId === null && pickedId.length === 0) ||
        isHovered ||
        isPicked
          ? 1
          : 0.75;

      return { fill: barColor, fillOpacity: opacity };
    },
    rAccessor: "value",
    rExtent: yRange,
    axes: [
      {
        orient: "left" as const,
        tickFormat: (n: number) => (isRate ? `${n}%` : n.toLocaleString()),
        tickValues,
      },
    ],
    oLabel: defaultOLabel,
    svgAnnotationRules: (annotation: ColumnHoverAnnotation) => {
      const {
        d: { type },
      } = annotation;
      if (type === "column-hover") {
        return hoverAnnotation(annotation);
      }
      setHoveredId(null);
      return null;
    },
    tooltipContent: makeDefaultTooltipContent(isRate),
    ...(isHorizontal && {
      projection: "horizontal",
      size: [558, data.length * 25 + 150],
      margin: {
        left: 80,
        bottom: 75,
        right: 50,
        top: 56,
      },
      axes: [
        {
          orient: "top" as const,
          tickFormat: (n: number) => (isRate ? `${n}%` : n.toLocaleString()),
          tickValues,
        },
      ],
      oLabel: makeHorizontalOLabel(horizontalLabelFormatter ?? ((l) => l)),
      tooltipContent: makeHorizontalTooltipContent(isRate, dataSeries),
    }),
    ...(rotateLabels && {
      margin: {
        left: ticksMargin,
        bottom: 116,
        right: 50,
        top: 56,
      },
      axes: [
        {
          orient: "left" as const,
          tickFormat: (n: number) => (isRate ? `${n}%` : n.toLocaleString()),
          tickValues,
        },
      ],
      oLabel: rotatedOLabel,
    }),
  };

  const scrollChartProps = needsScroll
    ? ({
        ...chartProps,
        margin: {
          left: SCROLL_LEFT_MARGIN,
          bottom: effectiveMarginBottom,
          right: 50,
          top: MARGIN_TOP,
        },
        axes: [
          {
            orient: "left" as const,
            tickFormat: () => "",
            tickValues,
          },
        ],
      } as ResponsiveFrameProps)
    : undefined;

  const plotHeight = CHART_HEIGHT - MARGIN_TOP - effectiveMarginBottom;

  return (
    <VizPathways title={title} latestUpdate={latestUpdate} subtitle={subtitle}>
      <ChartWrapper
        ref={wrapperRef}
        $rotateLabels={rotateLabels}
        $isHorizontal={isHorizontal}
      >
        {needsScroll ? (
          <ScrollLayout>
            <StickyAxis width={ticksMargin} height={CHART_HEIGHT}>
              {tickValues.map((tick: number) => {
                const y = MARGIN_TOP + (1 - tick / maxTickValue) * plotHeight;
                return (
                  <text
                    key={tick}
                    x={ticksMargin - 8}
                    y={y}
                    textAnchor="end"
                    dominantBaseline="middle"
                  >
                    {isRate ? `${tick}%` : tick.toLocaleString()}
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
                <ResponsiveOrdinalFrame {...scrollChartProps} />
              </div>
            </ScrollWrapper>
          </ScrollLayout>
        ) : (
          <ResponsiveOrdinalFrame {...chartProps} />
        )}
        {chartXAxisTitle && (
          <ChartXAxisTitle>{chartXAxisTitle}</ChartXAxisTitle>
        )}
        <div id="chart-description" className="sr-only">
          A bar chart showing the population by {accessor}.
        </div>
        <div id="chart-instructions" className="sr-only">
          Press tab to select the chart. Use arrow keys to hear more information
          about each bar.
        </div>
      </ChartWrapper>
    </VizPathways>
  );
};

export default PopulationSnapshotChart;
export type { PopulationSnapshotChartProps, SnapshotDataPoint };
