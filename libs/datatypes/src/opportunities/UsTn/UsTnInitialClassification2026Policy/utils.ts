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
} from "../reclassificationScoreUtils";
import { dcafAssessmentQuestions } from "./dcafAssessmentQuestions";
import {
  UsTnInitialClassification2026DraftData,
  UsTnInitialClassification2026FormInformation,
} from "./schema";

export function getDerivedDcafCustodyLevel(totalScore: number): string {
  switch (true) {
    case totalScore <= 11:
      return "LOW";
    case totalScore <= 24:
      return "MEDIUM";
    case totalScore <= 44:
      return "CLOSE";
    default:
      return "MAXIMUM";
  }
}

export function prefillDcafFormData(
  formInformation: UsTnInitialClassification2026FormInformation,
): Partial<UsTnInitialClassification2026DraftData> {
  const q1Selection = getSingleSectionQuestionIndex(
    dcafAssessmentQuestions[0],
    formInformation.q1Score,
  );

  const q2Selection = getSingleSectionQuestionIndex(
    dcafAssessmentQuestions[1],
    formInformation.q2Score,
  );

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

  const q1aNotes = formInformation.q1Notes.listPriorNonTdocConvictions60Months;

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

  const totalScore = Math.min(
    41,
    q1Score + q2Score + q3Score + q4Score + q5Score + q6Score,
  );

  const trusteeEligible = [
    formData.trusteeHas10YearsOrLessRemaining,
    formData.trusteeNoAssaultiveDisciplinaryWithSeriousInjuryLast5Years,
    formData.trusteeNoEscapeFromLowTrusteePast5Years,
    formData.trusteeNoEscapeFromMediumCloseMaxPast10Years,
    formData.trusteeNoViolentFelonyConvictionPast5YearsIncarceration,
    formData.trusteeNotConvictedOfFirstDegreeMurder,
    formData.trusteeNotConvictedOfViolentOffenseOr12MonthsInCustody,
    formData.trusteeNotScoredHighForViolence,
    formData.trusteeNotServingForSexualOffense,
    formData.trusteeNoFelonyDetainers,
    formData.trusteeNoPendingFelonyCharges,
    formData.trusteeNoPendingImmigrationActions,
    formData.trusteeWardenHasApproved,
  ].every((criterion) => criterion === "true");

  const totalText = getDerivedDcafCustodyLevel(totalScore);

  return {
    q1Score,
    q2Score,
    q3Score,
    q4Score,
    q5Score,
    q6Score,
    totalScore,
    trusteeEligible,
    totalText,
  };
}
