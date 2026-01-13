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

import styled from "styled-components";

import { RowDivider } from "~@jii/common-ui";

import {
  LongTextEntry,
  MultipleAnswerGroup,
  MultipleAnswerOption,
  QuestionCard,
  QuestionCopy,
  ShortTextEntry,
} from "./styles";
import {
  rnaLifeAreasQuestionCopy,
  rnaRadioAnswerCopy,
} from "./usNcRNAFormSpec";
import { RNAQuestionProps } from "./UsNcRNAQuestion";
import { RadioButton } from "./UsNcRNARadioQuestion";

const VerticalMultipleAnswerGroup = styled(MultipleAnswerGroup)`
  flex-direction: row;
`;

const VerticalMultipleAnswerOption = styled(MultipleAnswerOption)`
  flex-direction: column;
  align-items: center;
  flex: 1;
`;

interface RNALifeAreaQuestionProps extends RNAQuestionProps {
  format: "LIFE_AREA";
}

/**
 * A question in the RNA form representing someone's assessment of a certain "Life Area"
 */
export const UsNcRNALifeAreaQuestion = function ({
  id,
  question,
  placeholderText,
}: RNALifeAreaQuestionProps) {
  const yesNoCopy = rnaRadioAnswerCopy["YES_NO"];
  const {
    interestedInImproving,
    improvement,
    improvementPlaceholder,
    improvementRatings,
  } = rnaLifeAreasQuestionCopy;

  // TODO: keep track of these somewhere that isn't the component
  const textEntryId = `${id}-input`;
  const yesNoId = `${id}-yes-no`;
  const improvementRatingId = `${id}-improvement`;

  return (
    <QuestionCard>
      <QuestionCopy>{question}</QuestionCopy>

      {
        /* The user can either enter an answer or select yes or no. */
        placeholderText ? (
          <ShortTextEntry
            type={"text"}
            name={textEntryId}
            placeholder={placeholderText}
          />
        ) : (
          <MultipleAnswerGroup>
            {Object.entries(yesNoCopy).map(([value, label]) => {
              const inputId = `${id}-${value}`;
              return (
                <MultipleAnswerOption key={value}>
                  <RadioButton
                    type="radio"
                    id={inputId}
                    name={yesNoId}
                    value={value}
                  />
                  <label htmlFor={inputId}>{label}</label>
                </MultipleAnswerOption>
              );
            })}
          </MultipleAnswerGroup>
        )
      }

      {/* TODO: only show the below if the user marks yes or enters text */}

      <RowDivider />

      <QuestionCopy>{interestedInImproving}</QuestionCopy>
      <VerticalMultipleAnswerGroup>
        {improvementRatings.map((value) => {
          const inputId = `${improvementRatingId}${value}`;
          return (
            <VerticalMultipleAnswerOption key={value}>
              <label htmlFor={inputId}>{value}</label>
              <RadioButton
                type="radio"
                id={inputId}
                name={improvementRatingId}
                value={value}
              />
            </VerticalMultipleAnswerOption>
          );
        })}
      </VerticalMultipleAnswerGroup>

      <RowDivider />

      <QuestionCopy>{improvement}</QuestionCopy>
      <LongTextEntry placeholder={improvementPlaceholder} />
    </QuestionCard>
  );
};
