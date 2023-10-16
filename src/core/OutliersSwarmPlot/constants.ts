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

import { palette, spacing } from "@recidiviz/design-system";

import { TargetStatus } from "../../OutliersStore/models/schemaHelpers";

export const HIGHLIGHT_DOT_RADIUS = 10;
export const SWARM_DOT_RADIUS = 6;
export const TARGET_LINE_WIDTH = 3;

// not part of the design system palette
const DATAVIZ_GRAY = "#BFCCD2";
export const GOAL_COLORS: Record<TargetStatus, string> = {
  NEAR: palette.data.gold1,
  FAR: palette.data.crimson1,
  MET: DATAVIZ_GRAY,
};

export const MARGIN = {
  top: spacing.xxs,
  bottom: spacing.xxs,
  left: spacing.xxs + HIGHLIGHT_DOT_RADIUS,
  right: spacing.xxs + HIGHLIGHT_DOT_RADIUS,
};

export const TARGET_LABEL_HEIGHT = 18;
export const X_AXIS_HEIGHT = 16;
export const SWARM_AREA_TOP_OFFSET = MARGIN.top + TARGET_LABEL_HEIGHT;
export const SWARM_AREA_BOTTOM_OFFSET = MARGIN.bottom + X_AXIS_HEIGHT;
export const MAX_ASPECT_RATIO = 0.5;
