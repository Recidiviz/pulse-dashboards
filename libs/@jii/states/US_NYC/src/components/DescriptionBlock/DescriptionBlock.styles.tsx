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
import styled, { css } from "styled-components";

import { palette, spacing, typography } from "~design-system";

export const DescriptionWrapper = styled.div``;

export const DescriptionBody = styled.div<{ $clamped: boolean }>`
  line-height: 1.5;
  color: ${palette.pine1};

  p:last-child {
    margin-bottom: 0;
  }

  ${({ $clamped }) =>
    $clamped &&
    css`
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 3;
      overflow: hidden;
    `}
`;

export const ToggleButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-top: ${rem(spacing.md)};
  padding: 0 ${rem(spacing.md)};
  height: ${rem(48)};
  border: 1px solid ${palette.slate20};
  border-radius: ${rem(4)};
  background: ${palette.white};
  color: ${palette.pine1};
  ${typography.Sans16}
  cursor: pointer;

  &:hover {
    border-color: ${palette.pine4};
  }

  &:focus-visible {
    outline: 2px solid ${palette.pine1};
    outline-offset: 2px;
  }
`;
