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

import styled from "styled-components";

import { palette } from "~design-system";

/**
 * Canonical styled title used by every filter section header in the
 * FiltersPanel. Shared between `FilterSectionLayout` (for radio / dropdown /
 * toggle filter sections) and the in-group header row used by
 * `CheckboxGroup` (when paired with a select-all). Keeping this in a single
 * module ensures the typography and color stay in sync across all filter
 * section types.
 */
export const FilterTitle = styled.span`
  ${({ theme }) => theme.checkbox?.labelTypography}
  font-weight: 700;
  line-height: 100%;
  letter-spacing: 0%;
  color: ${({ theme }) => theme.checkbox?.titleColor ?? palette.pine1};
`;
