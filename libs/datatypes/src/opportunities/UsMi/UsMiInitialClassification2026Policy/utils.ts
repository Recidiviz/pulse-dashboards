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

import { z } from "zod";

import {
  ClassificationNoteData,
  getSingleSectionQuestionScore,
  prevLevelFiveNotes,
  UsMiInitialClassification2026DraftData,
} from "~datatypes";

import { dateStringSchema } from "../../../utils/zod";
import {
  miFemaleReviewClassificationQuestions,
  miMaleReviewClassificationQuestions,
} from "../UsMiReviewClassification2026Policy/ReviewQuestionsSchema";
import type { UsMiReviewClassification2026DraftData } from "../UsMiReviewClassification2026Policy/schema";
import {
  miFemaleInitialClassificationQuestions,
  miMaleInitialClassificationQuestions,
  UsMiAssessmentQuestionSpec,
} from "./InitialQuestionSchema";

export const usMiIncidentNotesSchema = z
  .object({
    incidentsList: z.array(
      z.object({
        incarcerationIncidentId: z.coerce.number(),
        incidentClass: z.string(),
        incidentDate: dateStringSchema,
        incidentTimePeriod: z.string(),
        infractionTypeRawText: z.string(),
      }),
    ),
    latestIncidentDate: dateStringSchema,
  })
  .partial()
  .passthrough();

export const usMiAgeNotes = z
  .object({
    age: z.coerce.number(),
  })
  .passthrough();

export const usMiVfoNotes = z
  .object({
    assessmentDate: dateStringSchema,
    vfoLevelDetail: z.string().nullable(),
    vfoLevel: z.string(),
  })
  .passthrough();

export const usMiFelonyConvictionsNotes = z.array(
  z.object({
    description: z.string(),
    imposedDate: dateStringSchema,
    statute: z.string(),
  }),
);

export const usMiPastAdSegNotes = z
  .object({
    numAdSegStartsInPast36Months: z.coerce.number(),
    adSegStartsList: z
      .array(
        z.object({
          adSegEndDateExclusive: dateStringSchema.nullable(),
          adSegStartDate: dateStringSchema.nullable(),
        }),
      )
      .nullable(),
  })
  .passthrough();

export const usMiClassificationFormBaseSchema = z
  .object({
    ageNotes: usMiAgeNotes.nullable(),
    vfoNotes: usMiVfoNotes.nullable(),
    currentViolentIncNotes: usMiIncidentNotesSchema.nullable(),
    pastViolentIncNotes: usMiIncidentNotesSchema.nullable(),
    currentFightThreatPowIncNotes: usMiIncidentNotesSchema.nullable(),
    pastFightThreatPowIncNotes: usMiIncidentNotesSchema.nullable(),
    currentOtherIncNotes: usMiIncidentNotesSchema.nullable(),
    felonyConvictionsNotes: usMiFelonyConvictionsNotes.nullable(),
    pastAdSegNotes: usMiPastAdSegNotes.nullable(),
    ageScore: z.coerce.number().nullable(),
    calculatedTotalScore: z.coerce.number().nullable(),
    currentFightThreatPowIncScore: z.coerce.number().nullable(),
    currentOtherIncScore: z.coerce.number().nullable(),
    currentViolentIncScore: z.coerce.number().nullable(),
    pastAdSegScore: z.coerce.number().nullable(),
    pastFightThreatPowIncScore: z.coerce.number().nullable(),
    pastViolentIncScore: z.coerce.number().nullable(),
    vfoScore: z.coerce.number().nullable(),
  })
  .partial()
  .passthrough();

export type usMiIncidentNotesSchema = z.infer<typeof usMiIncidentNotesSchema>;
export type usMiAgeNotes = z.infer<typeof usMiAgeNotes>;
export type usMiVfoNotes = z.infer<typeof usMiVfoNotes>;
export type usMiFelonyConvictionsNotes = z.infer<
  typeof usMiFelonyConvictionsNotes
>;
export type usMiPastAdSegNotes = z.infer<typeof usMiPastAdSegNotes>;

// utils

