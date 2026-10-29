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
  ClassificationNoteData,
  getSingleSectionQuestionScore,
  incidentNotesSchema,
  miFemaleInitialClassificationQuestions,
  miMaleInitialClassificationQuestions,
  prevLevelFiveNotes,
  UsMiAssessmentQuestionSpec,
  UsMiAssessmentSectionsSpec,
  UsMiFormInitialInformation,
  UsMiInitialClassification2026DraftData,
} from "~datatypes";

import { OpportunityFormComponentName } from "../../../core/WorkflowsLayouts";
import { Resident } from "../../Resident";
import { FormBase } from "./FormBase";

export function getQuestionAgeOptionSelection(
  question: UsMiAssessmentQuestionSpec,
  note: number | undefined,
) {
  if (note === undefined || question.type !== "SINGLE") return;
  const re = / |-/;

  for (const [index, value] of question.options.entries()) {
    const lowerBounds = Number(value.text.split(re)[0]);
    if (note < lowerBounds) {
      if (index === 0) return 0;
      else return index - 1;
    }

    if (note === lowerBounds) return index;
  }

  return question.options.length - 1;
}

function getVfoOptionText(vfoLevelDetail: string | null | undefined) {
  switch (vfoLevelDetail?.toUpperCase()) {
    case "LOW":
      return "Low";
    case "MEDIUM":
      return "Medium";
    case "HIGH":
      return "High";
    default:
      return "None";
  }
}

export const MAX_TOTAL_SCORE = 60;

// The female VFO question has no "High" option, so a high score falls back to
// "None", which carries the same score as "Medium".
export function getQuestionVfoOptionSelection(
  question: UsMiAssessmentQuestionSpec,
  vfoLevelDetail: string | null | undefined,
) {
  if (question.type !== "SINGLE") return;
  const optionTexts = question.options.map((option) => option.text);
  const index = optionTexts.indexOf(getVfoOptionText(vfoLevelDetail));
  return index === -1 ? optionTexts.indexOf("None") : index;
}

export function getReleasedFromLevelFive(note: prevLevelFiveNotes | null) {
  // if the note is null or undefined or the hadPrevTrueLevel5Release is set to 0
  // then we want this question to be marked as 'No'
  if (!note || note === null || note.hadPrevTrueLevel5Release === 0) return 1;
  return 0;
}

export function countIncidents(
  note: incidentNotesSchema | null | undefined,
): number | undefined {
  return note?.incidentsList?.length ?? 0;
}

export function inferredMiClassificationData(
  formInformation: UsMiFormInitialInformation,
  gender: string | undefined,
): Partial<UsMiInitialClassification2026DraftData> {
  if (gender === undefined) return {};
  const questionsList =
    gender === "MALE"
      ? miMaleInitialClassificationQuestions
      : miFemaleInitialClassificationQuestions;

  const s1q1Selection = getQuestionAgeOptionSelection(
    questionsList[0].questions[0],
    formInformation.ageNotes?.age,
  );

  const s1q2Selection = getQuestionVfoOptionSelection(
    questionsList[0].questions[1],
    formInformation.vfoNotes?.vfoLevelDetail,
  );

  const s2q3Selection = getReleasedFromLevelFive(
    formInformation?.prevLevelFiveNotes,
  );

  const s3q5Selection =
    formInformation?.pastAdSegNotes?.numAdSegStartsInPast36Months;

  const s3q7Selection = countIncidents(formInformation.currentViolentIncNotes);

  const s3q8Selection = countIncidents(formInformation.pastViolentIncNotes);

  const s3q9Selection = countIncidents(
    formInformation.currentFightThreatPowIncNotes,
  );

  const s3q10Selection = countIncidents(
    formInformation.pastFightThreatPowIncNotes,
  );

  const s3q11Selection = countIncidents(formInformation.currentOtherIncNotes);

  const s1q1Notes = formInformation.ageNotes;

  const s1q2Notes = formInformation.vfoNotes;

  const s2q3Notes = formInformation.prevLevelFiveNotes;

  const s2q4Notes = formInformation.felonyConvictionsNotes;

  const s3q5Notes = formInformation.pastAdSegNotes;

  const s3q7Notes = formInformation.currentViolentIncNotes;
  const s3q8Notes = formInformation.pastViolentIncNotes;
  const s3q9Notes = formInformation.currentFightThreatPowIncNotes;
  const s3q10Notes = formInformation.pastFightThreatPowIncNotes;
  const s3q11Notes = formInformation.currentOtherIncNotes;

  return {
    s1q1Selection,
    s1q2Selection,
    s2q3Selection,
    s3q5Selection,
    s3q7Selection,
    s3q8Selection,
    s3q9Selection,
    s3q10Selection,
    s3q11Selection,
    s1q1Notes,
    s1q2Notes,
    s2q3Notes,
    s2q4Notes,
    s3q5Notes,
    s3q7Notes,
    s3q8Notes,
    s3q9Notes,
    s3q10Notes,
    s3q11Notes,
  };
}

