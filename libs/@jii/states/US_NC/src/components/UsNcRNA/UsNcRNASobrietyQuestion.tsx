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

import { Checkbox } from "~@jii/common-ui";

import {
  MultipleAnswerGroup,
  MultipleAnswerOption,
  QuestionCopy,
} from "./styles";
import { rnaSobrietyAnswerCopy } from "./usNcRNAFormCopy";
import { RNAQuestionProps } from "./UsNcRNAQuestion";

interface RNASobrietyQuestionProps extends RNAQuestionProps {
  format: "SOBRIETY";
}

/**
 * A question in the RNA form with checkboxes for answer choices.
 * (Currently the only possible answer copy for this question format is about sobriety)
 */
export const UsNcRNASobrietyQuestion = observer(
  function UsNcRNASobrietyQuestion({
    id,
    question,
    questionNumber,
    presenter,
  }: RNASobrietyQuestionProps) {
    return (
      <>
        <QuestionCopy>
          {questionNumber}. {question}
        </QuestionCopy>
        <MultipleAnswerGroup>
          {Object.entries(rnaSobrietyAnswerCopy).map(([value, label]) => {
            const checkboxAnswers = presenter.form.liveCheckboxAnswers[id];

            const inputId = `${id}-${value}`;
            return (
              <MultipleAnswerOption key={`${value}${label}`}>
                <Checkbox
                  $size={16}
                  id={inputId}
                  name={id}
                  value={value}
                  onChange={(e) => {
                    presenter.form.handleCheckboxAnswerChange(
                      id,
                      value,
                      e.target.checked,
                    );
                  }}
                  checked={checkboxAnswers?.[value] ?? false}
                />
                <label htmlFor={inputId}>{label}</label>
              </MultipleAnswerOption>
            );
          })}
        </MultipleAnswerGroup>
      </>
    );
  },
);
