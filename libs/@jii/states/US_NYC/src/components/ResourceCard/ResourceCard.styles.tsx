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

export const CardLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: ${rem(spacing.sm)};
  padding: ${rem(spacing.lg)} ${rem(spacing.md)};
  border-bottom: 1px solid ${palette.slate20};
  text-decoration: none;
  color: ${palette.pine1};
  background: transparent;
  width: 100%;

  &:last-child {
    border-bottom: none;
  }

  &:focus-visible {
    outline: 2px solid ${palette.pine1};
    outline-offset: -2px;
  }
`;

export const CardBody = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.sm)};
`;

export const CardName = styled.span`
  ${typography.Sans16}
  color: ${palette.pine1};
`;

export const CardPreview = styled.p`
  ${typography.Sans14}
  color: ${palette.slate85};
  margin: 0;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
`;

export const CardContact = styled.span`
  ${typography.Sans14}
  color: ${palette.slate85};
`;

export const CardChips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${rem(spacing.sm)};
`;

export const CardChevron = styled.span`
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: ${rem(24)};
  height: ${rem(24)};
  color: ${palette.slate30};
`;

export const CompactCardLink = styled(CardLink)`
  padding: ${rem(spacing.md)};
`;
