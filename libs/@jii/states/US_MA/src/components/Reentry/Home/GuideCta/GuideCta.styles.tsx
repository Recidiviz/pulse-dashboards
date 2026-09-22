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

export const SectionLabel = styled.h2`
  ${typography.Sans14}

  color: ${palette.slate85};
  margin: 0 0 ${rem(spacing.sm)};
`;

export const CardsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${rem(spacing.md)};
`;

export const TopicCard = styled(Link)`
  align-items: center;
  border: 1px solid ${palette.slate20};
  border-radius: ${rem(8)};
  color: ${palette.pine1};
  display: flex;
  flex: 1 1 200px;
  gap: ${rem(spacing.sm)};
  padding: ${rem(spacing.lg)};
  text-decoration: none;

  &:hover,
  &:focus,
  &:active {
    border-color: ${palette.pine4};
  }

  svg {
    color: ${palette.pine4};
    flex: 0 0 auto;
  }
`;

export const TopicLabel = styled.span`
  ${typography.Sans16}

  font-weight: 600;
`;
