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

import { useState } from "react";

import { checkInQuestionConfig, CheckInQuestionId } from "~@jii/configs";
import { useUsNeTranslations } from "~@jii/translation";
import { Checkbox, CheckboxGroup } from "~design-system";

import { useResidentGivenNames } from "./hooks/useResidentGivenNames";
import {
  AnswerHint,
  OptionalHint,
  OptionCard,
  OptionsList,
  QuestionText,
} from "./UsNeCheckInQuestion.styles";

export const UsNeCheckInCheckboxQuestion = ({
  id,
  answers,
}: {
  id: CheckInQuestionId;
  answers: readonly string[];
}) => {
  const { t } = useUsNeTranslations();
  const isOptional = !!checkInQuestionConfig[id].optional;

  const [selected, setSelected] = useState<string[]>([]);

  const questionCopy = t(($) => $.checkIn.questions[id], {
    returnObjects: true,
    name: useResidentGivenNames(),
  });

  // Not all questions have answer copy, but the existence of answer
  // copy for checkbox questions is checked by a test in the @jii/translation library
  const answerCopy: Record<string, string> =
    "answers" in questionCopy ? questionCopy.answers : {};

  return (
    <>
      <QuestionText>{questionCopy.question}</QuestionText>
      {isOptional && (
        <OptionalHint>{t(($) => $.checkIn.questionPage.optional)}</OptionalHint>
      )}
      <AnswerHint>{t(($) => $.checkIn.questionPage.checkAll)}</AnswerHint>
      <CheckboxGroup
        value={selected}
        onChange={setSelected}
        ariaLabel={questionCopy.question}
      >
        <OptionsList>
          {answers.map((option) => (
            <OptionCard key={option} $selected={selected.includes(option)}>
              <Checkbox value={option}>{answerCopy[option]}</Checkbox>
            </OptionCard>
          ))}
        </OptionsList>
      </CheckboxGroup>
    </>
  );
};
