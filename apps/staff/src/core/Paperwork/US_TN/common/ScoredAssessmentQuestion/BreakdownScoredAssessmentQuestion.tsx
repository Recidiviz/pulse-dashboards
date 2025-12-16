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

import { SubItem } from "./AssessmentItem";
import { BreakdownAssessmentQuestionSpec } from "./types";

const BreakdownTable = styled.table`
  width: 100%;

  border-collapse: collapse;
  & th,
  td {
    border: black solid 1px;
  }
`;

export const BreakdownScoredAssessmentQuestion = observer(
  function BreakdownScoredAssessmentQuestion({
    questionNumber,
    questionSpec,
    disabled,
    setScore,
  }: {
    questionSpec: BreakdownAssessmentQuestionSpec;
    questionNumber: number;
    disabled?: boolean;
    setScore: (score: number) => void;
  }) {
    return (
      <SubItem>
        <BreakdownTable>
          <tbody>
            {questionSpec.sections.map(({ period, scores }) => {
              return (
                <tr>
                  <th scope="row">PREVIOUS {period} MONTHS</th>
                  <td>None: {scores[0]}</td>
                  <td>One: {scores[1]}</td>
                  <td>Two: {scores[2]}</td>
                  <td>Three or more: {scores[3]}</td>
                </tr>
              );
            })}
          </tbody>
        </BreakdownTable>
      </SubItem>
    );
  },
);
