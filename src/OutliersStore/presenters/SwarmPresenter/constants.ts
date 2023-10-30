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

import { spacing } from "@recidiviz/design-system";

export const HIGHLIGHT_DOT_RADIUS = 10;
export const HIGHLIGHT_MARK_STROKE_WIDTH = 2;
export const SWARM_DOT_RADIUS = 6;

export const MARGIN = {
  top: spacing.xxs,
  bottom: spacing.xxs,
  left: spacing.xxs + HIGHLIGHT_DOT_RADIUS,
  right: spacing.xxs + HIGHLIGHT_DOT_RADIUS,
};

const TARGET_LABEL_HEIGHT = 18;
const X_AXIS_HEIGHT = 16;
export const SWARM_AREA_TOP_OFFSET = MARGIN.top + TARGET_LABEL_HEIGHT;
export const SWARM_AREA_BOTTOM_OFFSET = MARGIN.bottom + X_AXIS_HEIGHT;
export const MAX_ASPECT_RATIO = 0.5;
