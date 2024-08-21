// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

// TODO(#4108): Consider and apply refactoring `UsTnAnnualReclassificationReview...` and `UsTnCustodyLevelDowngrade...` files to remove duplicated logic.
import { observer } from "mobx-react-lite";
import React, { ChangeEventHandler } from "react";
import styled from "styled-components/macro";

import { useOpportunityFormContext } from "../../OpportunityFormContext";
import AssessmentItem, { SubItem } from "./AssessmentItem";
import {
  AssessmentQuestionNumber,
  AssessmentQuestionSpec,
} from "./assessmentQuestions";
import FormTextarea from "./FormTextarea";
import { RadioButton, TextWithLeader } from "./styles";

const OptionScore = styled.div`
  flex-grow: 0;
  width: 2rem;
  text-align: right;
`;

type OptionProps = {
  option: AssessmentQuestionSpec["options"][number];
  i: number;
  selection: number;
  onChange: ChangeEventHandler<HTMLInputElement>;
  disabled?: boolean;
};

const Option: React.FC<OptionProps> = ({
  option: { text, score },
  i,
  selection,
  onChange,
  disabled,
}) => {
  return (
    <SubItem as="label">
      {disabled ? null : (
        <RadioButton value={i} checked={i === selection} onChange={onChange} />
      )}
      <TextWithLeader>{text}</TextWithLeader>
      <OptionScore>{score}</OptionScore>
    </SubItem>
  );
};

type AssessmentQuestionProps = {
  questionSpec: AssessmentQuestionSpec;
  questionNumber: AssessmentQuestionNumber;
  disabled?: boolean;
};

const AssessmentQuestion: React.FC<AssessmentQuestionProps> = ({
  questionSpec,
  questionNumber,
  disabled,
}) => {
  const selectionKey = `q${questionNumber}Selection`;
  const opportunityForm = useOpportunityFormContext();
  const selection = opportunityForm.formData[selectionKey];
  const onChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    opportunityForm.updateDraftData(selectionKey, parseInt(event.target.value));
  };

  let score;
  if (selection !== undefined) {
    score = selection === -1 ? 0 : questionSpec.options[selection].score;
  }

  return (
    <AssessmentItem
      title={`${questionNumber}. ${questionSpec.title}`}
      score={disabled ? undefined : score}
      scoreText="SCORE"
    >
      {questionSpec.canBeNone ? (
        <Option
          option={{ text: "None", score: 0 }}
          i={-1}
          key="None"
          selection={selection}
          onChange={onChange}
          disabled={disabled}
        />
      ) : null}
      {questionSpec.options.map((o, i) => (
        <Option
          option={o}
          i={i}
          key={o.text}
          selection={selection}
          onChange={onChange}
          disabled={disabled}
        />
      ))}
      <SubItem>
        {disabled ? (
          <br />
        ) : (
          <FormTextarea
            name={`q${questionNumber}Note`}
            placeholder="Add Note"
            style={{ width: "100%", fontStyle: "italic" }}
          />
        )}
      </SubItem>
    </AssessmentItem>
  );
};

export default observer(AssessmentQuestion);
