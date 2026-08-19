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
import styled, { css } from "styled-components";

import { palette, spacing, typography } from "~design-system";

function borderColor(selected: boolean, inverted: boolean): string {
  if (selected) return palette.pine4;
  if (inverted) return rgba(palette.white, 0.5);
  return palette.slate20;
}

const chipBase = css<{ $selected: boolean; $inverted: boolean }>`
  ${typography.Sans14}

  display: inline-flex;
  align-items: center;
  justify-content: center;
  max-width: 100%;
  min-height: ${rem(32)};
  padding: ${rem(spacing.sm)} ${rem(spacing.md)};
  border-radius: ${rem(999)};
  border: 1px solid
    ${({ $selected, $inverted }) => borderColor($selected, $inverted)};
  background: ${({ $selected }) => ($selected ? palette.pine4 : "transparent")};
  color: ${({ $selected, $inverted }) =>
    $selected || $inverted ? palette.white : palette.slate85};
`;

export const ChipButton = styled.button<{
  $selected: boolean;
  $inverted: boolean;
}>`
  ${chipBase}

  cursor: pointer;

  &:focus-visible {
    outline: 2px solid ${palette.pine1};
    outline-offset: 2px;
  }
`;

export const ChipTag = styled.span<{ $selected: boolean; $inverted: boolean }>`
  ${chipBase}
`;
