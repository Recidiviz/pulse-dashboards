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

import { format } from "date-fns";

import {
  getBreakdownSectionQuestionIndex,
  getBreakdownSectionScore,
  getSingleSectionQuestionIndex,
  getSingleSectionQuestionScore,
  isEligibleForTrusteeStatus,
} from "../reclassificationScoreUtils";
import { formatMultiplePeriodReports } from "../utils";
import { rcafAssessmentQuestions } from "./rcafAssessmentQuestions";
import {
  UsTnReclassification2026DraftData,
  UsTnReclassification2026FormInformation,
} from "./schema";

const LOW_UPPER_THRESHOLD = 11;
const MEDIUM_UPPER_THRESHOLD = 25;
const MAXIMUM_UPPER_THRESHOLD = 44;

export function getDerivedRcafCustodyLevel(totalScore: number): string {
  switch (true) {
    case totalScore <= LOW_UPPER_THRESHOLD:
      return "LOW";
    case totalScore <= MEDIUM_UPPER_THRESHOLD:
      return "MEDIUM";
    case totalScore <= MAXIMUM_UPPER_THRESHOLD:
      return "CLOSE";
    default:
      return "MAXIMUM";
  }
}

export function prefillRcafFormData(
  formInformation: UsTnReclassification2026FormInformation,
): Partial<UsTnReclassification2026DraftData> {
  const q1Selection = getSingleSectionQuestionIndex(
    rcafAssessmentQuestions[0],
    formInformation.q1Score,
  );

  const q2Selection = getSingleSectionQuestionIndex(
    rcafAssessmentQuestions[1],
    formInformation.q2Score,
  );

  const q3Selection_0_6 = getBreakdownSectionQuestionIndex(
    rcafAssessmentQuestions[2].sections[0],
    formInformation.q3Notes,
  );

  const q3Selection_6_12 = getBreakdownSectionQuestionIndex(
    rcafAssessmentQuestions[2].sections[1],
    formInformation.q3Notes,
  );

  const q4Selection_0_6 = getBreakdownSectionQuestionIndex(
    rcafAssessmentQuestions[3].sections[0],
    formInformation.q4Notes,
  );

  const q4Selection_6_12 = getBreakdownSectionQuestionIndex(
    rcafAssessmentQuestions[3].sections[1],
    formInformation.q4Notes,
  );

  const q5Selection_0_6 = getBreakdownSectionQuestionIndex(
    rcafAssessmentQuestions[4].sections[0],
    formInformation.q5Notes,
  );

  const q5Selection_6_12 = getBreakdownSectionQuestionIndex(
    rcafAssessmentQuestions[4].sections[1],
    formInformation.q5Notes,
  );

  const q5Selection_12_18 = getBreakdownSectionQuestionIndex(
    rcafAssessmentQuestions[4].sections[2],
    formInformation.q5Notes,
  );

  const q5Selection_18_36 = getBreakdownSectionQuestionIndex(
    rcafAssessmentQuestions[4].sections[3],
    formInformation.q5Notes,
  );

  const q5Selection_36_60 = getBreakdownSectionQuestionIndex(
    rcafAssessmentQuestions[4].sections[4],
    formInformation.q5Notes,
  );

  let q6Selection = getSingleSectionQuestionIndex(
    rcafAssessmentQuestions[5],
    formInformation.q6Score,
  );

  // There are two options with a score of 0
  // Check the person's age to determine which they are
  if (q6Selection === 3 && (formInformation.q6Notes?.age ?? 0) > 30) {
    q6Selection++;
  }

  const q7Selection = getSingleSectionQuestionIndex(
    rcafAssessmentQuestions[6],
    formInformation.q7Score,
  );

  const q1aNotes =
    formInformation.q1Notes.listPriorViolentTdocConvictions60Months;

  const q1bNotes = formInformation.q1Notes.listPriorNonTdocConvictions60Months;

  const q2Notes = formInformation.q2CurrentOffenseDate
    ? formInformation.q2Notes
        .split(",")
        .map(
          (o) =>
            // @ts-expect-error We check that it's not undefined 4 lines above this
            `${o} on ${format(formInformation.q2CurrentOffenseDate, "MMM d, yyyy")}`,
        )
        .join(",")
    : formInformation.q2Notes;

  const q3NotesFormatted = formatMultiplePeriodReports(formInformation.q3Notes);

  const q4NotesFormatted = formatMultiplePeriodReports(formInformation.q4Notes);

  const q5NotesFormatted = formatMultiplePeriodReports(formInformation.q5Notes);

  return {
    q1Selection,
    q2Selection,
    q3Selection_0_6,
    q3Selection_6_12,
    q4Selection_0_6,
    q4Selection_6_12,
    q5Selection_0_6,
    q5Selection_6_12,
    q5Selection_12_18,
    q5Selection_18_36,
    q5Selection_36_60,
    q6Selection,
    q7Selection,
    q1aNotes,
    q1bNotes,
    q2Notes,
    q3NotesFormatted,
    q4NotesFormatted,
    q5NotesFormatted,
  };
}

export function deriveRcafFormData(
  formData: Partial<UsTnReclassification2026DraftData>,
) {
  const {
    q1Selection,
    q2Selection,
    q3Selection_0_6,
    q3Selection_6_12,
    q4Selection_0_6,
    q4Selection_6_12,
    q5Selection_0_6,
    q5Selection_6_12,
    q5Selection_12_18,
    q5Selection_18_36,
    q5Selection_36_60,
    q6Selection,
    q7Selection,
  } = formData;

  const q1Score = getSingleSectionQuestionScore(
    rcafAssessmentQuestions[0],
    q1Selection,
  );
  const q2Score = getSingleSectionQuestionScore(
    rcafAssessmentQuestions[1],
    q2Selection,
  );

  let q3Score = getBreakdownSectionScore(
    rcafAssessmentQuestions[2].sections[0],
    q3Selection_0_6,
  );
  q3Score += getBreakdownSectionScore(
    rcafAssessmentQuestions[2].sections[1],
    q3Selection_6_12,
  );

  let q4Score = getBreakdownSectionScore(
    rcafAssessmentQuestions[3].sections[0],
    q4Selection_0_6,
  );
  q4Score += getBreakdownSectionScore(
    rcafAssessmentQuestions[3].sections[1],
    q4Selection_6_12,
  );

  let q5Score = getBreakdownSectionScore(
    rcafAssessmentQuestions[4].sections[0],
    q5Selection_0_6,
  );
  q5Score += getBreakdownSectionScore(
    rcafAssessmentQuestions[4].sections[1],
    q5Selection_6_12,
  );
  q5Score += getBreakdownSectionScore(
    rcafAssessmentQuestions[4].sections[2],
    q5Selection_12_18,
  );
  q5Score += getBreakdownSectionScore(
    rcafAssessmentQuestions[4].sections[3],
    q5Selection_18_36,
  );
  q5Score += getBreakdownSectionScore(
    rcafAssessmentQuestions[4].sections[4],
    q5Selection_36_60,
  );

  const q6Score = getSingleSectionQuestionScore(
    rcafAssessmentQuestions[5],
    q6Selection,
  );
  const q7Score = getSingleSectionQuestionScore(
    rcafAssessmentQuestions[6],
    q7Selection,
  );

  const totalScore = Math.min(
    MAXIMUM_UPPER_THRESHOLD + 1,
    q1Score + q2Score + q3Score + q4Score + q5Score + q6Score + q7Score,
  );

  const trusteeEligible = isEligibleForTrusteeStatus(formData);

  const totalText = getDerivedRcafCustodyLevel(totalScore);

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
