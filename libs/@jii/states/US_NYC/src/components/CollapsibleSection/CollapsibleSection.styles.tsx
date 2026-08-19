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

import { HEADER_BORDER_WIDTH, HEADER_HEIGHT } from "~@jii/common-ui";
import { Icon, palette, spacing, typography } from "~design-system";

export const Section = styled.div``;

export const Header = styled.button<{
  $sticky: boolean;
  $hasBorder: boolean;
  $isOpen: boolean;
}>`
  display: flex;
  align-items: center;
  gap: ${rem(spacing.sm)};
  width: 100%;
  background: none;
  border: none;
  padding: 0;
  text-align: left;
  cursor: pointer;

  &:focus {
    outline: none;
  }

  &:focus-visible {
    outline: 2px solid ${palette.signal.links};
    outline-offset: ${rem(-2)};
  }

  border-bottom: 1px solid
    ${({ $hasBorder, $isOpen }) =>
      $hasBorder && $isOpen ? palette.slate20 : "transparent"};

  ${({ $hasBorder }) =>
    $hasBorder &&
    css`
      padding: ${rem(spacing.md)} 0;
    `}

  ${({ $sticky }) =>
    $sticky &&
    css`
      position: sticky;
      top: ${rem(HEADER_HEIGHT + HEADER_BORDER_WIDTH)};
      z-index: 1;
      background: ${palette.marble1};
      scroll-margin-top: ${rem(HEADER_HEIGHT + HEADER_BORDER_WIDTH)};
    `}
`;

export const Chevron = styled(Icon).attrs({ kind: "Next" })<{ kind?: never }>`
  transition: transform 0.2s ease;
  flex-shrink: 0;
`;

export const Title = styled.span`
  ${typography.Sans16};
`;

export const Badge = styled.span`
  ${typography.Sans12};
  background-color: ${palette.slate05};
  padding: ${rem(2)} ${rem(spacing.sm)};
  border-radius: ${rem(12)};
  white-space: nowrap;
`;

export const Content = styled.div``;
