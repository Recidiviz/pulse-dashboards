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

import { palette, spacing, typography } from "~design-system";

export const ChipTag = styled.span`
  ${typography.Sans14}

  display: inline-flex;
  align-items: center;
  max-width: 100%;
  min-height: ${rem(32)};
  padding: ${rem(spacing.xs)} ${rem(spacing.md)};
  border-radius: ${rem(999)};
  border: 1px solid ${palette.slate20};
  color: ${palette.pine1};
`;

export const ChipButton = styled.button<{ $selected: boolean }>`
  ${typography.Sans16}

  display: inline-flex;
  align-items: center;
  max-width: 100%;
  min-height: ${rem(44)};
  padding: ${rem(spacing.sm)} ${rem(spacing.lg)};
  border-radius: ${rem(999)};
  border: 1px solid
    ${({ $selected }) => ($selected ? palette.pine4 : palette.slate20)};
  background: ${({ $selected }) => ($selected ? palette.pine4 : "transparent")};
  color: ${({ $selected }) => ($selected ? palette.white : palette.pine1)};
  cursor: pointer;
  text-align: left;

  &:focus-visible {
    outline: 2px solid ${palette.pine1};
    outline-offset: 2px;
  }
`;

export const RemovableChipButton = styled.button`
  ${typography.Sans12}

  display: inline-flex;
  align-items: center;
  gap: ${rem(spacing.xs)};
  max-width: 100%;
  min-height: ${rem(24)};
  padding: ${rem(spacing.xs)} ${rem(spacing.sm)};
  border-radius: ${rem(999)};
  border: none;
  background: ${palette.pine4};
  color: ${palette.white};
  cursor: pointer;
  text-align: left;

  &:hover {
    background: ${palette.pine3};
  }

  &:focus-visible {
    outline: 2px solid ${palette.pine1};
    outline-offset: 2px;
  }
`;
