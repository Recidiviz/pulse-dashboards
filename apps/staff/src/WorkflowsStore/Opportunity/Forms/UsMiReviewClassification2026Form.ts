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
  goodBeahviorNotesSchema,
  goodBehaviorPeriodNotes,
  incidentNotesSchema,
  miFemaleReviewClassificationQuestions,
  miMaleReviewClassificationQuestions,
  UsMiAssessmentSectionsSpec,
  UsMiFormReviewInformation,
  UsMiReviewClassification2026DraftData,
} from "~datatypes";

import { OpportunityFormComponentName } from "../../../core/WorkflowsLayouts";
import { Resident } from "../../Resident";
import { FormBase } from "./FormBase";
import { calculateRemaining } from "./UsMiInitialClassification2026Form";
import {
  classificationNote,
  countIncidents,
  getMultiplierScore,
  getQuestionAgeOptionSelection,
  getQuestionVfoOptionSelection as getInitialVfoOptionSelection,
  getSingleScore,
} from "./UsMiInitialClassification2026Form";

const ReviewKeySelections = [
  "s1q1Selection",
  "s1q2Selection",

  "s2q3Selection",
  "s2q4Selection",
  "s2q5Selection",
  "s2q6Selection",
  "s2q7Selection",
  "s2q8Selection",
  "s2q9Selection",
  "s2q10Selection",
  "s2q11Selection",
  "s2q12Selection",
  "s2q13Selection",

  "s3q14Selection",
  "s3q15Selection",
  "s3q16Selection",
  "s3q17Selection",
] as const;

// The female VFO question has no "High" option, so anything other than Low
// maps to "Neither" at index 1.
function getQuestionVfoOptionSelection(
  note: string | undefined,
  gender: string,
) {
  const selection = getInitialVfoOptionSelection(note);
  if (gender === "MALE") return selection;
  return selection === 0 ? 0 : 1;
}

function getHighProgramCompletion(count: number | null | undefined) {
  if (count === undefined || count === null) return 1;
  return count > 0 ? 0 : 1;
}

// With no recorded completions, the count is 0 rather than left for the user
// to fill in.
function getCoreProgramCompletion(
  notes: UsMiFormReviewInformation["programCompleteCoreNotes"],
) {
  return (
    notes?.coreProgramCompletionCount ??
    notes?.coreProgramCompletionsList?.length ??
    0
  );
}

function getTimeIntervals(
  note: incidentNotesSchema["incidentsList"] | undefined,
  period: string,
): incidentNotesSchema | undefined {
  if (!note) {
    return undefined;
  }
  const incidents = note.filter(
    (incident) => incident.incidentTimePeriod === period,
  );

  return incidents.length ? { incidentsList: incidents } : undefined;
}

function calculateGoodBehaviorPoints(
  incidentsList: incidentNotesSchema["incidentsList"],
  adSegStaysList: goodBeahviorNotesSchema["adSegStartsList"],
) {
  const incidents0_4 = incidentsList?.filter(
    (incident) => incident.incidentTimePeriod === "0-4 months",
  );

  const incidents4_8 = incidentsList?.filter(
    (incident) => incident.incidentTimePeriod === "4-8 months",
  );

  const incidents8_12 = incidentsList?.filter(
    (incident) => incident.incidentTimePeriod === "8-12 months",
  );

  const adSegs0_4 = adSegStaysList?.filter(
    (adSeg) => adSeg.incidentTimePeriod === "0-4 months",
  );

  const adSegs4_8 = adSegStaysList?.filter(
    (adSeg) => adSeg.incidentTimePeriod === "4-8 months",
  );
  const adSegs8_12 = adSegStaysList?.filter(
    (adSeg) => adSeg.incidentTimePeriod === "8-12 months",
  );

  let amt = 0;
  amt += !incidents0_4?.length && !adSegs0_4?.length ? 1 : 0;

  amt += !incidents4_8?.length && !adSegs4_8?.length ? 1 : 0;

  amt += !incidents8_12?.length && !adSegs8_12?.length ? 1 : 0;

  const periods: goodBehaviorPeriodNotes = [
    {
      timePeriod: "0-4 months",
      misconductCount: (incidents0_4?.length || 0) + (adSegs0_4?.length || 0),
    },
    {
      timePeriod: "4-8 months",
      misconductCount: (incidents4_8?.length || 0) + (adSegs4_8?.length || 0),
    },
    {
      timePeriod: "8-12 months",
      misconductCount: (incidents8_12?.length || 0) + (adSegs8_12?.length || 0),
    },
  ];

  return { periods, total: amt };
}

