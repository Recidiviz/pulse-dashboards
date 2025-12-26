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
} satisfies Record<string, RNAQuestionCopy>;

export type RNASectionCopy = {
  heading: string;
  description?: string;
};
type RNAQuestionCopy = {
  question: string;
  placeholderText?: string;
};

// Internal identifiers for individual RNA elements
type RNASectionId = keyof typeof rnaSectionCopy;
type RNAQuestionId = keyof typeof rnaQuestionCopy;

export const isRNAQuestionId = (s: string): s is RNAQuestionId =>
  Object.keys(rnaQuestionCopy).includes(s);

// Configuration: everything besides copy that determines how a specific question is displayed

type RNAQuestionFormat = "FREQUENCY";

type RNAQuestionConfig = {
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
    ],
  },
];