const usMiDepartureReasons = [
  "No override",
  "Nature of recent misconduct(s) warrants increased security level.",
  "Behavior indicates that prisoner is not suitable for Level I at this time.",
  "Overall criminal history warrants security level increase.",
  "Overall institutional history warrants security level increase.",
  "Delay further security level reduction to monitor adjustment.",
  "Prisoner can be managed in reduced security level.",
  "Parole allows for security level reduction per policy.",
  "Escape history warrants higher security level.",
  "Assaultive behavior warrants higher security level.",
  "History of protection requests warrants higher security level.",
  "Investigation warrants increased security level.",
  "Former occupation warrants higher security level.",
  "Other with CFA approval.",
];

const usMiWaiverReasons = [
  "No override",
  "Access to medical treatment",
  "Access to programming",
  "Lack of bedspace",
  "Facilitate a writ",
  "Investigation",
];

export const usMiLevelBreakdowns = [
  { title: "Level I", range: "0-7.1" },
  { title: "Level II", range: "7.2-19.2" },
  { title: "Level IV", range: "19.3-49.2" },
  { title: "Level V", range: "49.3-60" },
];

export const usMiSecurityLevels = usMiLevelBreakdowns.map(
  (level) => level.title,
);

// A bounds of 0 means the question has no maximum.
function capToBounds(
  question: Extract<UsMiAssessmentQuestionSpec, { type: "NUMBER" }>,
  amount: number,
): number {
  return question.bounds > 0 ? Math.min(amount, question.bounds) : amount;
}

function getMultiplierScore(
  question: UsMiAssessmentQuestionSpec,
  amount: number | undefined,
): number | undefined {
  if (amount === undefined || question.type !== "NUMBER") return undefined;

  if (typeof amount !== "number") return undefined;
  return Number(
    (question.multiplier * capToBounds(question, amount)).toFixed(2),
  );
}

function getSingleScore(
  question: UsMiAssessmentQuestionSpec,
  selection: number | undefined,
): number | undefined {
  if (question.type !== "SINGLE" || selection === undefined) return undefined;

  return getSingleSectionQuestionScore(question, selection);
}

export type UsMiOverrideType = {
  title: string;
  description: string;
  reasonsTitle: string;
  reasons: string[];
  levelTitle: string;
  levelSubText: string;
  levels: string[];
};

export const usMiOverrideQuestions: UsMiOverrideType[] = [
  {
    title: "Departure override based on resident's behavior",
    description:
      "Changes the resident's level based on their own behavior, history, or circumstances.",
    reasonsTitle: "Departure reason",
    reasons: usMiDepartureReasons,
    levelTitle: "True security level",
    levelSubText:
      "The level the resident should be classified at after a departure.",
    levels: usMiSecurityLevels,
  },
  {
    title: "Waiver override for facility operations",
    description:
      "Changes the resident's level for reasons unrelated to behavior, like facility, medical, or procedural needs.",
    reasonsTitle: "Waiver reason",
    reasons: usMiWaiverReasons,
    levelTitle: "Actual placement level",
    levelSubText:
      "Where this resident is actually housed, which can differ from their true security level for reasons unrelated to their behavior (space, medical, programming, etc.).",
    levels: usMiSecurityLevels,
  },
];
export function calculateUsMiAgeOptionSelection(
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

const US_MI_MAX_TOTAL_SCORE = 60;

// The female VFO question has no "High" option, so a high score falls back to
// "None", which carries the same score as "Medium".
export function calculateUsMiVfoOptionSelection(
  question: UsMiAssessmentQuestionSpec,
  vfoLevelDetail: string | null | undefined,
) {
  if (question.type !== "SINGLE") return;
  const optionTexts = question.options.map((option) => option.text);
  const index = optionTexts.indexOf(getVfoOptionText(vfoLevelDetail));
  return index === -1 ? optionTexts.indexOf("None") : index;
}

export function calculateUsMiReleasedFromLevelFive(
  note: prevLevelFiveNotes | null,
) {
  // if the note is null or undefined or the hadPrevTrueLevel5Release is set to 0
  // then we want this question to be marked as 'No'
  if (!note || note.hadPrevTrueLevel5Release === 0) return 1;
  return 0;
}

export function countUsMiIncidents(
  note: usMiIncidentNotesSchema | null | undefined,
): number | undefined {
  return note?.incidentsList?.length ?? 0;
}

function classificationNote<K extends keyof ClassificationNoteData>(
  kind: K,
  data: ClassificationNoteData[K] | null | undefined,
): { kind: K; data: ClassificationNoteData[K] } | null {
  return data ? { kind, data } : null;
}

export const usMiOverrideSelections = {
  override1_1Selection: "override1_2Selection",
  override2_1Selection: "override2_2Selection",
};

// These match the option scores of the good behavior question in
// ReviewQuestionsSchema.ts.
const US_MI_GOOD_BEHAVIOR_FOUR_MONTH_SCORE = -2.6;
export const US_MI_GOOD_BEHAVIOR_PAST_YEAR_SCORE = -1.7;

export function hasUsMiFourMonthGoodBehavior(
  pastFourMonthsScore: number | null | undefined,
) {
  return pastFourMonthsScore === US_MI_GOOD_BEHAVIOR_FOUR_MONTH_SCORE;
}

export function getUsMiIncidentsInPeriod(
  note: usMiIncidentNotesSchema["incidentsList"] | undefined,
  period: string,
): usMiIncidentNotesSchema | undefined {
  if (!note) {
    return undefined;
  }
  const incidents = note.filter(
    (incident) => incident.incidentTimePeriod === period,
  );

  return incidents.length ? { incidentsList: incidents } : undefined;
}

export function deriveMiInitialClassification(
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

    // overrides
    override1_1Selection,
    override1_2Selection,
    override2_1Selection,
    override2_2Selection,
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

  const totalScore = Number((s1SubScore + s2SubScore + s3SubScore).toFixed(2));

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
    totalScore: Math.min(totalScore, US_MI_MAX_TOTAL_SCORE),
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

    // overrides
    override1_1Selection,
    override1_2Selection,
    override2_1Selection,
    override2_2Selection,
  };
}

