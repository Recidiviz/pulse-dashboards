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
import React, { useEffect, useRef, useState } from "react";
import { ResponsiveOrdinalFrame } from "semiotic";
import { ResponsiveFrameProps } from "semiotic/lib/ResponsiveFrame";
import styled, { css, useTheme } from "styled-components";

import { formatName, getTicks, pluralize, pluralizeWord } from "~utils";

import { SupervisionPopulationSnapshotRecord } from "../../types";
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
      fill: ${({ theme }) => theme.typography.axisLabel.color};
      font-family: ${({ theme }) => theme.typography.axisLabel.fontFamily};
      font-weight: ${({ theme }) => theme.typography.axisLabel.fontWeight};
      font-size: ${({ theme }) => theme.typography.axisLabel.fontSize};
      line-height: ${({ theme }) => theme.typography.axisLabel.lineHeight};
      letter-spacing: ${({ theme }) =>
        theme.typography.axisLabel.letterSpacing};
    }
  }

  .foreground-graphics {
    transform: translate(0, 2rem);

    .ordinal-labels text {
      fill: ${({ theme }) => theme.typography.axisLabel.color};
      font-family: ${({ theme }) => theme.typography.axisLabel.fontFamily};
      font-weight: ${({ theme }) => theme.typography.axisLabel.fontWeight};
      font-size: ${({ theme }) => theme.typography.axisLabel.fontSize};
      line-height: ${({ theme }) => theme.typography.axisLabel.lineHeight};
      letter-spacing: ${({ theme }) =>
        theme.typography.axisLabel.letterSpacing};
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
        transform: translate(-1rem, -1.2rem) !important;
      }
    `}
`;

const ChartXAxisTitle = styled.div`
  text-align: center;
  padding-bottom: 2rem;
  color: ${({ theme }) => theme.palette.slate85};
`;

const ScrollLayout = styled.div`
  display: flex;
`;

const StickyAxis = styled.svg`
  flex-shrink: 0;

  text {
    fill: ${({ theme }) => theme.typography.axisLabel.color};
    font-family: ${({ theme }) => theme.typography.axisLabel.fontFamily};
    font-weight: ${({ theme }) => theme.typography.axisLabel.fontWeight};
    font-size: ${({ theme }) => theme.typography.axisLabel.fontSize};
    line-height: ${({ theme }) => theme.typography.axisLabel.lineHeight};
    letter-spacing: ${({ theme }) => theme.typography.axisLabel.letterSpacing};
  }
`;

const ScrollWrapper = styled.div<{
  $fadeRight: boolean;
  $fadeLeft: boolean;
}>`
  flex: 1;
  min-width: 0;
  overflow: clip;
  position: relative;

  ${({ $fadeRight, $fadeLeft }) => {
    if ($fadeRight && $fadeLeft) {
      return css`
        mask-image: linear-gradient(
          to right,
          transparent,
          white 8%,
          white 92%,
          transparent
        );
      `;
    }
    if ($fadeRight) {
      return css`
        mask-image: linear-gradient(to left, transparent, white 8%);
      `;
    }
    if ($fadeLeft) {
      return css`
        mask-image: linear-gradient(to right, transparent, white 8%);
      `;
    }
    return "";
  }}
`;

function defaultOLabel(accessorLabel: string) {
  return <text textAnchor="middle">{accessorLabel}</text>;
}

function horizontalOLabel(accessorLabel: string) {
  return (
    <text textAnchor="end">
      <tspan key={accessorLabel} dy="1.5em" x="0">
        {formatName(accessorLabel)}
      </tspan>
    </text>
  );
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
        value={isRate ? `${pieceData?.value}%` : pieceData?.value ?? ""}
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
        value={isRate ? `${pieceData.value}%` : pieceData.value}
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

  const scrollRef = useRef<HTMLDivElement>(null);

  const SCROLL_THRESHOLD = 20;
  const MIN_BAR_WIDTH = 28;
  const SCROLL_LEFT_MARGIN = 40;
  const CHART_HEIGHT = 558;
  const MARGIN_TOP = 56;
  const needsScroll = !isHorizontal && data.length > SCROLL_THRESHOLD;
  const scrollWidth = needsScroll
    ? data.length * MIN_BAR_WIDTH + SCROLL_LEFT_MARGIN + 50
    : undefined;
  const effectiveMarginBottom = rotateLabels ? 116 : 75;

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
        left: 120,
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
      oLabel: horizontalOLabel,
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

  // Use overflow:clip + transform to scroll the chart content. This avoids
  // the browser's native scroll-into-view on focus, since there is no
  // scrollable container. We handle wheel events to allow manual scrolling.
  const [scrollOffset, setScrollOffset] = useState(0);

  useEffect(() => {
    if (!needsScroll) return;
    const el = scrollRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      const delta =
        Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      setScrollOffset((prev) => {
        const maxVal = Math.max(0, (scrollWidth ?? 0) - el.clientWidth);
        return Math.max(0, Math.min(maxVal, prev + delta));
      });
      e.preventDefault();
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [needsScroll, scrollWidth]);

  // Track the keyboard-navigated bar index ourselves and scroll to keep
  // it visible. We listen on the ChartWrapper via capture phase to ensure
  // we catch events from SVG children.
  const keyNavIndexRef = useRef(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!needsScroll) return;
    const el = scrollRef.current;
    const wrapper = wrapperRef.current;
    if (!el || !wrapper) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;

      if (e.key === "ArrowRight") {
        keyNavIndexRef.current = Math.min(
          keyNavIndexRef.current + 1,
          data.length - 1,
        );
      } else {
        keyNavIndexRef.current = Math.max(keyNavIndexRef.current - 1, 0);
      }

      const idx = keyNavIndexRef.current;
      const containerWidth = el.clientWidth;
      // Each bar column = (scrollWidth - margins) / data.length
      const chartArea = (scrollWidth ?? 0) - SCROLL_LEFT_MARGIN - 50;
      const colWidth = chartArea / data.length;
      const barLeft = SCROLL_LEFT_MARGIN + idx * colWidth;
      const barRight = barLeft + colWidth;

      // Keep 4 bars of padding so the tooltip is never under the fade
      const PAD = colWidth * 4;
      setScrollOffset((prev) => {
        const maxVal = Math.max(0, (scrollWidth ?? 0) - containerWidth);
        if (barRight + PAD > prev + containerWidth) {
          return Math.min(maxVal, barRight + PAD - containerWidth);
        }
        if (barLeft - PAD < prev) {
          return Math.max(0, barLeft - PAD);
        }
        return prev;
      });
    };

    // Use capture phase to catch keyboard events from SVG children
    wrapper.addEventListener("keydown", onKeyDown, true);
    return () => wrapper.removeEventListener("keydown", onKeyDown, true);
  }, [needsScroll, scrollWidth, data.length]);

  const fadeRight =
    needsScroll &&
    scrollOffset <
      (scrollWidth ?? 0) - (scrollRef.current?.clientWidth ?? 0) - 1;
  const fadeLeft = needsScroll && scrollOffset > 0;

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
