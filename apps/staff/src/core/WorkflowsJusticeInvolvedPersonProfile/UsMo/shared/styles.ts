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

import { rem } from "polished";
import styled from "styled-components";

import { palette } from "~design-system";

/**
 * Shared US_MO card primitives used across multiple modules (Case Overview,
 * Recent Case Notes, …).
 */

/** Bordered frame for the card. 1px solid border at rgba(43,84,105,0.2),
 * 4px rounded corners. The "Case Overview" section heading sits above this
 * card and is owned by the parent layout (`UsMoCaseOverview`). */
export const CardFrame = styled.div`
  background: ${palette.white};
  border: 1px solid ${palette.slate20};
  border-radius: ${rem(4)};
  display: flex;
  flex-direction: column;
  overflow: hidden;
  width: 100%;

  /* Divider between adjacent sections (Personal Details -> Housing -> ...). */
  & > section + section {
    border-top: 1px solid ${palette.slate20};
  }
`;
