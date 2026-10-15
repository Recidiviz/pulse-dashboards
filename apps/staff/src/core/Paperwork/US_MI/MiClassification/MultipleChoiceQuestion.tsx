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
import { ChangeEventHandler, useState } from "react";

import { AssessmentOption, UsMiAssessmentQuestionSpec } from "~datatypes";
import { palette } from "~design-system";
import * as Styled from "~sentencing-client/components/CaseDetails/CaseDetails.styles";

import { useOpportunityFormContext } from "../../OpportunityFormContext";
import {
  FormInput,
  PlacementsSection,
  QuestionBox,
  QuestionDescription,
  QuestionHeader,
  QuestionTitle,
  StyledQuestionButton,
  ViewMoreCaseNotes,
} from "./Styles";

type MiNumberQuestionSpec = Extract<
  UsMiAssessmentQuestionSpec,
  { type: "NUMBER" }
>;

export const ClassificationQuestion = observer(function ClassificationQuestion({
  questionSection,
  questionNumber,
  question,
}: {
  questionNumber: number;
  questionSection: number;
  question: UsMiAssessmentQuestionSpec;
}) {
  const [showMore, updateShowMore] = useState(false);
  const [showError, setError] = useState<string | null>();

  const selectionKey = `s${questionSection}q${questionNumber}Selection`;
  const opportunityForm = useOpportunityFormContext();

  const [inputNumber, setInputNumber] = useState<string | number | null>(() => {
    const savedValue = opportunityForm.formData[selectionKey];
    return typeof savedValue === "number" ? savedValue : null;
  });

  const onChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    if (question.type !== "NUMBER") return;
    const { bounds } = question;
    const value = event.target.value.trim();

    if (value === "" || Number(value) < 0 || !/^\d+$/.test(value)) {
      setError("Required. Enter a whole number of 0 or more");
      setInputNumber(value);
      opportunityForm.updateDraftData(selectionKey, "");
      return;
    }

    const number = Number(value);
    if (bounds && number > bounds) {
      setError(`Counted as ${bounds} (max ${bounds})`);
      setInputNumber(number);
      opportunityForm.updateDraftData(selectionKey, bounds);
      return;
    }
    setError(null);
    setInputNumber(number);
    opportunityForm.updateDraftData(selectionKey, number);
  };

  const onChangeSingle = (index: number) => {
    opportunityForm.updateDraftData(selectionKey, index);
  };

  const selection = opportunityForm.formData[selectionKey];

  return (
    <QuestionBox $status={""}>
      <QuestionHeader id="question-header">
        <QuestionTitle>
          {questionNumber}: {question.title}
        </QuestionTitle>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
          }}
        >
          <div
            style={{
              fontWeight: "600",
              color: "black",
            }}
          >
            0
          </div>
        </div>
      </QuestionHeader>
      <QuestionDescription>{question.description}</QuestionDescription>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          id="questions"
          style={{ display: "flex", flexDirection: "row", flexWrap: "wrap" }}
        >
          {question.type === "SINGLE" ? (
            question.options.map((value: AssessmentOption, index: number) => (
              <SingleSelectionQuestion
                key={value.text}
                value={value}
                selection={selection}
                index={index}
                onChangeSingle={onChangeSingle}
              />
            ))
          ) : (
            <NumberMultiplierQuestion
              question={question}
              inputNumber={inputNumber}
              score={0}
              onChange={onChange}
              showError={showError}
            />
          )}
        </div>
        <div
          id="bottom-half"
          style={{ display: "flex", flexDirection: "column", width: "40%" }}
        >
          {question && (
            <ViewMoreCaseNotes
              onClick={(e) => {
                e.preventDefault();
                updateShowMore(!showMore);
              }}
            >
              {showMore ? "Show Fewer" : "Show More"}
            </ViewMoreCaseNotes>
          )}
        </div>
      </div>
    </QuestionBox>
  );
});

export const NumberMultiplierQuestion = observer(
  function NumberMultiplierQuestion({
    question,
    inputNumber,
    onChange,
    score,
    showError,
  }: {
    question: MiNumberQuestionSpec;
    inputNumber: number | string | null;
    score: number;
    onChange: ChangeEventHandler<HTMLInputElement>;
    showError: string | null | undefined;
  }) {
    return (
      <div style={{ width: "100%" }}>
        {question.bounds > 0 && <span>Max: {question.bounds}</span>}
        <PlacementsSection>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div>{question.countDescriptor}</div>
            {showError && (
              <div
                style={{
                  color: "rgb(138, 100, 32)",
                }}
              >
                {showError}
              </div>
            )}
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-around",
              alignItems: "center",
            }}
          >
            <FormInput
              value={inputNumber ?? ""}
              onChange={onChange}
              type="text"
            />
            <div>x {question.multiplier}</div>
            <div style={{ marginLeft: "30px" }}>= {score}</div>
          </div>
        </PlacementsSection>
      </div>
    );
  },
);

export const SingleSelectionQuestion = observer(
  function SingleSelectionQuestion({
    index,
    selection,
    value,
    onChangeSingle,
  }: {
    index: number;
    selection: number;
    value: AssessmentOption;
    onChangeSingle: (index: number) => void;
  }) {
    return (
      <StyledQuestionButton>
        <Styled.RecommendationOption
          selected={index === selection}
          isDisabled={false}
          onClick={() => onChangeSingle(index)}
        >
          <Styled.InputSelection
            type="radio"
            disabled={false}
            checked={index === selection}
            readOnly
          />
          <Styled.RecommendationDetails>
            <Styled.RecommendationOptionLabel smallFont={true}>
              {value.text}
              <span style={{ color: palette.slate50 }}>
                {value.score > 0 ? `+${value.score}` : value.score}
              </span>
            </Styled.RecommendationOptionLabel>
          </Styled.RecommendationDetails>
        </Styled.RecommendationOption>
      </StyledQuestionButton>
    );
  },
);
