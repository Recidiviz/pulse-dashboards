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

import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownToggle,
  spacing,
} from "~design-system";

import { publicPathwaysPalette } from "../../styles/publicPathwaysPalette";
import { publicPathwaysTypography } from "../../styles/publicPathwaysTypography";

const BORDER_COLOR = "rgba(0, 0, 0, 0.15)";
const HOVER_BACKGROUND_COLOR = "rgba(0, 0, 0, 0.03)";

export const DashboardToggle = styled(DropdownToggle)`
  ${publicPathwaysTypography.Sans14}
  display: flex;
  align-items: center;
  gap: ${rem(spacing.xs)};
  min-height: ${rem(38)};
  padding: ${rem(spacing.xs)} ${rem(spacing.md)};
  border: 1px solid ${BORDER_COLOR};
  border-radius: 50px;
  background-color: ${publicPathwaysPalette.white};
  color: ${publicPathwaysPalette.pine1};
  font-weight: 500;

  &:hover,
  &[aria-expanded="true"] {
    border-color: ${BORDER_COLOR};
    background-color: ${HOVER_BACKGROUND_COLOR};
    color: ${publicPathwaysPalette.pine1};
  }

  &:focus-visible {
    outline: 2px solid ${publicPathwaysPalette.focusColor};
    outline-offset: 2px;
  }
`;

export const DashboardMenuPanel = styled(DropdownMenu)`
  min-width: ${rem(300)};
  padding: ${rem(spacing.xs)} 0;
  margin-top: 0.5rem;
`;

export const DashboardMenuItem = styled(DropdownMenuItem)<{ $active: boolean }>`
  ${publicPathwaysTypography.Sans14}
  display: flex;
  align-items: center;
  gap: ${rem(spacing.xs)};
  height: auto;
  padding: ${rem(spacing.sm)} ${rem(spacing.md)};
  line-height: normal;
  white-space: nowrap;
  color: ${({ $active }) =>
    $active ? publicPathwaysPalette.signal.links : publicPathwaysPalette.pine1};
  font-weight: ${({ $active }) => ($active ? 700 : 400)};
  background-color: ${({ $active }) =>
    $active ? rgba(publicPathwaysPalette.signal.links, 0.05) : "transparent"};

  &:focus {
    color: ${({ $active }) =>
      $active
        ? publicPathwaysPalette.signal.links
        : publicPathwaysPalette.pine1};
    background-color: ${HOVER_BACKGROUND_COLOR};
  }
`;

export const CadenceLabel = styled.span`
  color: ${publicPathwaysPalette.slate60};
  font-weight: 400;

  @media (max-width: 991px) {
    display: none;
  }
`;

/**
 * Fixed-width slot for the selected dashboard's check mark, so that every
 * option's name starts at the same offset whether or not it is selected.
 */
export const CheckSlot = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: ${rem(12)};
  color: ${publicPathwaysPalette.signal.links};
`;

/**
 * Announces the selected dashboard to a screen reader. The check mark alone
 * carries no text, and `DropdownMenuItem` drops any aria attribute passed to
 * it, so the state has to reach the accessibility tree as real text.
 */
export const VisuallyHidden = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;
