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
import { ChangeEventHandler } from "react";
import styled from "styled-components";

import { useOpportunityFormContext } from "../../../OpportunityFormContext";
import { SubItem } from "./AssessmentItem";
import { RadioButton } from "./styles";
import {
  BreakdownAssessmentQuestionPeriod,
  BreakdownAssessmentQuestionSpec,
} from "./types";

const BreakdownTable = styled.table`
  width: 100%;

  border-collapse: collapse;
  & th,
  td {
    border: black solid 1px;
    padding-top: 0.25rem;
    padding-bottom: 0.25rem;

    & label {
      margin-bottom: 0;
    }
  }
`;

export function BreakdownScoredAssessmentQuestion({
  questionNumber,
  questionSpec,
  disabled,
}: {
  questionSpec: BreakdownAssessmentQuestionSpec;
  questionNumber: number;
  disabled?: boolean;
}) {
  return (
    <SubItem>
      <BreakdownTable>
        <tbody>
          {questionSpec.sections.map((section) => {
            return (
              <BreakdownRow
                key={section.period}
                section={section}
                questionNumber={questionNumber}
                disabled={disabled}
              />
            );
          })}
        </tbody>
      </BreakdownTable>
    </SubItem>
  );
}

const BreakdownRow = observer(function BreakdownRow({
  section: { period, scores },
  questionNumber,
  disabled,
}: {
  section: BreakdownAssessmentQuestionSpec["sections"][number];
  questionNumber: number;
  disabled?: boolean;
}) {
  const selectionKey = `q${questionNumber}Selection_${period.replace("-", "_")}`;
  const opportunityForm = useOpportunityFormContext();
  const selection = opportunityForm.formData[selectionKey];
  const onChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    const value = parseInt(event.target.value, 10);
    opportunityForm.updateDraftData(selectionKey, value);
  };

  return (
    <tr>
      <th scope="row">PREVIOUS {period} MONTHS</th>
      <BreakdownOption
        text="None"
        value={0}
        period={period}
        questionNumber={questionNumber}
        score={scores[0]}
        selection={selection}
        disabled={disabled}
        onChange={onChange}
      />
      <BreakdownOption
        text="One"
        value={1}
        period={period}
        questionNumber={questionNumber}
        score={scores[1]}
        selection={selection}
        disabled={disabled}
        onChange={onChange}
      />
      <BreakdownOption
        text="Two"
        value={2}
        period={period}
        questionNumber={questionNumber}
        score={scores[2]}
        selection={selection}
        disabled={disabled}
        onChange={onChange}
      />
      <BreakdownOption
        text="Three or more"
        value={3}
        period={period}
        questionNumber={questionNumber}
        score={scores[3]}
        selection={selection}
        disabled={disabled}
        onChange={onChange}
      />
    </tr>
  );
});

function BreakdownOption({
  text,
  value,
  period,
  questionNumber,
  selection,
  score,
  disabled,
  onChange,
}: {
  text: string;
  value: number;
  period: BreakdownAssessmentQuestionPeriod;
  questionNumber: number;
  selection: number;
  score: number;
  disabled?: boolean;
  onChange: ChangeEventHandler;
}) {
  const group = `BreakdownOption-${questionNumber}-${period}`;
  const id = `${group}-${text}`;
  return (
    <td>
      {disabled ? null : (
        <RadioButton
          value={value}
          checked={selection === value}
          onChange={onChange}
          id={id}
          radioGroup={group}
        />
      )}
      <label htmlFor={id}>
        {text}: {score}
      </label>
    </td>
  );
}