function inferredMiClassificationData(
  formInformation: UsMiFormReviewInformation,
  gender: string | undefined,
): Partial<UsMiReviewClassification2026DraftData> {
  if (gender === undefined) return {};
  const questionsList =
    gender === "MALE"
      ? miMaleReviewClassificationQuestions
      : miFemaleReviewClassificationQuestions;

  const s1q1Selection = getQuestionAgeOptionSelection(
    questionsList[0].questions[0],
    formInformation.ageNotes?.age,
  );

  const s1q2Selection = getQuestionVfoOptionSelection(
    formInformation.vfoNotes?.vfoLevel,
    gender,
  );

  const s2q3Selection =
    formInformation?.pastAdSegNotes?.numAdSegStartsInPast36Months;

  //  6 months
  const s2q4Notes = getTimeIntervals(
    formInformation.currentViolentIncNotes?.incidentsList,
    "0-6 months",
  );
  const s2q4Selection = countIncidents(s2q4Notes);

  // 6-12 months
  const s2q5Notes = getTimeIntervals(
    formInformation.currentViolentIncNotes?.incidentsList,
    "6-12 months",
  );

  const s2q5Selection = countIncidents(s2q5Notes);

  // 12 -24 months
  const s2q6Notes = getTimeIntervals(
    formInformation.currentViolentIncNotes?.incidentsList,
    "12-24 months",
  );
  const s2q6Selection = countIncidents(s2q6Notes);

  // 24 - 36 months
  const s2q7Notes = getTimeIntervals(
    formInformation.currentViolentIncNotes?.incidentsList,
    "24-36 months",
  );

  const s2q7Selection = countIncidents(s2q7Notes);

  // 0-36 months
  const s2q8Selection = countIncidents(formInformation.pastViolentIncNotes);

  // --- misconducts for fighting - etc etc

  //  0 - 6 months
  const s2q9Notes = getTimeIntervals(
    formInformation.currentFightThreatPowIncNotes?.incidentsList,
    "0-6 months",
  );
  const s2q9Selection = countIncidents(s2q9Notes);

  // 6-12 months
  const s2q10Notes = getTimeIntervals(
    formInformation.currentFightThreatPowIncNotes?.incidentsList,
    "6-12 months",
  );

  const s2q10Selection = countIncidents(s2q10Notes);

  const s2q11Notes = getTimeIntervals(
    formInformation.currentFightThreatPowIncNotes?.incidentsList,
    "12-36 months",
  );

  const s2q11Selection = countIncidents(s2q11Notes);

  //  0 - 36 months
  const s2q12Selection = countIncidents(
    formInformation.pastFightThreatPowIncNotes,
  );

  const goodBehavior = calculateGoodBehaviorPoints(
    formInformation.goodBehaviorNotes?.incidentsList || [],
    formInformation.goodBehaviorNotes?.adSegStartsList || [],
  );

  const s2q13Selection = countIncidents(formInformation.currentOtherIncNotes);

  const s3q14Selection = goodBehavior.total;

  const s3q15Selection = getCoreProgramCompletion(
    formInformation.programCompleteCoreNotes,
  );

  const s3q16Selection = getHighProgramCompletion(
    formInformation.programCompleteHighNotes?.highProgramCompletionCount,
  );

  // notes yay

  const s1q1Notes = formInformation.ageNotes;

  const s1q2Notes = formInformation.vfoNotes;

  const s2q3Notes = formInformation.pastAdSegNotes;
  const s2q8Notes = formInformation.pastViolentIncNotes;

  const s2q12Notes = formInformation.pastFightThreatPowIncNotes;

  const s2q13Notes = formInformation.currentOtherIncNotes;

  const s3q14Notes = goodBehavior.periods;

  const s3q15Notes =
    formInformation.programCompleteCoreNotes?.coreProgramCompletionsList;
  const s3q16Notes =
    formInformation.programCompleteHighNotes?.highProgramCompletionsList;

  return {
    s1q1Selection,
    s1q2Selection,

    // section 2
    s2q3Selection,
    s2q4Selection,
    s2q5Selection,
    s2q6Selection,
    s2q7Selection,
    s2q8Selection,
    s2q9Selection,
    s2q10Selection,
    s2q11Selection,
    s2q12Selection,
    s2q13Selection,

    // section 3
    s3q14Selection,
    s3q15Selection,
    s3q16Selection,

    s1q1Notes,
    s1q2Notes,
    s2q3Notes,
    s2q4Notes,
    s2q5Notes,
    s2q6Notes,
    s2q7Notes,
    s2q8Notes,
    s2q9Notes,
    s2q10Notes,
    s2q11Notes,
    s2q12Notes,
    s2q13Notes,
    s3q14Notes,
    s3q15Notes,
    s3q16Notes,
  };
}

