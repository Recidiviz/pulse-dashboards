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

export const Header = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: ${rem(spacing.md)};
`;

export const Title = styled.h2`
  ${typography.Sans24}

  color: ${palette.pine1};
  margin: 0;
`;

export const HeaderActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${rem(spacing.md)};
`;

export const Divider = styled.hr`
  border: none;
  border-top: 1px solid ${palette.slate20};
  margin: ${rem(spacing.lg)} 0;
`;

export const Subtitle = styled.p`
  ${typography.Sans16}

  color: ${palette.pine1};
  margin: 0 0 ${rem(spacing.xl)};
`;

export const GroupLabel = styled.h3`
  ${typography.Sans14}

  color: ${palette.slate80};
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin: 0 0 ${rem(spacing.md)};
`;

export const GroupOptions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${rem(spacing.sm)};
  margin-bottom: ${rem(spacing.xl)};
`;
