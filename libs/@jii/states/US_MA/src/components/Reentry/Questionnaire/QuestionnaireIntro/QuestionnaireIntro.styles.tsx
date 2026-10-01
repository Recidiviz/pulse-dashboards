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

import { rem, rgba } from "polished";
import styled from "styled-components";

import { Button, Card, palette, spacing, typography } from "~design-system";

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.lg)};
`;

export const Heading = styled.h1`
  ${typography.Serif34}

  color: ${palette.pine1};
  margin: ${rem(spacing.sm)} 0 0 0;
`;

export const InstructionsCard = styled(Card)`
  flex-direction: column;
  gap: ${rem(spacing.lg)};
  background: ${palette.marble3};
  border-radius: ${rem(8)};
  padding: ${rem(spacing.lg)};
`;

export const InstructionsHeading = styled.p`
  ${typography.Sans16}

  color: ${palette.pine1};
  font-weight: 700;
  margin: 0;
`;

export const StepList = styled.ol`
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.md)};
  list-style: none;
  margin: 0;
  padding: 0;
`;

export const StepItem = styled.li`
  ${typography.Sans16}

  display: flex;
  align-items: flex-start;
  gap: ${rem(spacing.sm)};
  color: ${palette.slate85};
`;

export const StepNumber = styled.span`
  ${typography.Sans12}

  height: ${rem(18)};
  width: ${rem(18)};
  display: flex;
  justify-content: center;
  align-items: center;
  flex-shrink: 0;
  background: ${palette.pine4};
  border-radius: 50%;
  color: ${palette.marble1};
  font-size: ${rem(10)};
`;

export const Callout = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.xs)};
  background: ${rgba(palette.signal.notification, 0.1)};
  border-left: 3px solid ${palette.signal.notification};
  padding: ${rem(spacing.md)};
`;

export const CalloutHeading = styled.p`
  ${typography.Sans18}

  color: ${palette.pine1};
  font-weight: 700;
  margin: 0;
`;

export const CalloutDescription = styled.p`
  ${typography.Sans16}

  color: ${palette.slate85};
  margin: 0;
`;

export const StartButton = styled(Button)`
  align-self: center;
  margin-top: ${rem(spacing.lg)};
`;
