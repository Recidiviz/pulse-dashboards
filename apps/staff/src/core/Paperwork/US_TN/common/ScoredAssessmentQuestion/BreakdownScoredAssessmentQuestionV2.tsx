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

import { spacing } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import styled from "styled-components";

import {
  BreakdownAssessmentQuestionSpecV2,
  UsTnReclassification2026DraftData,
} from "~datatypes";

import DOCXFormInput from "../../../DOCXFormInput";
import { SubItem } from "./AssessmentItem";

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

const MultiplierCell = styled.div`
  padding-left: ${rem(spacing.xs)};
  display: flex;
  gap: ${rem(spacing.xs)};
`;

export function BreakdownScoredAssessmentQuestionV2({
  questionNumber,
  questionSpec,
  disabled,
}: {
  questionSpec: BreakdownAssessmentQuestionSpecV2;
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
  section: { period, multiplier },
  questionNumber,
  disabled,
}: {
  section: BreakdownAssessmentQuestionSpecV2["sections"][number];
  questionNumber: number;
  disabled?: boolean;
}) {
  const selectionKey = `q${questionNumber}Selection_${period.replace("-", "_")}`;

  return (
    <tr>
      <th scope="row">PREVIOUS {period} MONTHS</th>
      <td>
        <MultiplierCell>
          <DOCXFormInput<UsTnReclassification2026DraftData>
            name={selectionKey as keyof UsTnReclassification2026DraftData}
            type="number"
            min={0}
            style={{ minWidth: rem(spacing.lg) }}
            onKeyDown={(event) => {
              if (event.key === "-") event.preventDefault();
            }}
            inputUpdateDelayMs={500}
          />
          {`  x ${multiplier} points`}
          {period === "0-6" && ` (-1 point if None)`}
        </MultiplierCell>
      </td>
    </tr>
  );
});
