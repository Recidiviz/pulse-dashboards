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

import { Card } from "~@jii/common-ui";
import { palette, spacing, typography } from "~design-system";

export const CARRY_IN_COLOR = palette.data.indigo1;
export const CURRENT_MONTH_COLOR = palette.pine4;

export const ProgressCard = styled(Card)`
  border: none;
  background-color: ${palette.marble3};
`;

export const Track = styled.div`
  height: ${rem(12)};
  border-radius: ${rem(8)};
  overflow: hidden;
  background-color: ${palette.marble5};
  display: flex;
`;

export const ProgressLabel = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: ${rem(spacing.md)};
  color: ${palette.slate85};
`;

export const Fill = styled.div<{ $width: number; $color: string }>`
  width: ${({ $width }) => $width}%;
  height: 100%;
  background-color: ${({ $color }) => $color};
`;

export const ProgressBarWrapper = styled.div`
  position: relative;
`;

export const CheckCircle = styled.div`
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);

  display: flex;
  align-items: center;
  justify-content: center;

  width: ${rem(36)};
  height: ${rem(36)};
  border-radius: 50%;
  border: 2px solid ${palette.pine1};
  background-color: ${palette.signal.highlight};
`;

export const LegendSwatch = styled.span`
  display: inline-block;
  width: ${rem(12)};
  height: ${rem(12)};
  border-radius: ${rem(2)};
  margin-right: ${rem(8)};
  background-color: ${CARRY_IN_COLOR};
`;

export const RightColumn = styled.div`
  text-align: right;
`;

export const ScaleLabel = styled.div`
  margin-top: ${rem(spacing.lg)};
  text-align: right;
  font-weight: 700;
`;
export const HoursToGo = styled.div`
  ${typography.Serif34}
  color: ${palette.pine1};
`;
