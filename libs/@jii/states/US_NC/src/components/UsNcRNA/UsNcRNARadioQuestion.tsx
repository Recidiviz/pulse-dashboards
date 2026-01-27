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

import { observer } from "mobx-react-lite";
import { rem } from "polished";
import styled from "styled-components";

import { RNARadioQuestionFormat } from "~@jii/configs";
import { palette } from "~design-system";

import {
  MultipleAnswerGroup,
  MultipleAnswerOption,
  QuestionCopy,
} from "./styles";
import { rnaRadioAnswerCopy } from "./usNcRNAFormCopy";
import { RNAQuestionProps } from "./UsNcRNAQuestion";

export const RadioButton = styled.input`
  appearance: none;

  height: ${rem(16)};
  width: ${rem(16)};
  padding: ${rem(2)} 0;

  border-radius: 50%;
  border: 2px solid ${palette.slate30};

  transition: all 0.1s ease;

  cursor: pointer;

  &:hover {
    border-color: ${palette.signal.links};
  }

  &:checked {
    border: 4.5px solid ${palette.pine4};
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
export const UsNcRNARadioQuestion = observer(function UsNcRNARadioQuestion({
  id,
  question,
  questionNumber,
  format,
  presenter,
}: RNARadioQuestionProps) {
  const answerCopy = rnaRadioAnswerCopy[format];

  return (
    <>
      <QuestionCopy>
        {questionNumber}. {question}
      </QuestionCopy>
      <MultipleAnswerGroup>
        {Object.entries(answerCopy).map(([value, label]) => {
          const inputId = `${id}-${value}`;
          return (
            <MultipleAnswerOption key={value}>
              <RadioButton
                type="radio"
                id={inputId}
                name={id}
                value={value}
                onChange={(e) => {
                  presenter.form.handleTextAnswerChange(id, e.target.value);
                }}
                checked={presenter.form.liveTextAnswers[id] === value}
              />
              <label htmlFor={inputId}>{label}</label>
            </MultipleAnswerOption>
          );
        })}
      </MultipleAnswerGroup>
    </>
  );
});
