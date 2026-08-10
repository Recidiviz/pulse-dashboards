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

import { spacing, Tooltip, typography } from "@recidiviz/design-system";
import { rem, rgba } from "polished";
import { useMemo, useState } from "react";
import useMeasure from "react-use-measure";
import { ResponsiveOrdinalFrame, ResponsiveXYFrame } from "semiotic";
import styled from "styled-components";

import {
  ParoleRiskAssessment,
  ParoleRiskOverviewPoint,
  ParoleRiskTool,
} from "~datatypes";
import { palette } from "~design-system";

import { WorkflowsBadgePill } from "../../BadgePill/BadgePill";
import { SectionCardHeader } from "../../SectionCard";
import { PaddedSectionCardBody } from "./PaddedSectionCardBody";
import { EmptyState, Hr, parseIsoDate, SectionCard } from "./shared";

const TOOL_COLORS: Record<ParoleRiskTool, string> = {
  LSI: "#0B5394",
  PIT: "#00A396",
  CARAS: "#FF6B47",
  SRT: "#8E4EC6",
};

const RISK_TOOLS: Array<ParoleRiskTool> = ["LSI", "PIT", "CARAS", "SRT"];

const ALL_CARD_COLOR = palette.pine1;

const MetricSelector = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${rem(spacing.lg)};
`;

const MetricSelectorItem = styled.button<{
  $selected: boolean;
  $color: string;
}>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  background: none;
  border: none;
  padding: 0;
  ${typography.Sans14}
  font-weight: ${({ $selected }) => ($selected ? 700 : 400)};
`;

const MetricSwatch = styled.span<{ $color: string }>`
  display: inline-block;
  width: ${rem(10)};
  height: ${rem(10)};
  border-radius: 50%;
  background: ${({ $color }) => $color};
`;

const MetricLabel = styled.span<{ $selected: boolean }>`
  display: inline-block;
  font-weight: 700;
  color: ${({ $selected }) => ($selected ? "black" : palette.slate60)};
`;

const MetricPct = styled.span<{ $selected: boolean }>`
  display: inline-block;
  font-size: 12px;
  font-weight: 400;
  color: ${({ $selected }) =>
    $selected ? palette.slate70 : rgba(palette.slate, 0.5)};
`;

const ChartDetailHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${rem(spacing.lg)};
  margin-top: 1rem;
  font-size: 14px;
`;

const ChartDetailMetric = styled.div`
  display: flex;
  align-items: baseline;
  gap: ${rem(spacing.sm)};
`;

const SelectedMetric = styled(ChartDetailMetric)`
  color: black;
`;

const ScoreDisplay = styled.span`
  font-size: 20px;
`;

const AssessedDate = styled.span`
  color: #72777a;
`;

const AllAssessmentsMetric = styled(ChartDetailMetric)`
  gap: 1.5rem;
`;

const AllAssessmentsLabel = styled.span`
  font-size: 16px;
  color: black;
`;

const ChartDetailBadgeRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${rem(spacing.xs)};
`;

const StaleWarning = styled.span`
  display: flex;
  align-items: center;
  gap: ${rem(4)};
  color: ${palette.signal.error};
  font-size: 12px;
`;

const ChartCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: ${rem(spacing.md)};
`;

const TrajectoryChartCard = styled(ChartCard)`
  padding: 0;
  border-top: none;
`;

const ChartsRow = styled.div`
  display: flex;
  flex-direction: row;
  gap: 1rem;

  > * {
    flex: 1;
    min-width: 0;
  }
`;

const ChartColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const ChartTitle = styled.span`
  ${typography.Sans14}
  font-weight: 600;
`;

// Neutralizes semiotic's harsh default styling (solid black gridlines/axis
// baselines, default hover crosshair) in favor of the same soft, subtle look
// used by InsightsLinePlot and the shared Pathways charts.
const ChartWrapper = styled.div`
  margin: 1rem 0;

  .data-visualization {
    .axis-baseline {
      stroke: none;
    }

    .score-axis.axis-baseline {
      stroke: ${palette.slate10};
    }

    .axis-label {
      ${typography.Sans12}
      fill: ${palette.slate60};
    }
  }

  .background-graphics {
    .x.tick-line,
    .y.tick-line {
      stroke: ${palette.slate10};
    }

    .score-axis {
      stroke: ${palette.slate10};
    }

    .category-axis {
      stroke: none;
    }
  }

  .annotation-layer {
    .frame-hover {
      stroke: none;
    }
  }
