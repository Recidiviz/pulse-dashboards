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
import { Link } from "react-router-dom";
import styled, { css } from "styled-components";

import { palette, spacing, typography } from "~design-system";

const tileBase = css`
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: ${rem(spacing.xs)};
  padding: ${rem(spacing.md)};
  min-height: ${rem(72)};
  border: 1px solid ${palette.slate20};
  border-radius: ${rem(4)};
  text-decoration: none;
  color: ${palette.pine1};
  background: ${palette.white};
`;

export const TileLink = styled(Link)`
  ${tileBase}

  &:hover {
    border-color: ${palette.pine3};
  }

  &:focus-visible {
    outline: 2px solid ${palette.pine1};
    outline-offset: -2px;
  }
`;

export const TileDisabled = styled.div`
  ${tileBase}
  opacity: 0.72;
  cursor: default;
`;

export const TileLabel = styled.span`
  ${typography.Sans16}
  color: ${palette.pine1};
`;

export const TileCount = styled.span`
  ${typography.Sans14}
  color: ${palette.slate85};
`;
