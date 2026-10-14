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
import styled, { css } from "styled-components";

import { Button, palette, spacing, typography } from "~design-system";

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.lg)};
  padding-top: ${rem(spacing.xs)};
`;

export const Heading = styled.h2`
  ${typography.Serif24}

  color: ${palette.pine1};
  margin: 0;
`;

export const WhyWeAsk = styled.div`
  border-bottom: 1px solid ${palette.slate05};
  border-top: 1px solid ${palette.slate05};
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.sm)};
  padding: ${rem(spacing.md)};
`;

export const WhyWeAskLabel = styled.p`
  ${typography.Sans14}

  color: ${palette.slate80};
  margin: 0;
  text-transform: uppercase;
`;

export const WhyWeAskText = styled.p`
  ${typography.Sans16}

  color: ${palette.slate85};
  font-weight: 400;
  margin: 0;
`;

export const SelectionHint = styled.p`
  ${typography.Sans16}

  color: ${palette.pine1};
  font-weight: 400;
  margin: 0;
`;

export const OptionsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.md)};
`;

export const OptionCard = styled.div<{ $selected: boolean }>`
  border: 2px solid ${palette.slate80};
  border-radius: ${rem(8)};
  font-weight: 400;
  padding: ${rem(spacing.md)};
  position: relative;

  /* Stretches the option's label over the whole card so it's all clickable. */
  label::after {
    content: "";
    inset: 0;
    position: absolute;
  }

  ${({ $selected }) =>
    $selected &&
    css`
      background: ${rgba(palette.pine4, 0.12)};
      border-color: ${palette.pine3};
    `}
`;

export const SaveHint = styled.span`
  ${typography.Sans14}

  color: ${palette.slate80};

  strong {
    font-weight: 700;
  }
`;

export const NextButton = styled(Button)`
  min-width: unset;
`;
