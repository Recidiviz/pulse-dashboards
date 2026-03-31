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

import { spacing } from "@recidiviz/design-system";
import { rem } from "polished";
import styled from "styled-components";

export const PAGE_WIDTH = 991;
/**
 * Constrained to a desired max width, with left and right padding
 */
export const PageContainer = styled.div<{ $isMobile?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.md)};
  margin-left: ${({ $isMobile }) => ($isMobile ? "0" : "auto")};
  margin-right: ${({ $isMobile }) => ($isMobile ? "0" : "auto")};
  max-width: ${({ $isMobile }) => ($isMobile ? "none" : rem(PAGE_WIDTH))};
  width: ${({ $isMobile }) => ($isMobile ? "100%" : "90%")};
  padding-left: ${({ $isMobile }) => rem($isMobile ? spacing.sm : spacing.md)};
  padding-right: ${({ $isMobile }) => rem($isMobile ? spacing.sm : spacing.md)};
`;

export const NavigationRow = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;
