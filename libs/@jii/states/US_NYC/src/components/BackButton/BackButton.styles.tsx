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

import { Icon, palette, spacing, typography } from "~design-system";

export const Chevron = styled(Icon).attrs({ kind: "Next" })<{ kind?: never }>`
  flex-shrink: 0;
`;

export const BackLink = styled(Link)`
  ${typography.Sans16}

  display: inline-flex;
  align-items: center;
  gap: ${rem(spacing.xs)};
  color: ${palette.pine1};
  text-decoration: none;
  padding: ${rem(spacing.xs)} 0;

  &:hover {
    color: ${palette.pine2};
  }

  &:focus-visible {
    outline: 2px solid ${palette.pine1};
    outline-offset: 2px;
    border-radius: ${rem(2)};
  }
`;