export function deriveMiReviewClassification(
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

    override1_1Selection,
    override1_2Selection,
    override2_1Selection,
    override2_2Selection,
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
  const s3q14Score = getSingleScore(s3q14, s3q14Selection);
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
    getUsMiIncidentsInPeriod(currentViolentIncidents, "0-6 months"),
  );
  const s2q5Notes = classificationNote(
    "incidents",
    getUsMiIncidentsInPeriod(currentViolentIncidents, "6-12 months"),
  );
  const s2q6Notes = classificationNote(
    "incidents",
    getUsMiIncidentsInPeriod(currentViolentIncidents, "12-24 months"),
  );
  const s2q7Notes = classificationNote(
    "incidents",
    getUsMiIncidentsInPeriod(currentViolentIncidents, "24-36 months"),
  );

  const s2q8Notes = classificationNote(
    "incidents",
    formData.pastViolentIncNotes,
  );

  const currentFightIncidents =
    formData.currentFightThreatPowIncNotes?.incidentsList;
  const s2q9Notes = classificationNote(
    "incidents",
    getUsMiIncidentsInPeriod(currentFightIncidents, "0-6 months"),
  );
  const s2q10Notes = classificationNote(
    "incidents",
    getUsMiIncidentsInPeriod(currentFightIncidents, "6-12 months"),
  );
  const s2q11Notes = classificationNote(
    "incidents",
    getUsMiIncidentsInPeriod(currentFightIncidents, "12-36 months"),
  );

  const s2q12Notes = classificationNote(
    "incidents",
    formData.pastFightThreatPowIncNotes,
  );
  const s2q13Notes = classificationNote(
    "incidents",
    formData.currentOtherIncNotes,
  );

  const s3q14Notes = hasUsMiFourMonthGoodBehavior(
    formData.goodBehPastFourMonthScore,
  )
    ? classificationNote(
        "goodBehaviorFourMonth",
        formData.goodBehPastFourMonthNotes ?? {
          latestAdSegPlacement: null,
          latestIncidents: [],
        },
      )
    : classificationNote(
        "goodBehaviorPastYear",
        formData.goodBehPastYearNotes ?? {},
      );

  const s3q15Notes = classificationNote(
    "programs",
    formData.programCompleteCoreNotes?.coreProgramCompletionsList,
  );
  const s3q16Notes = classificationNote(
    "programs",
    formData.programCompleteHighNotes?.highProgramCompletionsList,
  );

  const totalScore = Number((s1SubScore + s2SubScore + s3SubScore).toFixed(2));

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
    totalScore: Math.min(totalScore, US_MI_MAX_TOTAL_SCORE),
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

    // overrides
    override1_1Selection,
    override1_2Selection,
    override2_1Selection,
    override2_2Selection,
  };
}
