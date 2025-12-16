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

import { UsTnInitialClassification2026DraftData } from "~datatypes";

import { AssessmentQuestionSpec } from "../../../core/Paperwork/US_TN/common/ScoredAssessmentQuestion";
import { assessmentQuestions } from "../../../core/Paperwork/US_TN/UsTnInitialClassification2026/assessmentQuestions";
import { OpportunityFormComponentName } from "../../../core/WorkflowsLayouts";
import { UsTnInitialClassification2026Opportunity } from "../UsTn";
import { FormBase } from "./FormBase";

function getQuestionIndex(
  question: AssessmentQuestionSpec,
  score: number | null,
): number {
  if (!score) return -1;

  return question.options.findIndex((option) => option.score === score) ?? -1;
}

function getQuestionScore(
  question: AssessmentQuestionSpec,
  selection: number | undefined,
): number {
  if (selection === undefined || selection === -1) return 0;

  return question.options[selection]?.score ?? 0;
}

export class UsTnInitialClassification2026Form extends FormBase<
  UsTnInitialClassification2026DraftData,
  UsTnInitialClassification2026Opportunity
> {
  navigateToFormText = "Auto-fill paperwork";

  get formContents(): OpportunityFormComponentName {
    return "FormUsTnInitialClassification2026";
  }

  prefilledDataTransformer() {
    const {
      opportunity: {
        record: { formInformation },
      },
    } = this;

    const q1Selection = getQuestionIndex(
      assessmentQuestions[0],
      formInformation.q1Score,
    );

    const q2Selection = getQuestionIndex(
      assessmentQuestions[1],
      formInformation.q2Score,
    );

    const q3Selection = getQuestionIndex(
      assessmentQuestions[2],
      formInformation.q3Score,
    );

    const q4Selection = getQuestionIndex(
      assessmentQuestions[3],
      formInformation.q4Score,
    );

    const q5Selection = getQuestionIndex(
      assessmentQuestions[4],
      formInformation.q5Score,
    );

    const q6Selection = getQuestionIndex(
      assessmentQuestions[5],
      formInformation.q6Score,
    );

    const q1aNotes =
      formInformation.q1Notes.listPriorNonTdocConvictions60Months;

    const q1bNotes =
      formInformation.q1Notes.listPriorViolentTdocConvictions60Months;

    return {
      q1Selection,
      q2Selection,
      q3Selection,
      q4Selection,
      q5Selection,
      q6Selection,
      q1aNotes,
      q1bNotes,
      ...formInformation,
    };
  }

  get derivedData() {
    const {
      q1Selection,
      q2Selection,
      q3Selection,
      q4Selection,
      q5Selection,
      q6Selection,
    } = this.formData;

    const q1Score = getQuestionScore(assessmentQuestions[0], q1Selection);
    const q2Score = getQuestionScore(assessmentQuestions[1], q2Selection);
    const q3Score = getQuestionScore(assessmentQuestions[2], q3Selection);
    const q4Score = getQuestionScore(assessmentQuestions[3], q4Selection);
    const q5Score = getQuestionScore(assessmentQuestions[4], q5Selection);
    const q6Score = getQuestionScore(assessmentQuestions[5], q6Selection);

    return {
      totalScore: q1Score + q2Score + q3Score + q4Score + q5Score + q6Score,
    };
  }
}
