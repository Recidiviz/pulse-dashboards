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
import styled from "styled-components";

import { RowDivider } from "~@jii/common-ui";
import { useUsNcTranslations } from "~@jii/translation";

import {
  LongTextEntry,
  MultipleAnswerGroup,
  MultipleAnswerOption,
  QuestionCopy,
  QuestionExplainer,
  ShortTextEntry,
} from "../styles";
import { RNAQuestionProps } from "./UsNcRNAQuestion";
import { RadioButton } from "./UsNcRNARadioQuestion";

const VerticalMultipleAnswerGroup = styled(MultipleAnswerGroup)`
  flex-direction: unset;
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
export const UsNcRNALifeAreaQuestion = observer(
  function UsNcRNALifeAreaQuestion({
    id,
    question,
    placeholderText,
    presenter,
  }: RNALifeAreaQuestionProps) {
    const { t } = useUsNcTranslations();

    const yesNoCopy = t(($) => $.rna.radioAnswerCopy["YES_NO"], {
      returnObjects: true,
    });

    const {
      interestedInImproving,
      improvement,
      improvementPlaceholder,
      customLifeAreaPrompt,
      isThisAProblem,
    } = t(($) => $.rna.lifeAreasQuestionCopy, { returnObjects: true });

    // hardcoded here, not in the copy library, because it doesn't need translation
    const ratingScale = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];

    const yesNoId = `${id}-yes-no`;
    const improvementRatingId = `${id}-improvement`;

    return (
      <>
        <QuestionCopy>{question}</QuestionCopy>

        {
          /* The user can either enter an answer or select yes or no. */
          placeholderText ? (
            <>
              <QuestionExplainer>{customLifeAreaPrompt}</QuestionExplainer>
              <ShortTextEntry
                id={id}
                type={"text"}
                placeholder={placeholderText}
                onChange={(e) => {
                  presenter.form.handleLifeAreaAnswerChange(id, {
                    customLifeArea: e.target.value,
                  });
                }}
              />
            </>
          ) : (
            <>
              <QuestionExplainer>{isThisAProblem}</QuestionExplainer>
              <MultipleAnswerGroup>
                {Object.entries(yesNoCopy).map(([value, label]) => {
                  const inputId = `${id}-${value}`;
                  // This radio button does not have checked or defaultChecked set
                  // on purpose: we restrict saving Life Area answers without fully
                  // submitting the form, so users should never see saved values here.
                  return (
                    <MultipleAnswerOption key={value}>
                      <RadioButton
                        type="radio"
                        id={inputId}
                        name={yesNoId}
                        value={label}
                        onChange={(e) => {
                          presenter.form.handleLifeAreaAnswerChange(id, {
                            interest: e.target.value === yesNoCopy["YES"],
                          });
                        }}
                      />
                      <label htmlFor={inputId}>{label}</label>
                    </MultipleAnswerOption>
                  );
                })}
              </MultipleAnswerGroup>
            </>
          )
        }

        {presenter.form.shouldShowLifeAreaFollowups(id) && (
          <>
            <RowDivider />

            <QuestionExplainer>{interestedInImproving}</QuestionExplainer>
            <VerticalMultipleAnswerGroup>
              {ratingScale.map((value) => {
                const inputId = `${improvementRatingId}${value}`;
                return (
                  <VerticalMultipleAnswerOption key={value}>
                    <label htmlFor={inputId}>{value}</label>
                    <RadioButton
                      type="radio"
                      id={inputId}
                      name={improvementRatingId}
                      value={value}
                      checked={
                        presenter.form.liveLifeAreaAnswers[id]
                          ?.interestRating === value
                      }
                      onChange={(e) => {
                        presenter.form.handleLifeAreaAnswerChange(id, {
                          interestRating: e.target.value,
                        });
                      }}
                    />
                  </VerticalMultipleAnswerOption>
                );
              })}
            </VerticalMultipleAnswerGroup>

            <RowDivider />

            <QuestionExplainer>{improvement}</QuestionExplainer>
            <LongTextEntry
              placeholder={improvementPlaceholder}
              onChange={(e) => {
                presenter.form.handleLifeAreaAnswerChange(id, {
                  improvementText: e.target.value,
                });
              }}
              value={
                presenter.form.liveLifeAreaAnswers[id]?.improvementText ?? ""
              }
            />
          </>
        )}
      </>
    );
  },
);
