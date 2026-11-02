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
import { ChangeEventHandler, useEffect, useRef, useState } from "react";

import { AssessmentOption, UsMiAssessmentQuestionSpec } from "~datatypes";
import * as Styled from "~sentencing-client/components/CaseDetails/CaseDetails.styles";

import { UsMiInitialClassificationForm } from "../../../../WorkflowsStore/Opportunity/Forms/UsMiInitialClassification2026Form";
import { UsMiReviewClassificationForm } from "../../../../WorkflowsStore/Opportunity/Forms/UsMiReviewClassification2026Form";
import { useOpportunityFormContext } from "../../OpportunityFormContext";
import { QuestionNotes } from "./FormNotes";
import {
  FlexColumn,
  FormInput,
  NumberCalculation,
  NumberQuestionContainer,
  NumberQuestionError,
  NumberScore,
  OptionScore,
  PlacementsSection,
  QuestionBox,
  QuestionDescription,
  QuestionHeader,
  QuestionHeaderRight,
  QuestionNotesSection,
  QuestionOptions,
  QuestionScore,
  QuestionStatusBadge,
  QuestionTitle,
  RequiredAsterisk,
  StyledQuestionButton,
} from "./Styles";

type MiNumberQuestionSpec = Extract<
  UsMiAssessmentQuestionSpec,
  { type: "NUMBER" }
>;

function boundsMessage(bounds: number) {
  return `Counted as ${bounds} (max ${bounds})`;
}

export const NumberMultiplierQuestion = function NumberMultiplierQuestion({
  question,
  inputNumber,
  onChange,
  score,
  showError,
}: {
  question: MiNumberQuestionSpec;
  inputNumber: number | string | null;
  score: number | string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  showError: string | null | undefined;
}) {
  const maxBound = question.bounds > 0 && question.bounds;
  return (
    <NumberQuestionContainer>
      {maxBound && <span>Max: {maxBound}</span>}
      <PlacementsSection>
        <FlexColumn>
          <div>{question.countDescriptor}</div>
          {showError && <NumberQuestionError>{showError}</NumberQuestionError>}
        </FlexColumn>
        <NumberCalculation>
          <FormInput
            value={inputNumber ?? ""}
            onChange={onChange}
            type="text"
          />
          <div>x {question.multiplier}</div>
          <NumberScore>= {score}</NumberScore>
        </NumberCalculation>
      </PlacementsSection>
    </NumberQuestionContainer>
  );
};

export const SingleSelectionQuestion = function SingleSelectionQuestion({
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
            <OptionScore>
              {value.score > 0 ? `+${value.score}` : value.score}
            </OptionScore>
          </Styled.RecommendationOptionLabel>
        </Styled.RecommendationDetails>
      </Styled.RecommendationOption>
    </StyledQuestionButton>
  );
};

export const ClassificationQuestion = observer(function ClassificationQuestion({
  questionSection,
  questionNumber,
  question,
}: {
  questionNumber: number;
  questionSection: number;
  question: UsMiAssessmentQuestionSpec;
}) {
  const selectionKey = `s${questionSection}q${questionNumber}Selection`;
  const opportunityForm = useOpportunityFormContext();
  const selection = opportunityForm.formData[selectionKey];

  const [showError, setError] = useState<string | null>(null);
  const lastWrittenSelection = useRef(selection);

  // The error describes the value onChange last wrote. If the selection changes
  // to anything else, such as when the form is reverted, the error is stale.
  useEffect(() => {
    if (selection !== lastWrittenSelection.current) setError(null);
  }, [selection]);

  const writeSelection = (value: number | "", error: string | null) => {
    lastWrittenSelection.current = value;
    setError(error);
    opportunityForm.updateDraftData(selectionKey, value);
  };

  const onChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    if (question.type !== "NUMBER") return;
    const { bounds } = question;
    const value = event.target.value.trim();

    if (value === "" || Number(value) < 0 || !/^\d+$/.test(value)) {
      // this can't be deleteField() because that comes through as 0
      // which then doesn't work for the remaining field section
      writeSelection("", "Required. Enter a whole number of 0 or more");
      return;
    }

    const number = Number(value);
    if (bounds && number > bounds) {
      writeSelection(bounds, boundsMessage(bounds));
      return;
    }
    writeSelection(number, null);
  };

  const onChangeSingle = (index: number) => {
    opportunityForm.updateDraftData(selectionKey, index);
  };

  const { derivedData } = useOpportunityFormContext() as
    | UsMiInitialClassificationForm
    | UsMiReviewClassificationForm;
  const scoreKey = `s${questionSection}q${questionNumber}Score` as Exclude<
    Extract<keyof typeof derivedData, `${string}Score`>,
    "totalScore"
  >;

  const score = derivedData[scoreKey];

  const notesKey = `s${questionSection}q${questionNumber}Notes` as Extract<
    keyof typeof derivedData,
    `${string}Notes`
  >;
  const note = derivedData[notesKey];

  const status = question.autofilled !== false && "AUTO-FILLED";

  const required =
    opportunityForm.formData[selectionKey] === "" ||
    opportunityForm.formData[selectionKey] === undefined;

  return (
    <QuestionBox $required={required}>
      <QuestionHeader id="question-header">
        <QuestionTitle>
          {questionNumber}: {question.title}
          {required && <RequiredAsterisk>{` *`}</RequiredAsterisk>}
        </QuestionTitle>

        <QuestionHeaderRight>
          {status && (
            <QuestionStatusBadge $status={status}>{status}</QuestionStatusBadge>
          )}

          <QuestionScore>
            {typeof score === "number" ? score : "-"}
          </QuestionScore>
        </QuestionHeaderRight>
      </QuestionHeader>
      <QuestionDescription>{question.description}</QuestionDescription>
      <FlexColumn>
        <QuestionOptions id="questions">
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
              inputNumber={selection}
              score={score || 0}
              onChange={onChange}
              showError={showError}
            />
          )}
        </QuestionOptions>
        <QuestionNotesSection id="bottom-half">
          <QuestionNotes noteInfo={question.note} note={note} />
        </QuestionNotesSection>
      </FlexColumn>
    </QuestionBox>
  );
});
