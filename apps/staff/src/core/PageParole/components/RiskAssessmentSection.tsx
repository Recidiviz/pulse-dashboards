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

import { useMemo, useState } from "react";
import styled from "styled-components";

import { ParoleRiskAssessment, ParoleRiskTool } from "~datatypes";

import type { ParoleRiskAssessmentConfig } from "../../models/types";
import { SectionCardHeader } from "../../SectionCard";
import { PaddedSectionCardBody } from "./PaddedSectionCardBody";
import { RiskAssessmentDetailHeader } from "./RiskAssessmentDetailHeader";
import { RiskAssessmentLegend } from "./RiskAssessmentLegend";
import { TOOL_COLORS } from "./RiskAssessmentSection.styles";
import {
  getCarasRiskLevel,
  getRiskLevel,
  groupAssessmentsByTool,
  isAssessmentStale,
  latestAssessmentsByTool,
} from "./RiskAssessmentSection.utils";
import { RiskTrajectoryChart, RiskTrajectoryLine } from "./RiskTrajectoryChart";
import {
  EmptyState,
  Hr,
  parseIsoDate,
  safeScorePct,
  SectionCard,
} from "./shared";
import { SubcategoryBreakdownChart } from "./SubcategoryBreakdownChart";

// Tool set and aggregate-view labels used whenever a tenant doesn't supply
// its own `riskAssessmentConfig` (see ParoleConfig) -- this is this
// section's original behavior, preserved exactly for any tenant that hasn't
// opted into a custom configuration.
const DEFAULT_TOOLS: Array<ParoleRiskTool> = ["LSI", "PIT", "CARAS", "SRT"];
const DEFAULT_AGGREGATE_LABEL = "All";
const DEFAULT_AGGREGATE_HEADER_LABEL = "All assessments";

const ChartCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
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

// Composes the Risk Score Trajectory section from its sub-components,
// computing the derived state (which tools are visible, the aggregate-view
// subset, the trajectory data, and the currently-selected assessment/risk
// level) that they need but none of them owns on its own. See
// RiskAssessmentLegend, RiskAssessmentDetailHeader, RiskTrajectoryChart, and
// SubcategoryBreakdownChart for the actual rendering.
export function RiskAssessmentSection({
  riskAssessments,
  riskAssessmentConfig,
}: {
  // Full assessment history per tool -- both the current per-tool detail
  // (legend, header, subcategory chart) and the trajectory chart are derived
  // from this single array, so there's one source of truth for risk data.
  riskAssessments: Array<ParoleRiskAssessment>;
  // Absent for any tenant that hasn't configured a custom risk-assessment
  // display (see ParoleConfig.riskAssessmentConfig) -- this section falls
  // back to its original tool set, percent-of-max axis, and CARAS bar chart
  // when unset, so tenants that don't opt in see no behavior change.
  riskAssessmentConfig?: ParoleRiskAssessmentConfig;
}) {
  const [selectedTool, setSelectedTool] = useState<ParoleRiskTool | null>(null);

  const hasCustomConfig = riskAssessmentConfig !== undefined;
  const tools = riskAssessmentConfig?.tools ?? DEFAULT_TOOLS;
  const aggregateTools = riskAssessmentConfig?.aggregateView.tools ?? tools;
  const aggregateLabel =
    riskAssessmentConfig?.aggregateView.label ?? DEFAULT_AGGREGATE_LABEL;
  const aggregateHeaderLabel =
    riskAssessmentConfig?.aggregateView.label ?? DEFAULT_AGGREGATE_HEADER_LABEL;

  const visibleAssessments = useMemo(
    () =>
      latestAssessmentsByTool(riskAssessments).filter((a) =>
        tools.includes(a.tool),
      ),
    [riskAssessments, tools],
  );

  const assessmentsByTool = useMemo(
    () => groupAssessmentsByTool(riskAssessments),
    [riskAssessments],
  );

  const selectedAssessment =
    visibleAssessments.find((a) => a.tool === selectedTool) ?? null;

  const overviewLines: Array<RiskTrajectoryLine> = useMemo(
    () =>
      tools
        .map((tool) => ({
          tool,
          color: TOOL_COLORS[tool],
          coordinates: (assessmentsByTool.get(tool) ?? []).map(
            (assessment) => ({
              date: parseIsoDate(assessment.date),
              // A tenant without a custom config still displays a
              // percent-of-max axis, derived here rather than stored
              // separately -- each historical assessment is scaled against
              // its own `maxScore`, not just the tool's current one.
              value: hasCustomConfig
                ? assessment.score
                : safeScorePct(assessment.score, assessment.maxScore),
            }),
          ),
        }))
        .filter((line) => line.coordinates.length > 0),
    [assessmentsByTool, tools, hasCustomConfig],
  );

  const trajectoryLines = useMemo(
    () =>
      selectedTool
        ? overviewLines.filter((line) => line.tool === selectedTool)
        : overviewLines.filter((line) => aggregateTools.includes(line.tool)),
    [overviewLines, selectedTool, aggregateTools],
  );

  if (visibleAssessments.length === 0) {
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
    ? safeScorePct(selectedAssessment.score, selectedAssessment.maxScore)
    : null;
  const getSelectedRiskLevel =
    selectedAssessment?.tool === "CARAS" ? getCarasRiskLevel : getRiskLevel;
  const selectedRisk =
    selectedRawPct !== null ? getSelectedRiskLevel(selectedRawPct) : null;
  const selectedStale = selectedAssessment
    ? isAssessmentStale(selectedAssessment.date)
    : false;

  // The tools relevant to the current view -- just the selected tool, or the
  // aggregate-view subset when nothing is selected -- used to size the
  // raw-score axis to whichever of those tools has the highest max score.
  const relevantTools = selectedTool ? [selectedTool] : aggregateTools;
  const yMax = Math.max(
    ...visibleAssessments
      .filter((a) => relevantTools.includes(a.tool))
      .map((a) => a.maxScore),
    1,
  );

  const aggregateAssessmentCount = visibleAssessments.filter((a) =>
    aggregateTools.includes(a.tool),
  ).length;

  return (
    <SectionCard>
      <SectionCardHeader>Risk Score Trajectory</SectionCardHeader>
      <PaddedSectionCardBody>
        <TrajectoryChartCard>
          <RiskAssessmentLegend
            visibleAssessments={visibleAssessments}
            selectedTool={selectedTool}
            onSelectTool={setSelectedTool}
            aggregateLabel={aggregateLabel}
            hasCustomConfig={hasCustomConfig}
          />

          <RiskAssessmentDetailHeader
            selectedAssessment={selectedAssessment}
            selectedRisk={selectedRisk}
            selectedRawPct={selectedRawPct}
            selectedStale={selectedStale}
            hasCustomConfig={hasCustomConfig}
            aggregateHeaderLabel={aggregateHeaderLabel}
            aggregateAssessmentCount={aggregateAssessmentCount}
          />

          <Hr />

          <ChartsRow>
            <RiskTrajectoryChart
              trajectoryLines={trajectoryLines}
              hasCustomConfig={hasCustomConfig}
              yMax={yMax}
              selectedTool={selectedTool}
            />

            {selectedAssessment && (
              <SubcategoryBreakdownChart
                assessment={selectedAssessment}
                showCarasComponentList={hasCustomConfig}
              />
            )}
          </ChartsRow>
        </TrajectoryChartCard>
      </PaddedSectionCardBody>
    </SectionCard>
  );
}
