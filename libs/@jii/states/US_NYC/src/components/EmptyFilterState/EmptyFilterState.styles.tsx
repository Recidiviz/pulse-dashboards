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

export const EmptyWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.md)};
  padding: 0 0 ${rem(spacing.xl)} 0;
`;

export const EmptyMessage = styled.p`
  ${typography.Sans16}
  color: ${palette.pine1};
  margin: 0;
`;

export const ClearButton = styled.button`
  ${typography.Sans16}
  align-self: flex-start;
  padding: 0;
  border: none;
  background: none;
  color: ${palette.pine4};
  text-decoration: underline;
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid ${palette.pine1};
    outline-offset: 2px;
  }
`;

export const BrowseLabel = styled.p`
  ${typography.Sans14}
  color: ${palette.slate70};
  margin: ${rem(spacing.lg)} 0 0 0;
`;

export const BrowseList = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
`;

export const BrowseLink = styled(Link)`
  ${typography.Sans16}
  display: block;
  padding: ${rem(spacing.md)} 0;
  border-bottom: 1px solid ${palette.slate20};
  color: ${palette.pine4};
  text-decoration: none;

  &:focus-visible {
    outline: 2px solid ${palette.pine1};
    outline-offset: 2px;
  }
`;