export function deriveMiClassification(
  formData: Partial<UsMiReviewClassification2026DraftData>,
  gender: string | undefined,
) {
  const {
    s1q1Selection,
    s1q2Selection,

    // section 2
    s2q3Selection,
    s2q4Selection,
    s2q5Selection,
    s2q6Selection,
    s2q7Selection,
    s2q8Selection,
    s2q9Selection,
    s2q10Selection,
    s2q11Selection,
    s2q12Selection,
    s2q13Selection,

    // section 3
    s3q14Selection,
    s3q15Selection,
    s3q16Selection,
    s3q17Selection,
  } = formData;

  // section 1
  const questionsList =
    gender === "MALE"
      ? miMaleReviewClassificationQuestions
      : miFemaleReviewClassificationQuestions;

  const s1q1 = questionsList[0].questions[0];
  const s1q1Score = getSingleScore(s1q1, s1q1Selection);
  const s1q2 = questionsList[0].questions[1];
  const s1q2Score = getSingleScore(s1q2, s1q2Selection);

  let s1SubScore = (s1q1Score || 0) + (s1q2Score || 0);
  s1SubScore = Number(s1SubScore.toFixed(2));

  // section 2

  const s2q3 = questionsList[1].questions[0];
  const s2q3Score = getMultiplierScore(s2q3, s2q3Selection);
  const s2q4 = questionsList[1].questions[1];
  const s2q4Score = getMultiplierScore(s2q4, s2q4Selection);

  const s2q5 = questionsList[1].questions[2];

  const s2q5Score = getMultiplierScore(s2q5, s2q5Selection);
  const s2q6 = questionsList[1].questions[3];
  const s2q6Score = getMultiplierScore(s2q6, s2q6Selection);
  const s2q7 = questionsList[1].questions[4];
  const s2q7Score = getMultiplierScore(s2q7, s2q7Selection);

  const s2q8 = questionsList[1].questions[5];
  const s2q8Score = getMultiplierScore(s2q8, s2q8Selection);
  const s2q9 = questionsList[1].questions[6];
  const s2q9Score = getMultiplierScore(s2q9, s2q9Selection);

  const s2q10 = questionsList[1].questions[7];
  const s2q10Score = getMultiplierScore(s2q10, s2q10Selection);
  const s2q11 = questionsList[1].questions[8];
  const s2q11Score = getMultiplierScore(s2q11, s2q11Selection);

  const s2q12 = questionsList[1].questions[9];
  const s2q12Score = getMultiplierScore(s2q12, s2q12Selection);
  const s2q13 = questionsList[1].questions[10];
  const s2q13Score = getMultiplierScore(s2q13, s2q13Selection);

  let s2SubScore =
    (s2q3Score || 0) +
    (s2q4Score || 0) +
    (s2q5Score || 0) +
    (s2q6Score || 0) +
    (s2q7Score || 0) +
    (s2q8Score || 0) +
    (s2q9Score || 0) +
    (s2q10Score || 0) +
    (s2q11Score || 0) +
    (s2q12Score || 0) +
    (s2q13Score || 0);

  s2SubScore = Number(s2SubScore.toFixed(2));

  // section 3

  const s3q14 = questionsList[2].questions[0];
  const s3q14Score = getMultiplierScore(s3q14, s3q14Selection);
  const s3q15 = questionsList[2].questions[1];
  const s3q15Score = getMultiplierScore(s3q15, s3q15Selection);
  const s3q16 = questionsList[2].questions[2];
  const s3q16Score = getSingleScore(s3q16, s3q16Selection);
  const s3q17 = questionsList[2].questions[3];
  const s3q17Score = getMultiplierScore(s3q17, s3q17Selection);

  let s3SubScore =
    (s3q14Score || 0) +
    (s3q15Score || 0) +
    (s3q16Score || 0) +
    (s3q17Score || 0);

  s3SubScore = Number(s3SubScore.toFixed(2));

  const s1q1Notes = classificationNote("age", formData.ageNotes);

  const s1q2Notes = classificationNote("vfo", formData.vfoNotes);

  const s2q3Notes = classificationNote("adSeg", formData.pastAdSegNotes);

  const currentViolentIncidents =
    formData.currentViolentIncNotes?.incidentsList;
  const s2q4Notes = classificationNote(
    "incidents",
    getTimeIntervals(currentViolentIncidents, "0-6 months"),
  );
  const s2q5Notes = classificationNote(
    "incidents",
    getTimeIntervals(currentViolentIncidents, "6-12 months"),
  );
  const s2q6Notes = classificationNote(
    "incidents",
    getTimeIntervals(currentViolentIncidents, "12-24 months"),
  );
  const s2q7Notes = classificationNote(
    "incidents",
    getTimeIntervals(currentViolentIncidents, "24-36 months"),
  );

  const s2q8Notes = classificationNote(
    "incidents",
    formData.pastViolentIncNotes,
  );

  const currentFightIncidents =
    formData.currentFightThreatPowIncNotes?.incidentsList;
  const s2q9Notes = classificationNote(
    "incidents",
    getTimeIntervals(currentFightIncidents, "0-6 months"),
  );
  const s2q10Notes = classificationNote(
    "incidents",
    getTimeIntervals(currentFightIncidents, "6-12 months"),
  );
  const s2q11Notes = classificationNote(
    "incidents",
    getTimeIntervals(currentFightIncidents, "12-36 months"),
  );

  const s2q12Notes = classificationNote(
    "incidents",
    formData.pastFightThreatPowIncNotes,
  );
  const s2q13Notes = classificationNote(
    "incidents",
    formData.currentOtherIncNotes,
  );

  const goodBehavior = calculateGoodBehaviorPoints(
    formData.goodBehaviorNotes?.incidentsList || [],
    formData.goodBehaviorNotes?.adSegStartsList || [],
  );
  const s3q14Notes = classificationNote("goodBehavior", goodBehavior.periods);

  const s3q15Notes = classificationNote(
    "programs",
    formData.programCompleteCoreNotes?.coreProgramCompletionsList,
  );
  const s3q16Notes = classificationNote(
    "programs",
    formData.programCompleteHighNotes?.highProgramCompletionsList,
  );

  const totalScore = s1SubScore + s2SubScore + s3SubScore;

  return {
    // section 1
    s1q1Score,
    s1q2Score,
    // section 2
    s2q3Score,
    s2q4Score,
    s2q5Score,
    s2q6Score,
    s2q7Score,
    s2q8Score,
    s2q9Score,
    s2q10Score,
    s2q11Score,
    s2q12Score,
    s2q13Score,

    // section 3
    s3q14Score,
    s3q15Score,
    s3q16Score,
    s3q17Score,
    subscores: [s1SubScore, s2SubScore, s3SubScore],
    totalScore,
    s1q1Notes,
    s1q2Notes,
    s2q3Notes,
    s2q4Notes,
    s2q5Notes,
    s2q6Notes,
    s2q7Notes,
    s2q8Notes,
    s2q9Notes,
    s2q10Notes,
    s2q11Notes,
    s2q12Notes,
    s2q13Notes,
    s3q14Notes,
    s3q15Notes,
    s3q16Notes,
  };
}

