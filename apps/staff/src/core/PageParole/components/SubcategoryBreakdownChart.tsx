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
import { rem } from "polished";
import { useCallback, useMemo } from "react";
import useMeasure from "react-use-measure";
import { ResponsiveOrdinalFrame } from "semiotic";
import styled from "styled-components";

import { ParoleRiskAssessment } from "~datatypes";
import { palette } from "~design-system";

import { EdgeAwareTooltip } from "./EdgeAwareTooltip";
import {
  ChartColumn,
  ChartTitle,
  ChartWrapper,
  DEFAULT_CHART_HEIGHT,
  TOOL_COLORS,
} from "./RiskAssessmentSection.styles";

const ComponentList = styled.ol`
  margin: 0;
  padding: 0;
  list-style: none;
  counter-reset: component;
`;

const ComponentListItem = styled.li`
  ${typography.Sans14}
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0;
  counter-increment: component;

  &::before {
    content: counter(component);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: ${rem(20)};
    height: ${rem(20)};
    border-radius: 50%;
    background: ${palette.slate10};
    color: ${palette.slate70};
    font-size: 11px;
  }
`;

// SVG text doesn't wrap on its own, and some subcategory names are too long
// for the chart's left margin as one line -- greedily wrap on word
// boundaries by character count instead of measuring actual glyph widths.
const SUBCATEGORY_LABEL_MAX_CHARS_PER_LINE = 18;
const SUBCATEGORY_LABEL_LINE_HEIGHT = 12;

