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

const NUMBER_SIZE = 24;

export const Steps = styled.ol`
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.lg)};
  list-style: none;
  margin: 0;
  padding: 0;
`;

export const StepItem = styled.li`
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.md)};
`;

export const StepHeader = styled.div`
  align-items: flex-start;
  display: flex;
  gap: ${rem(spacing.sm)};
`;

export const StepNumber = styled.span`
  ${typography.Sans16}

  align-items: center;
  background-color: ${palette.signal.links};
  border-radius: 50%;
  color: ${palette.white};
  display: flex;
  flex-shrink: 0;
  font-weight: 700;
  height: ${rem(NUMBER_SIZE)};
  justify-content: center;
  width: ${rem(NUMBER_SIZE)};
`;

export const StepHeading = styled.h3`
  ${typography.Sans18}

  color: ${palette.pine2};
  font-weight: 500;
  margin: 0;
`;

export const StepDetail = styled.div`
  padding: 0 ${rem(spacing.xl)};
`;

export const DetailLabel = styled.p`
  ${typography.Sans14}

  color: ${palette.slate80};
  font-weight: 500;
  letter-spacing: 0.06em;
  line-height: ${rem(20)};
  margin: 0;
  text-transform: uppercase;
`;
