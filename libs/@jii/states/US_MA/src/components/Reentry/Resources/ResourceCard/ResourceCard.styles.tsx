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
import styled from "styled-components";

import { palette, spacing, typography } from "~design-system";

export const CardName = styled.span`
  ${typography.Sans16}
  color: ${palette.pine1};
`;

export const Card = styled(Link)`
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.sm)};
  margin-left: ${rem(spacing.lg)};
  padding: ${rem(spacing.lg)} 0;
  border-bottom: 1px solid ${palette.slate20};

  color: inherit;
  text-decoration: none;

  &:hover ${CardName} {
    text-decoration: underline;
  }

  &:focus-visible {
    outline: 2px solid ${palette.pine1};
    outline-offset: 2px;
  }

  &:last-child {
    border-bottom: none;
  }
`;
