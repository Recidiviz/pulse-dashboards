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

import { spacing, typography } from "@recidiviz/design-system";
import { rem, rgba } from "polished";
import styled from "styled-components";

import { ParoleRiskAssessment, ParoleRiskTool } from "~datatypes";
import { palette } from "~design-system";

import { TOOL_COLORS } from "./RiskAssessmentSection.styles";
import { safeScorePct } from "./shared";

const ALL_CARD_COLOR = palette.pine1;

const MetricSelector = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${rem(spacing.lg)};
`;

const MetricSelectorItem = styled.button<{
  $selected: boolean;
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

export function RiskAssessmentLegend({
  visibleAssessments,
  selectedTool,
  onSelectTool,
  aggregateLabel,
  hasCustomConfig,
}: {
  visibleAssessments: Array<ParoleRiskAssessment>;
  selectedTool: ParoleRiskTool | null;
  onSelectTool: (tool: ParoleRiskTool | null) => void;
  aggregateLabel: string;
  hasCustomConfig: boolean;
}) {
  return (
    <MetricSelector>
      <MetricSelectorItem
        type="button"
        $selected={selectedTool === null}
        onClick={() => onSelectTool(null)}
      >
        <MetricSwatch $color={ALL_CARD_COLOR} />
        <MetricLabel $selected={selectedTool === null}>
          {aggregateLabel}
        </MetricLabel>
      </MetricSelectorItem>

      {visibleAssessments.map((assessment) => {
        const color = TOOL_COLORS[assessment.tool];

        return (
          <MetricSelectorItem
            key={assessment.tool}
            type="button"
            $selected={selectedTool === assessment.tool}
            onClick={() => onSelectTool(assessment.tool)}
          >
            <MetricSwatch $color={color} />
            <MetricLabel $selected={selectedTool === assessment.tool}>
              {assessment.tool}
            </MetricLabel>
            <MetricPct $selected={selectedTool === assessment.tool}>
              {hasCustomConfig
                ? assessment.score
                : `${Math.round(
                    safeScorePct(assessment.score, assessment.maxScore),
                  )}%`}
            </MetricPct>
          </MetricSelectorItem>
        );
      })}
    </MetricSelector>
  );
}
