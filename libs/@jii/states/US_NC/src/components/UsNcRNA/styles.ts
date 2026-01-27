// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { animation, typography } from "@recidiviz/design-system";
import { rem } from "polished";
import styled from "styled-components";

import { Card } from "~@jii/common-ui";
import { palette, spacing } from "~design-system";

export const RNAHeading = styled.h1`
  ${typography.Sans24};

  font-size: ${rem(34)};
`;

export const RNADescription = styled.div`
  color: ${palette.slate85};
  line-height: 1.7;

  margin-top: ${rem(spacing.lg)};
  &:not(:last-child) {
    margin-bottom: ${rem(spacing.lg)};
  }
`;

export const QuestionCard = styled(Card)<{ $invalid: boolean }>`
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.md)};

  ${(props) => props.$invalid && `border: 1px solid ${palette.signal.error};`}

  svg {
    color: ${palette.signal.error};
    height: ${rem(16)};
    flex: 0;
    margin-right: ${rem(spacing.sm)};
    vertical-align: text-top;
  }
`;

export const QuestionCopy = styled.div``;

export const InvalidAnswerNotice = styled.span`
  color: ${palette.signal.error};
`;

export const UnboxedNotice = styled.div`
  color: ${palette.pine4};
  text-align: center;
`;

// For radio button and checkbox answers
export const MultipleAnswerGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.sm)};
`;

export const MultipleAnswerOption = styled.div`
  ${typography.Sans14}
  display: flex;
  gap: ${rem(spacing.sm)};
`;

const textEntryStyles = `
  appearance: none;

  font-size: ${rem(14)};

  padding: ${rem(spacing.sm)} ${rem(spacing.md)};

  border-radius: ${rem(4)};
  border: 2px solid ${palette.slate30};

  transition: all ${animation.defaultDurationMs}ms ease;
  
  &:hover,
  &:focus {
    border: 2px solid ${palette.signal.links};
  }

  transition: all 0.2s ease;

  &:focus {
    outline: unset;
  }

  &::placeholder {
    color: ${palette.slate70};
  }
`;

export const ShortTextEntry = styled.input`
  ${textEntryStyles}

  height: ${rem(36)};
  width: 60%;
`;

export const LongTextEntry = styled.textarea.attrs({ rows: 3 })`
  ${textEntryStyles}

  resize: none;
  width: 100%;
`;
