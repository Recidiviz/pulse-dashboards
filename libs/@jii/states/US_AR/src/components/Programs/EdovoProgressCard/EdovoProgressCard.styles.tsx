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

import { palette, spacing } from "~design-system";

export const ProgressLabel = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: ${rem(spacing.sm)};
  color: ${palette.slate85};
`;

export const Track = styled.div`
  height: ${rem(12)};
  border-radius: ${rem(8)};
  overflow: hidden;
  background-color: ${palette.marble5};
`;

export const Fill = styled.div<{ $width: number }>`
  width: ${({ $width }) => $width}%;
  height: 100%;
  border-radius: ${rem(8)};
  background-color: ${palette.pine4};
`;

export const ProgressFooter = styled.div`
  margin-top: ${rem(spacing.sm)};
  color: ${palette.slate85};
`;
