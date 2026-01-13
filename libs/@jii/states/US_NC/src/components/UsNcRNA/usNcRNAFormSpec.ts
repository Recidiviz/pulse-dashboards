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

// Copy for the elements on RNA form pages.
// These elements can be section headers displaying info/instructions, or questions.

export const rnaSectionCopy = {
  sectionWorkSchool: {
    heading: "Section 1: Work and Money",
    description: "Select the answer that best shows what is true for you.",
  },
  sectionLifeAreas: {
    heading: "Section 10: Life Areas",
    description:
      "Below you will see life areas that may or may not be areas of concern to you. For each area you mark as a problem, please rate your interest in improving your situation and what you can do.",
  },
} satisfies Record<string, RNASectionCopy>;

export const rnaQuestionCopy = {
  workSchoolSatisfied: {
    question: "I have been satisfied in my work and school situation.",
  },
  workSchoolSkills: {
    question: "I have the skills that I need to get a good job.",
  },
  workSchoolMakeBetter: {
    question: "I try to make my job or school situation better.",
  },
  alcoholDrugsDaysOfUse: {
    question:
      "In a typical week how many days a week did you drink alcohol or use drugs?",
  },
  alcoholDrugsMoreThan5Drinks: {
    question:
      "How many days in a typical week did you drink more than 5 drinks at one sitting?",
    placeholderText: "Number of days",
  },
  alcoholDrugsTimeOfOffense: {
    question:
      "At the time of the offense for which I am currently incarcerated, I was (mark all that apply):",
  },
  childhoodSkippingSchool: {
    question: "Skipping School",
  },
  friendsClose: {
    question: "How many of those friends would you consider “close friends”?",
  },
  lifeAreaBehavior: {
    question: "Is your behavior a problem for you?",
  },
  lifeAreaCustom: {
    question: "Any other areas you'd like to improve?",
    placeholderText: "Another life area",
  },
} satisfies Record<string, RNAQuestionCopy>;

export type RNASectionCopy = {
  heading: string;
  description?: string;
};
export type RNAQuestionCopy = {
  question: string;
  placeholderText?: string;
};

// Internal identifiers for individual RNA elements
type RNASectionId = keyof typeof rnaSectionCopy;
export type RNAQuestionId = keyof typeof rnaQuestionCopy;

export const isRNAQuestionId = (s: string): s is RNAQuestionId =>
  Object.keys(rnaQuestionCopy).includes(s);

// Copy that depends on the format of the RNA question and is consistent for all
// questions of the same format, such as answer choices

export const rnaRadioAnswerCopy = {
  FREQUENCY: {
    NEVER: "Never true",
    RARELY: "Rarely true",
    SOMETIMES: "Sometimes true",
    USUALLY: "Usually true",
    ALWAYS: "Always true",
  },
  DAYS_PER_WEEK_RADIO: {
    ZERO: "0 days",
    ONE_TO_TWO: "1-2 days",
    THREE_TO_FIVE: "3-5 days",
    SIX_TO_SEVEN: "6-7 days",
  },
  YES_NO: {
    YES: "Yes",
    NO: "No",
  },
  RATIO: {
    NONE: "None",
    SOME: "Some",
    MOST: "Most",
    ALL: "All",
  },
} as const satisfies Record<string, Record<string, string>>;

export const rnaSobrietyAnswerCopy = {
  SOBER: "sober",
  JUST_ALCOHOL: "under the influence of just alcohol",
  JUST_DRUGS: "under the influence of just drugs",
  BOTH: "under the influence of both alcohol and drugs",
};

export const rnaLifeAreasQuestionCopy = {
  interestedInImproving:
    "How much are you interested in improving? (1 = Not at all, 10 = Very)",
  improvement: "What can you do to improve the situation? (optional)",
  improvementPlaceholder:
    "Ways you can improve the situation or obstacles that you may face while improving the situation",
  improvementRatings: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
};

// Configuration: everything besides copy that determines how a specific question is displayed

export type RNARadioQuestionFormat = keyof typeof rnaRadioAnswerCopy;
type RNAQuestionFormat =
  | RNARadioQuestionFormat
  | "SOBRIETY"
  | "DAYS_PER_WEEK_ENTRY"
  | "LIFE_AREA";

export type RNAQuestionConfig = {
  questionNumber: number;
  format: RNAQuestionFormat;
};

export const rnaQuestionConfig: Record<RNAQuestionId, RNAQuestionConfig> = {
  workSchoolSatisfied: {
    questionNumber: 1,
    format: "FREQUENCY",
  },
  workSchoolSkills: {
    questionNumber: 2,
    format: "FREQUENCY",
  },
  workSchoolMakeBetter: {
    questionNumber: 3,
    format: "FREQUENCY",
  },
  alcoholDrugsDaysOfUse: {
    questionNumber: 13,
    format: "DAYS_PER_WEEK_RADIO",
  },
  alcoholDrugsMoreThan5Drinks: {
    questionNumber: 14,
    format: "DAYS_PER_WEEK_ENTRY",
  },
  alcoholDrugsTimeOfOffense: {
    questionNumber: 15,
    format: "SOBRIETY",
  },
  childhoodSkippingSchool: {
    questionNumber: 20,
    format: "YES_NO",
  },
  friendsClose: {
    questionNumber: 63,
    format: "RATIO",
  },
  lifeAreaBehavior: {
    questionNumber: 1,
    format: "LIFE_AREA",
  },
  lifeAreaCustom: {
    questionNumber: 10,
    format: "LIFE_AREA",
  },
};

// The RNA form is a sequence of pages. Each page has a section header and some questions.
// This should only contain internal identifiers, not copy - all copy should be
// in the copy objects above.

type RNAPageSpec = {
  id: RNASectionId;
  questions: RNAQuestionId[];
};
export const fullRNASpec: RNAPageSpec[] = [
  {
    id: "sectionWorkSchool",
    questions: [
      "workSchoolSatisfied",
      "workSchoolSkills",
      "workSchoolMakeBetter",
      "alcoholDrugsDaysOfUse",
      "alcoholDrugsMoreThan5Drinks",
      "alcoholDrugsTimeOfOffense",
      "childhoodSkippingSchool",
      "friendsClose",
    ],
  },
  {
    id: "sectionLifeAreas",
    questions: ["lifeAreaBehavior", "lifeAreaCustom"],
  },
  {
    id: "sectionWorkSchool",
    questions: ["workSchoolSkills", "workSchoolSatisfied"],
  },
  {
    id: "sectionWorkSchool",
    questions: ["workSchoolMakeBetter"],
  },
];
