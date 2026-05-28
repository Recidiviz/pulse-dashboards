// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

import {
  getSingleSectionQuestionIndex,
  getSingleSectionQuestionScore,
  getTotalScore,
  isEligibleForTrusteeStatus,
} from "../reclassificationScoreUtils";
import { dcafAssessmentQuestions } from "./dcafAssessmentQuestions";
import {
  UsTnInitialClassification2026DraftData,
  UsTnInitialClassification2026FormInformation,
} from "./schema";

export const DCAF_LOW_UPPER_THRESHOLD = 11;
export const DCAF_MEDIUM_UPPER_THRESHOLD = 24;
const DCAF_MAXIMUM_UPPER_THRESHOLD = 44;

export function getDerivedDcafCustodyLevel(
  totalScore: number | undefined,
): string {
  if (totalScore === undefined) return "";

  switch (true) {
    case totalScore <= DCAF_LOW_UPPER_THRESHOLD:
      return "LOW";
    case totalScore <= DCAF_MEDIUM_UPPER_THRESHOLD:
      return "MEDIUM";
    case totalScore <= DCAF_MAXIMUM_UPPER_THRESHOLD:
      return "CLOSE";
    default:
      return "MAXIMUM";
  }
}

export function prefillDcafFormData(
  formInformation: UsTnInitialClassification2026FormInformation,
): Partial<UsTnInitialClassification2026DraftData> {
  const q3Selection = getSingleSectionQuestionIndex(
    dcafAssessmentQuestions[2],
    formInformation.q3Score,
  );

  const q4Selection = getSingleSectionQuestionIndex(
    dcafAssessmentQuestions[3],
    formInformation.q4Score,
  );

  const q5Selection = getSingleSectionQuestionIndex(
    dcafAssessmentQuestions[4],
    formInformation.q5Score,
  );

  const q6Selection = getSingleSectionQuestionIndex(
    dcafAssessmentQuestions[5],
    formInformation.q6Score,
  );

  const q7Selection = getSingleSectionQuestionIndex(
    dcafAssessmentQuestions[6],
    formInformation.q7Score,
  );

  const q1aNotes = formInformation.q1Notes.listPriorNonTdocConvictions60Months;

  const q1bNotes =
    formInformation.q1Notes.listPriorViolentTdocConvictions60Months;

  return {
    q3Selection,
    q4Selection,
    q5Selection,
    q6Selection,
    q7Selection,
    q1aNotes,
    q1bNotes,
  };
}

export function deriveDcafFormData(
  formData: Partial<UsTnInitialClassification2026DraftData>,
) {
  const {
    q1Selection,
    q2Selection,
    q3Selection,
    q4Selection,
    q5Selection,
    q6Selection,
    q7Selection,
  } = formData;

  const q1Score = getSingleSectionQuestionScore(
    dcafAssessmentQuestions[0],
    q1Selection,
  );
  const q2Score = getSingleSectionQuestionScore(
    dcafAssessmentQuestions[1],
    q2Selection,
  );
  const q3Score = getSingleSectionQuestionScore(
    dcafAssessmentQuestions[2],
    q3Selection,
  );
  const q4Score = getSingleSectionQuestionScore(
    dcafAssessmentQuestions[3],
    q4Selection,
  );
  const q5Score = getSingleSectionQuestionScore(
    dcafAssessmentQuestions[4],
    q5Selection,
  );
  const q6Score = getSingleSectionQuestionScore(
    dcafAssessmentQuestions[5],
    q6Selection,
  );
  const q7Score = getSingleSectionQuestionScore(
    dcafAssessmentQuestions[6],
    q7Selection,
  );

  const totalScore = getTotalScore(
    [q1Score, q2Score, q3Score, q4Score, q5Score, q6Score, q7Score],
    DCAF_MAXIMUM_UPPER_THRESHOLD,
  );

  const trusteeEligible = isEligibleForTrusteeStatus(formData);

  const totalText = getDerivedDcafCustodyLevel(totalScore);

  return {
    q1Score,
    q2Score,
    q3Score,
    q4Score,
    q5Score,
    q6Score,
    q7Score,
    totalScore,
    trusteeEligible,
    totalText,
  };
}
