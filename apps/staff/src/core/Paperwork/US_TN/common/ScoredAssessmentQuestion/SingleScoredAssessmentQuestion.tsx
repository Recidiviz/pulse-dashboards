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
import React, { ChangeEventHandler } from "react";
import styled from "styled-components";

import { useOpportunityFormContext } from "../../../OpportunityFormContext";
import { SubItem } from "./AssessmentItem";
import { RadioButton, TextWithLeader } from "./styles";
import { AssessmentOption, SingleSectionAssessmentQuestionSpec } from "./types";

const OptionScore = styled.div`
  flex-grow: 0;
  width: 2rem;
  text-align: right;
`;

type OptionProps = {
  option: AssessmentOption;
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

export const SingleScoredAssessmentQuestion = observer(
  function SingleScoredAssessmentQuestion({
    questionSpec,
    questionNumber,
    disabled,
  }: {
    questionSpec: SingleSectionAssessmentQuestionSpec;
    questionNumber: number;
    disabled?: boolean;
  }) {
    const selectionKey = `q${questionNumber}Selection`;
    const opportunityForm = useOpportunityFormContext();
    const selection = opportunityForm.formData[selectionKey];
    const onChange: ChangeEventHandler<HTMLInputElement> = (event) => {
      opportunityForm.updateDraftData(
        selectionKey,
        parseInt(event.target.value),
      );
    };

    return (
      <>
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
      </>
    );
  },
);