export function classificationNote<K extends keyof ClassificationNoteData>(
  kind: K,
  data: ClassificationNoteData[K] | null | undefined,
): { kind: K; data: ClassificationNoteData[K] } | null {
  return data ? { kind, data } : null;
}

// A bounds of 0 means the question has no maximum.
export function capToBounds(
  question: Extract<UsMiAssessmentQuestionSpec, { type: "NUMBER" }>,
  amount: number,
): number {
  return question.bounds > 0 ? Math.min(amount, question.bounds) : amount;
}

export function getMultiplierScore(
  question: UsMiAssessmentQuestionSpec,
  amount: number | undefined,
): number | undefined {
  if (amount === undefined || question.type !== "NUMBER") return undefined;

  if (typeof amount !== "number") return undefined;
  return Number(
    (question.multiplier * capToBounds(question, amount)).toFixed(2),
  );
}

export function getSingleScore(
  question: UsMiAssessmentQuestionSpec,
  selection: number | undefined,
): number | undefined {
  if (question.type !== "SINGLE" || selection === undefined) return undefined;

  return getSingleSectionQuestionScore(question, selection);
}

const InitialKeySelections = [
  "s1q1Selection",
  "s1q2Selection",
  "s2q3Selection",
  "s2q4Selection",
  "s3q5Selection",
  "s3q6Selection",
  "s3q7Selection",
  "s3q8Selection",
  "s3q9Selection",
  "s3q10Selection",
  "s3q11Selection",
] as const;

export function calculateRemaining(
  formData: Partial<UsMiInitialClassification2026DraftData>,
  keySelections: readonly string[],
) {
  let count = 0;

  keySelections.forEach((key) => {
    if (typeof formData[key] !== "number") count += 1;
  });
  return count;
}

