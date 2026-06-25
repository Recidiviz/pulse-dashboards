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
  getBreakdownSectionScoreV2,
  UsTnReclassification2026DraftData,
} from "~datatypes";
import { palette } from "~design-system";

import DOCXFormInput from "../../../DOCXFormInput";
import { useOpportunityFormContext } from "../../../OpportunityFormContext";
import { dateWindowString } from "../Classification2026/utils";
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

const DateRange = styled.span`
  color: ${palette.slate85};
  font-size: 6pt;
`;

const MultiplierCell = styled.div`
  padding-left: ${rem(spacing.xs)};
  display: flex;
  align-items: baseline;
  gap: ${rem(spacing.xs)};
`;

const scoreColor = (score: number): string => {
  if (score < 0) return palette.signal.error;
  if (score > 0) return palette.signal.links;
  return "inherit";
};

const RowScore = styled.span<{ $score: number }>`
  margin-left: ${rem(spacing.md)};
  font-variant-numeric: tabular-nums;
  color: ${({ $score }) => scoreColor($score)};
`;

const formatSignedScore = (score: number): string =>
  score > 0 ? `+${score}` : `${score}`;

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
  section,
  questionNumber,
  disabled,
}: {
  section: BreakdownAssessmentQuestionSpecV2["sections"][number];
  questionNumber: number;
  disabled?: boolean;
}) {
  const { period, multiplier } = section;
  const selectionKey =
    `q${questionNumber}Selection_${period.replace("-", "_")}` as keyof UsTnReclassification2026DraftData;

  const { formData } = useOpportunityFormContext();
  const count = formData[selectionKey] as number | undefined;
  const rowScore = getBreakdownSectionScoreV2(section, count);

  return (
    <tr>
      <th scope="row">
        PREVIOUS {period} MONTHS{" "}
        <DateRange>{dateWindowString(period, formData)}</DateRange>
      </th>
      <td>
        <MultiplierCell>
          <DOCXFormInput<UsTnReclassification2026DraftData>
            name={selectionKey}
            type="number"
            min={0}
            style={{ minWidth: rem(spacing.lg) }}
            onKeyDown={(event) => {
              if (event.key === "-") event.preventDefault();
            }}
            inputUpdateDelayMs={500}
          />
          {`× ${multiplier} pt`}
          {period === "0-6" && ` (−1 if None)`}
          <RowScore $score={rowScore}>= {formatSignedScore(rowScore)}</RowScore>
        </MultiplierCell>
      </td>
    </tr>
  );
});
