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

import { observer } from "mobx-react-lite";
import { rem } from "polished";
import styled from "styled-components";

import {
  allRNAQuestions,
  isRNARadioFormat,
  rnaQuestionConfig,
  RNAQuestionFormat,
  RNAQuestionId,
} from "~@jii/configs";
import { useUsNcTranslations } from "~@jii/translation";
import { spacing } from "~design-system";

import { ResultsPagePresenter } from "./ResultsPagePresenter";
import { RNAResultsSectionProps } from "./RNAResultsSection";
import {
  FakeRadioButton,
  QuestionNum,
  RNAResultsTable,
  WideAnswerCell,
  WideQuestion,
} from "./styles";

const Option = styled.div`
  &:not(&:last-child) {
    margin-bottom: ${rem(spacing.xs)};
  }
`;

export const RNAAnswerList = ({
  answerCopy,
  answers,
}: {
  answerCopy: Record<string, string>;
  answers: string[];
}) => {
  return Object.entries(answerCopy).map(([key, value]) => (
    <Option key={key}>
      {answers.includes(key) ? (
        <FakeRadioButton $checked={true} $centered={false} />
      ) : (
        <FakeRadioButton $checked={false} $centered={false} />
      )}
      <span>{value}</span>
    </Option>
  ));
};

export const RNAResultsAnswers = observer(function RNAResultsAnswers({
  format,
  questionId,
  presenter,
}: {
  format: RNAQuestionFormat;
  questionId: RNAQuestionId;
  presenter: ResultsPagePresenter;
}) {
  const { t } = useUsNcTranslations();
  const rnaCopy = t(($) => $.rna, { returnObjects: true });

  if (isRNARadioFormat(format)) {
    // Radio button question
    const selectedAnswer = presenter.textAnswers[questionId];

    return (
      <RNAAnswerList
        answerCopy={rnaCopy.radioAnswerCopy[format]}
        answers={selectedAnswer ? [selectedAnswer] : []}
      />
    );
  } else if (format === "SOBRIETY") {
    // Checkbox question (which we display as fake radio buttons for simplicity)
    const answer = presenter.checkboxAnswers[questionId] ?? {};
    const selectedAnswers = Object.keys(answer).filter((k) => answer[k]);
    return (
      <RNAAnswerList
        answerCopy={rnaCopy.sobrietyAnswerCopy}
        answers={selectedAnswers}
      />
    );
  } else {
    // Free-text question
    return <span>{presenter.textAnswers[questionId] ?? "(no answer)"}</span>;
  }
});

export const RNAResultsAnswerList = observer(function RNAResultsAnswerList({
  questions,
  presenter,
}: RNAResultsSectionProps) {
  const { t } = useUsNcTranslations();

  return (
    <RNAResultsTable>
      <thead>
        <tr>
          <th scope="col">#</th>
          <th scope="col">Question</th>
          <th scope="col">Answer</th>
        </tr>
      </thead>

      <tbody>
        {questions.map((id) => {
          const questionText = t(($) => $.rna.questionCopy[id].question);

          return (
            <tr key={id}>
              <th scope="row">
                <QuestionNum>{allRNAQuestions.indexOf(id) + 1}</QuestionNum>
              </th>
              <WideAnswerCell>
                <WideQuestion>{questionText}</WideQuestion>
              </WideAnswerCell>
              <WideAnswerCell>
                <RNAResultsAnswers
                  format={rnaQuestionConfig[id].format}
                  questionId={id}
                  presenter={presenter}
                />
              </WideAnswerCell>
            </tr>
          );
        })}
      </tbody>
    </RNAResultsTable>
  );
});