export class UsMiReviewClassificationForm extends FormBase<UsMiReviewClassification2026DraftData> {
  get navigateToFormText(): string {
    return this.opportunity.isSubmitted
      ? "Review classification"
      : "Auto-fill classification";
  }

  get formContents(): OpportunityFormComponentName {
    return "FormUsMiClassification";
  }

  get formTitle() {
    return "Review Classification";
  }

  get remainingFields() {
    return calculateRemaining(this.formData, ReviewKeySelections);
  }

  prefilledDataTransformer() {
    const {
      opportunity: {
        record: { formInformation },
      },
      person,
    } = this;

    const inferredData = inferredMiClassificationData(
      formInformation,
      (person as Resident).gender,
    );

    return {
      ...formInformation,
      ...inferredData,
    };
  }

  get questionList(): UsMiAssessmentSectionsSpec[] | undefined {
    const person = this.person as Resident;
    if (person.stateCode === "US_MI") {
      const questionList =
        person.gender === "MALE"
          ? miMaleReviewClassificationQuestions
          : miFemaleReviewClassificationQuestions;
      return questionList;
    }
  }

  get displayCustodyLevel() {
    const person = this.person as Resident;
    if (person.stateCode === "US_MI") {
      const level = person.displayCustodyLevel.split("Security");
      if (level[0].trim() === "Unknown") return "Unknown";
      return level[1].trim();
    }
  }

  get derivedData() {
    const { person } = this;
    return deriveMiClassification(this.formData, (person as Resident).gender);
  }
}
