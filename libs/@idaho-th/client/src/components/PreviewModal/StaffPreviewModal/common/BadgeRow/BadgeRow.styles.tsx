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

import styled, { css } from "styled-components";

import { LabelState } from "~@idaho-th/client/interfaces/common";

import {
  badgeBase,
  borderRadius,
  palette,
  spacing,
} from "../../../../../styles";

export const BadgeRowContainer = styled.div`
  align-items: flex-start;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: ${spacing[2]};
`;

export const LabelBadge = styled.span<{ $state: LabelState }>`
  ${badgeBase}
  border-radius: ${borderRadius[8]};
  font-size: 0.875rem;
  font-weight: 400;
  height: 1.5rem;
  line-height: 1.25rem;
  padding: 0 ${spacing[2]};

  ${({ $state }) => {
    switch ($state) {
      case "error":
      case "attention":
        return css`
          background: ${palette.background.attentionLight};
          color: ${palette.foreground.attention};
        `;
      case "warning":
        return css`
          background: ${palette.background.warningLight};
          color: ${palette.foreground.warning};
        `;
      case "success":
      case "match":
        return css`
          background: ${palette.background.brandLight};
          color: ${palette.misc.motherboardGreen};
        `;
      case "information":
      default:
        return css`
          background: ${palette.misc.catskillWhite};
          color: ${palette.misc.seaBlue};
        `;
    }
  }}
`;
