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

import { spacing } from "@recidiviz/design-system";
import { rem } from "polished";
import styled from "styled-components/macro";

import { PAGE_WIDTH } from "../../utils/constants";

export const PAGE_PADDING = rem(spacing.md);

/**
 * Constrained to a desired max width, with left and right padding
 */
export const PageContainer = styled.div`
  margin-left: auto;
  margin-right: auto;
  max-width: ${rem(PAGE_WIDTH)};
  padding-left: ${PAGE_PADDING};
  padding-right: ${PAGE_PADDING};
`;

/**
 * Breaks out of the left/right padding to let content fill max width
 */
export const UnpaddedPageContainer = styled.div`
  margin-left: -${PAGE_PADDING};
  margin-right: -${PAGE_PADDING};
`;

/**
 * Breaks out of the max width to fill the entire screen width
 */
export const FullBleedContainer = styled.div`
  width: 100vw;
  position: relative;
  left: 50%;
  right: 50%;
  margin-left: -50vw;
  margin-right: -50vw;
`;