`;

function getRiskLevel(pct: number): {
  label: string;
  palette: "GREEN" | "ORANGE" | "RED";
} {
  if (pct >= 60) return { label: "High", palette: "RED" };
  if (pct >= 30) return { label: "Medium", palette: "ORANGE" };
  return { label: "Low", palette: "GREEN" };
}

// CARAS v7's risk level comes from its own published probability bands, not
// the generic 3-tier scale the other tools use (`score` for CARAS is already
// that probability * 100, so this takes the same 0-100 value as `pct`).
function getCarasRiskLevel(pct: number): {
  label: string;
  palette: "GREEN" | "BLUE" | "YELLOW" | "ORANGE" | "RED";
} {
  const probability = pct / 100;
  if (probability > 0.6162) return { label: "Very High", palette: "RED" };
  if (probability > 0.5139) return { label: "High", palette: "ORANGE" };
  if (probability > 0.3854) return { label: "Medium", palette: "YELLOW" };
  if (probability > 0.2826) return { label: "Low", palette: "BLUE" };
  return { label: "Very Low", palette: "GREEN" };
}

function isAssessmentStale(dateString: string): boolean {
  const assessmentDate = parseIsoDate(dateString);
  const today = new Date();
  const monthsDiff =
    (today.getFullYear() - assessmentDate.getFullYear()) * 12 +
    (today.getMonth() - assessmentDate.getMonth());
  return monthsDiff > 12;
}

// Dates here arrive as "yyyy-MM-dd" fixture strings, as Date objects built
// from chart coordinates, or -- despite what semiotic's own types (and ours,
// matching them) claim -- sometimes as a raw timestamp number from inside a
// semiotic tooltip callback. Handle all three explicitly rather than trusting
// the declared type, since only the `instanceof Date` check is actually safe.
function toSafeDate(date: string | number | Date): Date {
  if (date instanceof Date) return date;
  if (typeof date === "string") return parseIsoDate(date);
  return new Date(date);
}

const formatDate = (date: string | number | Date) =>
  toSafeDate(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const formatDateShort = (date: string | number | Date) =>
  toSafeDate(date).toLocaleDateString("en-US", {
    month: "short",
    year: "2-digit",
  });

const StyledTooltip = styled(Tooltip).attrs({
  backgroundColor: palette.pine2,
})`
  ${typography.Sans14}
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.xs)};
  padding: ${rem(spacing.sm)} ${rem(spacing.md)};
  border-radius: ${rem(6)};

  div:first-child {
    color: ${palette.slate30};
    font-size: 12px;
  }
