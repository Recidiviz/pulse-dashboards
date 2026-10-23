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

export const ReasonList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
`;

export const Reason = styled.li`
  border-top: 1px solid ${palette.slate40};
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.md)};
  padding: ${rem(spacing.md)} 0;

  &:last-child {
    padding-bottom: 0;
  }
`;

export const Fields = styled.dl`
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.md)};
  margin: 0;
`;

export const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.sm)};
`;

export const FieldLabel = styled.dt`
  ${typography.Sans12}

  color: ${palette.slate80};
  font-weight: 500;
`;

export const FieldValue = styled.dd`
  ${typography.Sans14}

  color: ${palette.pine2};
  margin: 0;
`;
