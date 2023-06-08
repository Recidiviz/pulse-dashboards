// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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
import React from "react";
import styled from "styled-components/macro";

import { useRootStore } from "../../../../components/StoreProvider";
import { useOpportunityFormContext } from "../../OpportunityFormContext";
import {
  AssessmentQuestionNumber,
  AssessmentQuestionSpec,
} from "./assessmentQuestions";
import FormInput from "./FormInput";

const TextWithLeader = styled.div`
  overflow: hidden;
  flex-grow: 1;

  &:after {
    float: left;
    width: 0;
    white-space: nowrap;
    content: "${".".repeat(200)}";
  }
  span {
    background: white;
    padding-right: 0.2em;
  }
`;

const QuestionContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
`;

const Option = styled.div`
  width: 100%;
  display: flex;
  flex-direction: row;
  margin-left: 1rem;
`;

const OptionScore = styled.div`
  flex-grow: 0;
  width: 2rem;
  text-align: right;
  margin-right: 3rem;
`;

const ScoreSelect = styled.select`
  font-size: 1.5em;
  background-color: aliceblue;
`;

type AssessmentQuestionProps = {
  q: AssessmentQuestionSpec;
  i: AssessmentQuestionNumber;
};

const AssessmentQuestion: React.FC<AssessmentQuestionProps> = ({ q, i }) => {
  const selectionKey = `q${i}Selection`;
  const { firestoreStore } = useRootStore();
  const opportunityForm = useOpportunityFormContext();
  const selection = opportunityForm.formData[selectionKey];
  const onChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    firestoreStore.updateFormDraftData(
      opportunityForm,
      selectionKey,
      parseInt(event.target.value)
    );
  };

  return (
    <li>
      <QuestionContainer>
        <div style={{ width: "90%" }}>
          <div>{q.title}</div>
          <div>
            {q.options.map((o) => (
              <Option key={o.text}>
                <TextWithLeader>
                  <span>{o.text}</span>
                </TextWithLeader>
                <OptionScore>{o.score}</OptionScore>
              </Option>
            ))}
            <Option>
              <FormInput name={`q${i}Note`} style={{ width: "100%" }} />
              <OptionScore />
            </Option>
          </div>
        </div>
        <div style={{ textAlign: "center" }}>
          <ScoreSelect onChange={onChange} value={selection}>
            {q.canBeNone && <option value={-1}>0</option>}
            {q.options.map((opt, idx) => (
              <option value={idx} key={opt.text}>
                {opt.score}
              </option>
            ))}
          </ScoreSelect>
          <div>SCORE</div>
        </div>
      </QuestionContainer>
    </li>
  );
};

export default observer(AssessmentQuestion);