`;

// Semiotic render-prop callbacks (oLabel/tooltipContent) are hoisted to module
// scope -- rather than defined inline in JSX -- so React doesn't treat them as
// unstable component definitions recreated on every render.
function renderSubcategoryBarLabel(name: unknown): JSX.Element {
  return (
    <text textAnchor="end" style={{ fontSize: 11, fill: palette.slate70 }}>
      {name as string}
    </text>
  );
}

function renderSubcategoryBarTooltip(d: {
  pieces?: Array<{ name: string; score: number; remaining: number }>;
}): JSX.Element | null {
  const point = d.pieces?.[0];
  if (!point) return null;
  return (
    <StyledTooltip>
      <div>{point.name}</div>
      <div>
        Score: {point.score} / {point.score + point.remaining}
      </div>
    </StyledTooltip>
  );
}

// CARAS v7 doesn't score subcategories additively out of a max -- each item's
// raw value is multiplied by a fixed coefficient and summed into a log-odds,
// so its bars show each item's *contribution* to the overall score (which can
// be negative, e.g. Offender Age) rather than a score-out-of-max fraction.
function renderCarasFactorTooltip(d: {
  pieces?: Array<{
    name: string;
    value: number;
    coefficient: number;
    contribution: number;
  }>;
}): JSX.Element | null {
  const point = d.pieces?.[0];
  if (!point) return null;
  return (
    <StyledTooltip>
      <div>{point.name}</div>
      <div>Value: {point.value}</div>
      <div>
        Contribution: {point.contribution >= 0 ? "+" : ""}
        {point.contribution.toFixed(2)}
      </div>
    </StyledTooltip>
  );
}

function renderOverviewTrendTooltip(d: {
  points: Array<{ data: { date: Date; value: number } }>;
  parentLine: { tool: string; color: string };
}): JSX.Element | null {
  const point = d.points[0]?.data;
  if (!point) return null;
  return (
    <StyledTooltip>
      <div>{formatDate(point.date)}</div>
      <div style={{ color: d.parentLine.color }}>
        {d.parentLine.tool}: {Math.round(point.value)}%
      </div>
    </StyledTooltip>
  );
}

function SubcategoryBreakdownChart({
  assessment,
}: {
  assessment: ParoleRiskAssessment;
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

  if (assessment.tool === "CARAS") {
    if (!carasFactorData) return null;
    return (
      <ChartColumn>
        <ChartTitle>Subcategory Breakdown (Most recent assessment)</ChartTitle>
        <ChartWrapper ref={barChartRef}>
          {barChartBounds.width > 0 && (
            <ResponsiveOrdinalFrame
              responsiveWidth={false}
              size={[barChartBounds.width, 280]}
              data={carasFactorData}
              type="bar"
              projection="horizontal"
              oAccessor="name"
              oPadding={12}
              rAccessor="contribution"
              style={(d: any) => ({
                fill: d.contribution >= 0 ? TOOL_COLORS.CARAS : palette.slate30,
                rx: 3,
              })}
              margin={{ left: 220, right: 8, top: 8, bottom: 30 }}
              oLabel={renderSubcategoryBarLabel as unknown as string}
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
              tooltipContent={renderCarasFactorTooltip}
            />
          )}
        </ChartWrapper>
      </ChartColumn>
    );
  }

  if (!subcategoryBarData) return null;

  return (
    <ChartColumn>
      <ChartTitle>Subcategory Breakdown (Most recent assessment)</ChartTitle>
      <ChartWrapper ref={barChartRef}>
        {barChartBounds.width > 0 && (
          <ResponsiveOrdinalFrame
            responsiveWidth={false}
            size={[barChartBounds.width, 280]}
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
            oLabel={renderSubcategoryBarLabel as unknown as string}
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
            tooltipContent={renderSubcategoryBarTooltip}
          />
        )}
      </ChartWrapper>
    </ChartColumn>
  );
}

export function RiskAssessmentSection({
  riskAssessments,
  riskOverviewHistory,
}: {
  riskAssessments: Array<ParoleRiskAssessment>;
  riskOverviewHistory: Array<ParoleRiskOverviewPoint>;
}) {
  const [selectedTool, setSelectedTool] = useState<ParoleRiskTool | null>(null);
  const [lineChartRef, lineChartBounds] = useMeasure();

  const selectedAssessment =
    riskAssessments.find((a) => a.tool === selectedTool) ?? null;

  const overviewLines = useMemo(
    () =>
      RISK_TOOLS.map((tool) => ({
        tool,
        color: TOOL_COLORS[tool],
        coordinates: riskOverviewHistory
          .filter((point) => point[tool] !== undefined)
          .map((point) => ({
            date: parseIsoDate(point.date),
            value: point[tool] as number,
          })),
      })).filter((line) => line.coordinates.length > 0),
    [riskOverviewHistory],
  );

  const trajectoryLines = useMemo(
    () =>
      selectedTool
        ? overviewLines.filter((line) => line.tool === selectedTool)
        : overviewLines,
    [overviewLines, selectedTool],
  );

  if (riskAssessments.length === 0) {
    return (
      <SectionCard>
        <SectionCardHeader>Risk Score Trajectory</SectionCardHeader>
        <PaddedSectionCardBody>
          <EmptyState>
            No risk assessments available for this resident.
          </EmptyState>
        </PaddedSectionCardBody>
      </SectionCard>
    );
  }

  const selectedRawPct = selectedAssessment
    ? (selectedAssessment.score / selectedAssessment.maxScore) * 100
    : null;
  const selectedPct =
    selectedRawPct !== null ? Math.round(selectedRawPct) : null;
  const getSelectedRiskLevel =
    selectedAssessment?.tool === "CARAS" ? getCarasRiskLevel : getRiskLevel;
  const selectedRisk =
    selectedRawPct !== null ? getSelectedRiskLevel(selectedRawPct) : null;
  const selectedStale = selectedAssessment
    ? isAssessmentStale(selectedAssessment.date)
    : false;

  return (
    <SectionCard>
      <SectionCardHeader>Risk Score Trajectory</SectionCardHeader>
      <PaddedSectionCardBody>
        <TrajectoryChartCard>
          <MetricSelector>
            <MetricSelectorItem
              type="button"
              $selected={selectedTool === null}
              $color={ALL_CARD_COLOR}
              onClick={() => setSelectedTool(null)}
            >
              <MetricSwatch $color={ALL_CARD_COLOR} />
              <MetricLabel $selected={selectedTool === null}>All</MetricLabel>
            </MetricSelectorItem>

            {riskAssessments.map((assessment) => {
              const pct = Math.round(
                (assessment.score / assessment.maxScore) * 100,
              );
              const color = TOOL_COLORS[assessment.tool];

              return (
                <MetricSelectorItem
                  key={assessment.tool}
                  type="button"
                  $selected={selectedTool === assessment.tool}
                  $color={color}
                  onClick={() => setSelectedTool(assessment.tool)}
                >
                  <MetricSwatch $color={color} />
                  <MetricLabel $selected={selectedTool === assessment.tool}>
                    {assessment.tool}
                  </MetricLabel>
                  <MetricPct $selected={selectedTool === assessment.tool}>
                    {pct}%
                  </MetricPct>
                </MetricSelectorItem>
              );
            })}
          </MetricSelector>

          <ChartDetailHeader>
            {selectedAssessment && selectedRisk && selectedPct !== null ? (
              <>
                <SelectedMetric>
                  <span>{selectedAssessment.tool}</span>
                  <ScoreDisplay>
                    {selectedAssessment.score} / {selectedAssessment.maxScore}
                  </ScoreDisplay>
                  <AssessedDate>
                    Assessed {formatDate(selectedAssessment.date)}
                  </AssessedDate>
                </SelectedMetric>
                <ChartDetailBadgeRow>
                  <WorkflowsBadgePill
                    text={`${selectedRisk.label} Risk — ${selectedPct}%`}
                    palette={selectedRisk.palette}
                  />
                  {selectedStale && (
                    <StaleWarning>
                      Last assessment over 12 months ago
                    </StaleWarning>
                  )}
                </ChartDetailBadgeRow>
              </>
            ) : (
              <AllAssessmentsMetric>
                <AllAssessmentsLabel>All assessments</AllAssessmentsLabel>
                <span>{riskAssessments.length} assessment types selected</span>
              </AllAssessmentsMetric>
            )}
          </ChartDetailHeader>

          <Hr />

          <ChartsRow>
            <ChartColumn>
              <ChartTitle>Trajectory - percent of max scores</ChartTitle>
              {trajectoryLines.length > 0 && (
                <ChartWrapper ref={lineChartRef}>
                  {lineChartBounds.width > 0 && (
                    <ResponsiveXYFrame
                      responsiveWidth={false}
                      size={[lineChartBounds.width, 280]}
                      lines={trajectoryLines.map((l) => ({
                        color: l.color,
                        tool: l.tool,
                        coordinates: l.coordinates,
                      }))}
                      lineStyle={(l: any) => ({
                        stroke: l.color,
                        strokeWidth: 2,
                      })}
                      xAccessor="date"
                      yAccessor="value"
                      yExtent={[0, 100]}
                      margin={{ left: 48, right: 20, top: 10, bottom: 30 }}
                      showLinePoints
                      pointStyle={(p: any) => ({
                        r: 5,
                        fill: p.parentLine?.color ?? p.color,
                        stroke: palette.white,
                        strokeWidth: 2,
                      })}
                      axes={[
                        {
                          orient: "left",
                          ticks: 5,
                          tickFormat: (n: number) => `${n}%`,
                        },
                        {
                          orient: "bottom",
                          tickFormat: (d: Date) => formatDateShort(d),
                        },
                      ]}
                      hoverAnnotation
                      tooltipContent={renderOverviewTrendTooltip}
                    />
                  )}
                </ChartWrapper>
              )}
            </ChartColumn>

            {selectedAssessment && (
              <SubcategoryBreakdownChart assessment={selectedAssessment} />
            )}
          </ChartsRow>
        </TrajectoryChartCard>
      </PaddedSectionCardBody>
    </SectionCard>
  );
}
