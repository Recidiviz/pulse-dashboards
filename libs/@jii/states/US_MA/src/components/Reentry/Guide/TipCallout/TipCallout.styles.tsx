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

export const Wrapper = styled.aside`
  align-items: center;
  border-bottom: 1px solid ${palette.slate05};
  border-top: 1px solid ${palette.slate05};
  display: flex;
  gap: ${rem(spacing.md)};
  padding: ${rem(spacing.md)};
`;

export const Icon = styled.img`
  flex-shrink: 0;
`;

export const Content = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: ${rem(spacing.xs)};
`;

export const Label = styled.p`
  ${typography.Sans14}

  color: ${palette.slate80};
  font-weight: 600;
  letter-spacing: 0.06em;
  margin: 0;
  text-transform: uppercase;
`;
