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

import { rem, rgba } from "polished";
import styled from "styled-components";

import { palette, spacing, typography } from "~design-system";

export const Grid = styled.dl`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: ${rem(spacing.md)};
  margin: 0;
`;

export const Card = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.sm)};
  padding: ${rem(spacing.md)} ${rem(spacing.lg)};
  border: 1px solid ${palette.slate20};
  border-radius: ${rem(12)};
  background: ${rgba(palette.data.teal1, 0.1)};
`;

export const Label = styled.dt`
  ${typography.Sans14}

  color: ${palette.slate80};
  letter-spacing: 0.1em;
  text-transform: uppercase;
`;

export const Value = styled.dd`
  ${typography.Sans16}

  color: ${palette.pine1};
  margin: 0;
`;
