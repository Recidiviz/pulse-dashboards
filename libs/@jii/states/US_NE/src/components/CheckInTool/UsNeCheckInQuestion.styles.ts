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

import { animation, palette, spacing, typography } from "~design-system";

export const QuestionNumber = styled.span`
  ${typography.Sans16}
  font-weight: 700;
  color: ${palette.slate85};
  text-transform: uppercase;
`;

export const QuestionWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.md)};
  margin-top: ${rem(spacing.md)};
`;

export const QuestionText = styled.h2`
  ${typography.Sans24}
`;

export const OptionalHint = styled.span`
  ${typography.Sans16}

  color: ${palette.slate85};
`;

export const AnswerHint = styled.span`
  ${typography.Sans16}
`;

export const TextEntry = styled.textarea.attrs({
  rows: 10,
  maxLength: 500,
})`
  appearance: none;

  font-size: ${rem(14)};

  padding: ${rem(spacing.md)};

  border-radius: ${rem(4)};
  border: 2px solid ${palette.slate50};

  transition: border-color ${animation.defaultDurationMs}ms;

  &:hover,
  &:focus {
    border-color: ${palette.pine3};
  }

  &:focus {
    outline: unset;
  }

  resize: none;
  width: 100%;
`;

// OptionsList and OptionsCard are the same as in the US_MA Reentry Questionnaire

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