function wrapLabelText(text: string): Array<string> {
  const words = text.split(" ");
  const lines: Array<string> = [];
  let currentLine = "";
  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    if (
      candidate.length > SUBCATEGORY_LABEL_MAX_CHARS_PER_LINE &&
      currentLine
    ) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = candidate;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

/**
 * Hoisted to module scope (unlike the tooltipContent callbacks below, which
 * need each render's own barChartBounds) so React doesn't treat this as an
 * unstable component definition recreated every render.
 *
 * semiotic's own type for `oLabel` (see OrdinalFrameProps in
 * semiotic/lib/types/ordinalTypes.d.ts) declares its render-function
 * overload as returning the DOM's `Element`, not a React element -- even
 * though semiotic renders whatever this returns as JSX. The cast below is a
 * real interop gap (a React element isn't structurally a DOM Element), but
 * it's contained to this one return statement instead of being repeated as
 * an `as unknown as string` cast at every `oLabel=` call site.
 */
function renderSubcategoryBarLabel(name?: unknown): string | Element {
  const lines = wrapLabelText(name as string);
  // Centers the wrapped block on the bar's row: first line shifts up by
  // half the block's height, each next line steps down one line height.
  const firstLineOffset =
    (-(lines.length - 1) / 2) * SUBCATEGORY_LABEL_LINE_HEIGHT;
  return (
    <text textAnchor="end" style={{ fontSize: 11, fill: palette.slate70 }}>
      {lines.map((line, i) => (
        <tspan
          key={line}
          x={0}
          dy={i === 0 ? firstLineOffset : SUBCATEGORY_LABEL_LINE_HEIGHT}
        >
          {line}
        </tspan>
      ))}
    </text>
  ) as unknown as Element;
}

// The right-hand panel next to the trajectory chart: a plain numbered list
// of CARAS's fixed components (custom-configured tenants), a signed-
// contribution bar chart for CARAS (everyone else), or a score-out-of-max
// bar chart for every other tool.
export function SubcategoryBreakdownChart({
  assessment,
  showCarasComponentList,
}: {
  assessment: ParoleRiskAssessment;
  // When true, CARAS renders as a plain list of component names instead of
  // the signed-contribution bar chart -- driven by whether the current
  // tenant's riskAssessmentConfig requests it (see RiskAssessmentSection).
  showCarasComponentList: boolean;
}) {
  const [barChartRef, barChartBounds] = useMeasure();

  const subcategoryBarData = useMemo(
    () =>
      assessment.subcategories?.map((s) => ({
        name: s.name,
        score: s.score,
        remaining: s.maxScore - s.score,
      })),
    [assessment],
  );

  const carasFactorData = useMemo(
    () =>
      assessment.carasFactors?.map((f) => ({
        name: f.name,
        value: f.value,
        coefficient: f.coefficient,
        contribution: f.value * f.coefficient,
      })),
    [assessment],
  );

  const renderSubcategoryBarTooltip = useCallback(
    (d: {
      pieces?: Array<{ name: string; score: number; remaining: number }>;
    }): JSX.Element | null => {
      const point = d.pieces?.[0];
      if (!point) return null;
      return (
        <EdgeAwareTooltip
          containerBounds={barChartBounds}
          resetKey={point.name}
        >
          <div>{point.name}</div>
          <div>
            Score: {point.score} / {point.score + point.remaining}
          </div>
        </EdgeAwareTooltip>
      );
    },
    [barChartBounds],
  );

  // CARAS scores via coefficients, not points out of a max, so its bars
  // show each item's signed *contribution* rather than a score/max fraction.
  const renderCarasFactorTooltip = useCallback(
    (d: {
      pieces?: Array<{
        name: string;
        value: number;
        coefficient: number;
        contribution: number;
      }>;
    }): JSX.Element | null => {
      const point = d.pieces?.[0];
      if (!point) return null;
      return (
        <EdgeAwareTooltip
          containerBounds={barChartBounds}
          resetKey={point.name}
        >
          <div>{point.name}</div>
          <div>Value: {point.value}</div>
          <div>
            Contribution: {point.contribution >= 0 ? "+" : ""}
            {point.contribution.toFixed(2)}
          </div>
        </EdgeAwareTooltip>
      );
    },
    [barChartBounds],
  );

  if (assessment.tool === "CARAS") {
    if (!assessment.carasFactors) return null;

    if (showCarasComponentList) {
      return (
        <ChartColumn>
          <ChartTitle>Individual Components of the CARAS</ChartTitle>
          <ChartWrapper>
            <ComponentList>
              {assessment.carasFactors.map((f) => (
                <ComponentListItem key={f.name}>{f.name}</ComponentListItem>
              ))}
            </ComponentList>
          </ChartWrapper>
        </ChartColumn>
      );
    }

    if (!carasFactorData) return null;
    type CarasFactorDatum = (typeof carasFactorData)[number];
    const carasFactorSummary = carasFactorData
      .map(
        (f) =>
          `${f.name} contribution ${f.contribution >= 0 ? "+" : ""}${f.contribution.toFixed(2)}`,
      )
      .join(", ");
    return (
      <ChartColumn>
        <ChartTitle>Subcategory Breakdown (Most recent assessment)</ChartTitle>
        <ChartWrapper
          ref={barChartRef}
          role="img"
          aria-label={`Subcategory breakdown for CARAS: ${carasFactorSummary}`}
        >
          {barChartBounds.width > 0 && (
            <ResponsiveOrdinalFrame
              // Remounts on tool switch so semiotic doesn't try to animate
              // between two unrelated bar sets, which briefly overlaps them.
              key={assessment.tool}
              responsiveWidth={false}
              size={[
                barChartBounds.width,
                barChartBounds.height || DEFAULT_CHART_HEIGHT,
              ]}
              data={carasFactorData}
              type="bar"
              projection="horizontal"
              oAccessor="name"
              oPadding={12}
              rAccessor="contribution"
              style={(d: CarasFactorDatum) => ({
                fill: d.contribution >= 0 ? TOOL_COLORS.CARAS : palette.slate30,
                rx: 3,
              })}
              margin={{ left: 220, right: 8, top: 8, bottom: 30 }}
              oLabel={renderSubcategoryBarLabel}
              axes={[
                {
                  orient: "bottom",
                  ticks: 5,
                  tickFormat: (n: number) => n.toFixed(2),
                  className: "score-axis",
                  baseline: "under",
                },
                {
                  orient: "left",
                  tickFormat: () => "",
                  className: "category-axis",
                },
              ]}
              hoverAnnotation
              optimizeCustomTooltipPosition
              tooltipContent={renderCarasFactorTooltip}
            />
          )}
        </ChartWrapper>
      </ChartColumn>
    );
  }

  if (!subcategoryBarData) return null;
  const subcategoryBarSummary = subcategoryBarData
    .map((s) => `${s.name} ${s.score} of ${s.score + s.remaining}`)
    .join(", ");

  return (
    <ChartColumn>
      <ChartTitle>Subcategory Breakdown (Most recent assessment)</ChartTitle>
      <ChartWrapper
        ref={barChartRef}
        role="img"
        aria-label={`Subcategory breakdown for ${assessment.tool}: ${subcategoryBarSummary}`}
      >
        {barChartBounds.width > 0 && (
          <ResponsiveOrdinalFrame
            // See the CARAS branch above for why this is keyed by tool.
            key={assessment.tool}
            responsiveWidth={false}
            size={[
              barChartBounds.width,
              barChartBounds.height || DEFAULT_CHART_HEIGHT,
            ]}
            data={subcategoryBarData}
            type="bar"
            projection="horizontal"
            oAccessor="name"
            oPadding={12}
            rAccessor="score"
            style={() => ({
              fill: TOOL_COLORS[assessment.tool],
              rx: 3,
            })}
            margin={{ left: 140, right: 8, top: 8, bottom: 30 }}
            oLabel={renderSubcategoryBarLabel}
            axes={[
              {
                orient: "bottom",
                ticks: 5,
                tickFormat: (n: number) => `${n}`,
                className: "score-axis",
                baseline: "under",
              },
              {
                orient: "left",
                tickFormat: () => "",
                className: "category-axis",
              },
            ]}
            hoverAnnotation
            optimizeCustomTooltipPosition
            tooltipContent={renderSubcategoryBarTooltip}
          />
        )}
      </ChartWrapper>
    </ChartColumn>
  );
}
