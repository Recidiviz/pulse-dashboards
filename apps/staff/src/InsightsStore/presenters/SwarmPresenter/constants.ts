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

export const SWARM_SIZE_BREAKPOINT = 400;
export const SWARM_DOT_RADIUS_LG = 6;
export const SWARM_DOT_RADIUS_SM = 4;
export const HIGHLIGHT_DOT_RADIUS_LG = 10;
export const HIGHLIGHT_DOT_RADIUS_SM = 8;
export const HIGHLIGHT_MARK_STROKE_WIDTH = 2;

// this is equivalent to spacing.xxs from the design system;
// we can't import from that package directly because it breaks the swarmWorker.
// see https://github.com/vitejs/vite-plugin-react/issues/110
const baseMargin = 1;

export const MARGIN = {
  top: baseMargin,
  bottom: baseMargin,
  left: baseMargin + HIGHLIGHT_DOT_RADIUS_LG,
  right: baseMargin + HIGHLIGHT_DOT_RADIUS_LG,
};

const TARGET_LABEL_HEIGHT = 18;
const X_AXIS_HEIGHT = 16;
export const SWARM_AREA_TOP_OFFSET = MARGIN.top + TARGET_LABEL_HEIGHT;
export const SWARM_AREA_BOTTOM_OFFSET = MARGIN.bottom + X_AXIS_HEIGHT;
export const CHART_ASPECT_RATIO = 0.35;
