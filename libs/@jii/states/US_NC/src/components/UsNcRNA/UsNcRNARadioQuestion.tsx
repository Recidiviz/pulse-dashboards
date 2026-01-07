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

import { spacing, typography } from "@recidiviz/design-system";
import { rem } from "polished";
import styled from "styled-components";

import { Card } from "~@jii/common-ui";
import { palette } from "~design-system";

import { rnaRadioAnswerCopy, RNARadioQuestionFormat } from "./usNcRNAFormSpec";
import { RNAQuestionProps } from "./UsNcRNAQuestion";

const QuestionCopy = styled.div``;

const RadioAnswerGroup = styled.div`
  margin-top: ${rem(spacing.md)};

  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.sm)};
`;

const RadioAnswer = styled.div`
  ${typography.Sans14}
  display: flex;
  gap: ${rem(spacing.sm)};
`;

const RadioButton = styled.input`
  appearance: none;

  height: ${rem(16)};
  width: ${rem(16)};
  padding: ${rem(2)} 0;

  border-radius: 50%;
  border: 1px solid ${palette.slate30};

  &:checked {
    border: 5px solid ${palette.pine4};
  }

  &:focus {
    outline: 2px solid ${palette.signal.links};
    outline-offset: 2px;
  }
`;

interface RNARadioQuestionProps extends RNAQuestionProps {
  format: RNARadioQuestionFormat;
}

/**
 * A question in the RNA form with radio buttons for answer choices.
 */
export const UsNcRNARadioQuestion = function ({
  id,
  question,
  questionNumber,
  format,
}: RNARadioQuestionProps) {
  const answerCopy = rnaRadioAnswerCopy[format];

  return (
    <Card>
      <QuestionCopy>
        {questionNumber}. {question}
      </QuestionCopy>
      <RadioAnswerGroup>
        {Object.entries(answerCopy).map(([value, label]) => {
          const inputId = `${id}-${value}`;
          return (
            <RadioAnswer key={`${value}${label}`}>
              <RadioButton type="radio" id={inputId} name={id} value={value} />
              <label htmlFor={inputId}>{label}</label>
            </RadioAnswer>
          );
        })}
      </RadioAnswerGroup>
    </Card>
  );
};
