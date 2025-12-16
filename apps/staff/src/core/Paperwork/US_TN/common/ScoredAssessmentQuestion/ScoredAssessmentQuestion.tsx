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

import { useOpportunityFormContext } from "../../../OpportunityFormContext";
import { AssessmentItem, SubItem } from "./AssessmentItem";
import { BreakdownScoredAssessmentQuestion } from "./BreakdownScoredAssessmentQuestion";
import { SingleScoredAssessmentQuestion } from "./SingleScoredAssessmentQuestion";
import { AssessmentQuestionProps } from "./types";

export function ScoredAssessmentQuestion(props: AssessmentQuestionProps) {
  const { questionNumber, questionSpec, supportingText, disabled, children } =
    props;

  // @ts-expect-error The opportunities using these components have the derivedData field
  const derivedData = useOpportunityFormContext().derivedData;

  const score = derivedData?.[`q${questionNumber}Score`] ?? 0;

  return (
    <AssessmentItem
      title={`${questionNumber}. ${questionSpec.title}`}
      score={disabled ? undefined : score}
      scoreText="SCORE"
      supportingText={supportingText}
    >
      {questionSpec.type === "SINGLE" ? (
        <SingleScoredAssessmentQuestion
          questionSpec={questionSpec}
          questionNumber={questionNumber}
          disabled={disabled}
        />
      ) : (
        <BreakdownScoredAssessmentQuestion
          questionSpec={questionSpec}
          questionNumber={questionNumber}
          disabled={disabled}
        />
      )}
      <SubItem>{disabled || !children ? <br /> : children}</SubItem>
    </AssessmentItem>
  );
}
