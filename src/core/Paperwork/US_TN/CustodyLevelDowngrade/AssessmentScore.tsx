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

import { useOpportunityFormContext } from "../../OpportunityFormContext";
import {
  AssessmentQuestionNumber,
  assessmentQuestionNumbers,
  assessmentQuestions,
} from "./assessmentQuestions";

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
  margin-left: 2.5rem;
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
  width: 4rem;
  text-align: right;
  margin-right: 3rem;
`;

const TotalScore = styled.div`
  font-size: 2em;
  text-align: center;
  width: 2rem;
  border-bottom: 1px solid black;
`;

type AssessmentScoreProps = {
  questions?: AssessmentQuestionNumber[];
};

const schedule = {
  title: "CUSTODY LEVEL SCALE FOR TOTAL A+B (CAF SCORE)",
  options: [
    { text: "Close", score: "17 or More" },
    { text: "Medium", score: "7 - 16" },
    { text: "Minimum", score: "6 or Less" },
  ],
};

const AssessmentScore: React.FC<AssessmentScoreProps> = ({ questions }) => {
  const opportunityForm = useOpportunityFormContext();

  let total = 0;
  (questions || assessmentQuestionNumbers).forEach((n) => {
    const selection = opportunityForm.formData[`q${n}Selection`];
    if (selection !== -1) {
      total += assessmentQuestions[n - 1].options[selection].score;
    }
  });

  const q = schedule;

  return (
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
        </div>
      </div>
      <div style={{ textAlign: "center" }}>
        <TotalScore>{total}</TotalScore>
      </div>
    </QuestionContainer>
  );
};

export default observer(AssessmentScore);
