// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { Sans16, typography } from "@recidiviz/design-system";
import { Text } from "@visx/text";
import styled from "styled-components/macro";

import { palette } from "~design-system";

import { TARGET_LINE_WIDTH } from "./constants";

export const PlotWrapper = styled.div`
  overflow: hidden;
  position: relative;
`;

export const Plot = styled.svg`
  width: 100%;
`;

export const AxisLabel = styled(Text)`
  ${typography.Sans12}
  fill: ${palette.slate60};
`;
export const TargetLabel = styled(Text)`
  ${typography.Sans14}
  fill: ${palette.pine1};
`;

export const HighlightLabel = styled.div<{ $size: "sm" | "lg" }>`
  ${(props) => (props.$size === "lg" ? typography.Sans18 : typography.Sans14)}
  color: ${palette.slate85};
  pointer-events: none;
  display: inline-flex;
`;

export const AxisSpine = styled.line`
  stroke: ${palette.slate20};
  stroke-width: 1px;
`;

export const TargetLine = styled.line`
  stroke: ${palette.pine1};
  stroke-width: ${TARGET_LINE_WIDTH}px;
  stroke-dasharray: 6 6;
`;

export const TickLine = styled.line`
  stroke: ${palette.slate20};
  stroke-width: 1px;
`;

export const RateHighlightMark = styled.circle``;

export const LabelName = styled(Sans16)`
  color: ${palette.pine1};
`;

export const LabelPercent = styled(Sans16)`
  color: ${palette.signal.error};
  font-weight: bold;
`;
