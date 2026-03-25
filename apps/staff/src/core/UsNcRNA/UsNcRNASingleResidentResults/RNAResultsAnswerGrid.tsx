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
import styled from "styled-components";

import { allRNAQuestions, RNARadioQuestionFormat } from "~@jii/configs";
import { useUsNcTranslations } from "~@jii/translation";

import { toTitleCase } from "../../../utils";
import { RNAResultsSectionProps } from "./RNAResultsSection";
import {
  FakeRadioButton,
  QuestionNum,
  RNAResultsTable,
  SmallAnswerCell,
  WideAnswerCell,
  WideQuestion,
} from "./styles";

const CenteredHeader = styled.th`
  text-align: center;
`;

export const RNAResultsAnswerGrid = observer(function RNAResultsAnswerGrid({
  questions,
  presenter,
  format,
}: RNAResultsSectionProps & {
  format: RNARadioQuestionFormat;
}) {
  const { t } = useUsNcTranslations();

  const radioAnswers = t(($) => $.rna.radioAnswerCopy[format], {
    returnObjects: true,
  });

  return (
    <RNAResultsTable>
      <thead>
        <tr>
          <th scope="col">#</th>
          <th scope="col">Question</th>
          {Object.values(radioAnswers).map((copy) => (
            <CenteredHeader scope="col" key={copy}>
              {toTitleCase(copy)}
            </CenteredHeader>
          ))}
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
              {Object.keys(radioAnswers).map((option) => (
                <SmallAnswerCell key={option}>
                  {presenter.textAnswers[id] === option ? (
                    <FakeRadioButton $checked={true} $centered={true} />
                  ) : (
                    <FakeRadioButton $checked={false} $centered={true} />
                  )}
                </SmallAnswerCell>
              ))}
            </tr>
          );
        })}
      </tbody>
    </RNAResultsTable>
  );
});