export function deriveMiClassification(
  formData: Partial<UsMiInitialClassification2026DraftData>,
  gender: string | undefined,
) {
  const {
    s1q1Selection,
    s1q2Selection,

    s2q3Selection,
    s2q4Selection,

    s3q5Selection,
    s3q6Selection,

    s3q7Selection,
    s3q8Selection,
    s3q9Selection,
    s3q10Selection,
    s3q11Selection,
  } = formData;

  // section 1
  const questionsList =
    gender === "MALE"
      ? miMaleInitialClassificationQuestions
      : miFemaleInitialClassificationQuestions;

  const s1q1 = questionsList[0].questions[0];
  const s1q1Score = getSingleScore(s1q1, s1q1Selection);
  const s1q2 = questionsList[0].questions[1];
  const s1q2Score = getSingleScore(s1q2, s1q2Selection);

  let s1SubScore = (s1q1Score || 0) + (s1q2Score || 0);
  s1SubScore = Number(s1SubScore.toFixed(2));

  // section 2

  const s2q3 = questionsList[1].questions[0];
  const s2q3Score = getSingleScore(s2q3, s2q3Selection);
  const s2q4 = questionsList[1].questions[1];
  const s2q4Score = getSingleScore(s2q4, s2q4Selection);

  let s2SubScore = (s2q3Score || 0) + (s2q4Score || 0);
  s2SubScore = Number(s2SubScore.toFixed(2));

  // section 3

  const s3q5 = questionsList[2].questions[0];
  const s3q5Score = getMultiplierScore(s3q5, s3q5Selection);

  const s3q6 = questionsList[2].questions[1];
  const s3q6Score = getSingleScore(s3q6, s3q6Selection);

  const s3q7 = questionsList[2].questions[2];
  const s3q7Score = getMultiplierScore(s3q7, s3q7Selection);

  const s3q8 = questionsList[2].questions[3];
  const s3q8Score = getMultiplierScore(s3q8, s3q8Selection);

  const s3q9 = questionsList[2].questions[4];
  const s3q9Score = getMultiplierScore(s3q9, s3q9Selection);

  const s3q10 = questionsList[2].questions[5];
  const s3q10Score = getMultiplierScore(s3q10, s3q10Selection);

  const s3q11 = questionsList[2].questions[6];
  const s3q11Score = getMultiplierScore(s3q11, s3q11Selection);

  let s3SubScore =
    (s3q5Score || 0) +
    (s3q6Score || 0) +
    (s3q7Score || 0) +
    (s3q8Score || 0) +
    (s3q9Score || 0) +
    (s3q10Score || 0) +
    (s3q11Score || 0);

  s3SubScore = Number(s3SubScore.toFixed(2));

  const s1q1Notes = classificationNote("age", formData.ageNotes);

  const s1q2Notes = classificationNote("vfo", formData.vfoNotes);

  const s2q3Notes = classificationNote("releases", formData.prevLevelFiveNotes);

  const s2q4Notes = classificationNote(
    "felony",
    formData.felonyConvictionsNotes,
  );

  const s3q5Notes = classificationNote("adSeg", formData.pastAdSegNotes);

  const s3q7Notes = classificationNote(
    "incidents",
    formData.currentViolentIncNotes,
  );
  const s3q8Notes = classificationNote(
    "incidents",
    formData.pastViolentIncNotes,
  );
  const s3q9Notes = classificationNote(
    "incidents",
    formData.currentFightThreatPowIncNotes,
  );
  const s3q10Notes = classificationNote(
    "incidents",
    formData.pastFightThreatPowIncNotes,
  );
  const s3q11Notes = classificationNote(
    "incidents",
    formData.currentOtherIncNotes,
  );

  const totalScore = s1SubScore + s2SubScore + s3SubScore;

  return {
    // section 1
    s1q1Score,
    s1q2Score,
    // section 2
    s2q3Score,
    s2q4Score,
    // section 3
    s3q5Score,
    s3q6Score,
    s3q7Score,
    s3q8Score,
    s3q9Score,
    s3q10Score,
    s3q11Score,
    subscores: [s1SubScore, s2SubScore, s3SubScore],
    totalScore: Math.min(totalScore, MAX_TOTAL_SCORE),
    s1q1Notes,
    s1q2Notes,
    s2q3Notes,
    s2q4Notes,
    s3q5Notes,
    s3q7Notes,
    s3q8Notes,
    s3q9Notes,
    s3q10Notes,
    s3q11Notes,
  };
}

export class UsMiInitialClassificationForm extends FormBase<UsMiInitialClassification2026DraftData> {
  get navigateToFormText(): string {
    return this.opportunity.isSubmitted
      ? "Review classification"
      : "Auto-fill classification";
  }

  get formContents(): OpportunityFormComponentName {
    return "FormUsMiClassification";
  }

  get questionList(): UsMiAssessmentSectionsSpec[] | undefined {
    const person = this.person as Resident;
    if (person.stateCode === "US_MI") {
      const questionList =
        person.gender === "MALE"
          ? miMaleInitialClassificationQuestions
          : miFemaleInitialClassificationQuestions;
      return questionList;
    }
  }

  get displayCustodyLevel(): string | undefined {
    const person = this.person as Resident;
    if (person.stateCode === "US_MI") {
      const [prefix, suffix] = person.displayCustodyLevel.split("Security");
      if (prefix.trim() === "Unknown") return "Unknown";
      return suffix?.trim() || person.displayCustodyLevel;
    }
  }

  get formTitle() {
    return "Initial Classification";
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

  get derivedData() {
    const { person } = this;
    return deriveMiClassification(this.formData, (person as Resident).gender);
  }

  get remainingFields() {
    return calculateRemaining(this.formData, InitialKeySelections);
  }
}
