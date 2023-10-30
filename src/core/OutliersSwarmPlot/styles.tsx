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
import { palette, typography } from "@recidiviz/design-system";
import { Text } from "@visx/text";
import styled from "styled-components/macro";

import { HIGHLIGHT_MARK_STROKE_WIDTH } from "../../OutliersStore/presenters/SwarmPresenter/constants";
import { TARGET_LINE_WIDTH } from "./constants";

export const PlotWrapper = styled.div`
  overflow: hidden;
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
  fill: ${palette.slate60};
`;

export const HighlightLabel = styled.div`
  ${typography.Sans18}
  color: ${palette.slate85};
  pointer-events: none;
`;

export const AxisSpine = styled.line`
  stroke: ${palette.slate20};
  stroke-width: 1px;
`;

export const TargetLine = styled.line`
  stroke: ${palette.slate60};
  stroke-width: ${TARGET_LINE_WIDTH}px;
  stroke-dasharray: 5 5;
`;

export const TickLine = styled.line`
  stroke: ${palette.slate20};
  stroke-width: 1px;
`;

export const RateHighlightMark = styled.circle`
  stroke: ${palette.white};
  stroke-width: ${HIGHLIGHT_MARK_STROKE_WIDTH}px;
`;
