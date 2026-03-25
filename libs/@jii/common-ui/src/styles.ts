// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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
import { rem } from "polished";
import { css } from "styled-components";

import { HEADER_ANIMATION_OPTIONS } from "./Header/constants";

/**
 * Apply to children of a flexbox or grid layout to stop their contents
 * from overflowing the layout (e.g. with long, unbreakable strings - it will
 * allow them to break)
 */
export const preventFlexibleLayoutOverflow = `
  min-width: 0;
  overflow-wrap: anywhere;
`;

/**
 * Apply to a banner that should stick to the top of the screen
 * but disappear when the user has scrolled partway.
 */
export const stickyHeader = css`
  width: 100vw;
  margin-left: calc(-50vw + 50%);
  margin-top: -${rem(spacing.xl)};
  position: sticky;
  transition: top ${HEADER_ANIMATION_OPTIONS};
`;
