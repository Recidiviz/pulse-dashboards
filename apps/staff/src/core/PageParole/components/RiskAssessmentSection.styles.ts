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
import { rem } from "polished";
import styled from "styled-components";

import { ParoleRiskTool } from "~datatypes";
import { palette } from "~design-system";

export const TOOL_COLORS: Record<ParoleRiskTool, string> = {
  LSI: "#0B5394",
  PIT: "#00A396",
  CARAS: "#FF6B47",
  SRT: "#8E4EC6",
  RT: "#2E7D32",
  CST: "#C2185B",
};

// Tall enough that CARAS's 12-factor component list (the tallest of the
// three chart types this height is shared across) never needs to scroll.
export const DEFAULT_CHART_HEIGHT = 432;

export const ChartColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

export const ChartTitle = styled.span`
  ${typography.Sans14}
  font-weight: 600;
`;

// Neutralizes semiotic's harsh default styling (solid black gridlines/axis
// baselines, default hover crosshair) in favor of the same soft, subtle look
// used by InsightsLinePlot and the shared Pathways charts. Fixed (not min-)
// height so swapping between chart types in ChartsRow -- e.g. a bar chart vs.
// CARAS's component list, which has no chart-driven height of its own --
// never resizes the container; content taller than that scrolls instead.
export const ChartWrapper = styled.div`
  margin: 1rem 0;
  height: ${DEFAULT_CHART_HEIGHT}px;
  overflow-y: auto;
  // Anchors semiotic's tooltip (position: absolute, top/left in px) to this
  // chart, not some unrelated positioned ancestor up the page.
  position: relative;

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

// Centers the tooltip above its anchor point instead of growing down-right
// from it (matching InsightsLinePlot's StyledTooltip).
export const StyledTooltip = styled(Tooltip).attrs({
  backgroundColor: palette.signal.tooltip,
})<{
  // Extra horizontal nudge (px) from EdgeAwareTooltip, on top of the -50%
  // centering below, to keep the tooltip inside its chart near an edge.
  $offsetX?: number;
}>`
  ${typography.Sans14}
  position: relative;
  transform: translate(calc(-50% + ${({ $offsetX = 0 }) => $offsetX}px), -115%);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  color: ${palette.white};
  gap: ${rem(spacing.xs)};
  padding: ${rem(spacing.sm)} ${rem(spacing.md)};
  border-radius: ${rem(6)};

  div:first-child {
    font-size: 12px;
  }
`;
