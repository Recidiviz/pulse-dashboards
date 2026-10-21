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

import { SingleSectionAssessmentQuestionSpec } from "~datatypes";

export type UsMiAssessmentQuestionNote = {
  header: string;
  notfound: string;
};

export type SingleExtendedAssessmentQuestionSpec =
  SingleSectionAssessmentQuestionSpec & {
    description: string;
    note?: UsMiAssessmentQuestionNote;
    autofilled?: boolean;
  };

export type MultiplierExtendedAssessmentQuestionSpec = {
  title: string;
  type: "NUMBER";
  description: string;
  bounds: number;
  multiplier: number;
  countDescriptor?: string;
  note?: UsMiAssessmentQuestionNote;
  autofilled?: boolean;
};

export type UsMiAssessmentQuestionSpec =
  | MultiplierExtendedAssessmentQuestionSpec
  | SingleExtendedAssessmentQuestionSpec;

export type UsMiAssessmentSectionsSpec = {
  title: string;
  questions: UsMiAssessmentQuestionSpec[];
};

export const miBaseInitialClassificationQuestions = [
  {
    title: "Criminal & incarceration history",
    questions: [
      {
        title: "Released from Level V in the past 60 months",
        type: "SINGLE",
        description:
          "Based on the most recent release to supervision or liberty in the past 60 months and the True Security Level at that release.",
        options: [
          { text: "Yes", score: 8 },
          { text: "No", score: 0 },
        ],
        note: {
          header: "Most recent release, past 60 months",
          notfound:
            "No release to supervision or liberty in the past 60 months.",
        },
      },
      {
        title:
          "Was sentenced for an assaultive felony conviction in past 36 months",
        type: "SINGLE",
        autofilled: false,
        description:
          "Not auto-filled. Review the felony convictions below and determine which are assaultive per MDOC policy. 36 months is based on the sentence date.",
        options: [
          { text: "Yes", score: 1.6 },
          { text: "No", score: 0 },
        ],
        note: {
          header: "Felony convictions, past 36 months (sentence date)",
          notfound:
            "No felony convictions with a sentence date in the past 36 months.",
        },
      },
    ],
  },
  {
    title: "Disciplinary history",
    questions: [
      {
        title: "Administrative segregation placements in past 36 months",
        type: "NUMBER",
        countDescriptor: "Placements",
        description:
          "Counts distinct ad seg placement starts (current or previous incarceration periods) in past 36 months.",
        bounds: 99,
        multiplier: 4.2,
        note: {
          header: "Ad seg placements, past 36 months",
          notfound: "None recorded in the past 36 months.",
        },
      },
      {
        title: "Assaultive acts in jail in the past 12 months (max 4)",
        type: "SINGLE",
        autofilled: false,
        description: "Not auto-filled.",
        options: [
          { text: "None", score: 0 },
          { text: "One", score: 6.5 },
          { text: "Two", score: 13 },
          { text: "Three", score: 19.5 },
          { text: "Four or more", score: 26.0 },
        ],
      },
      {
        title:
          "Number of misconducts for assault, homicide, sexual violence, inciting a riot or strike in past 6 months",
        type: "NUMBER",
        countDescriptor: "Misconducts",
        description:
          "Includes any incarceration periods overlapping the past 6 months.",
        bounds: 0,
        multiplier: 24.1,
        note: {
          header: "Assaultive misconducts, past 6 months",
          notfound: "None recorded in the last 6 months",
        },
      },
      {
        title:
          "Number of misconducts for assault, homicide, sexual violence, inciting a riot or strike in past incarceration period(s), within past 36 months (max 4)",
        type: "NUMBER",
        countDescriptor: "Misconducts",
        bounds: 4,
        description:
          "Counts misconducts from previous incarceration periods that happened in the past 36 months.",
        multiplier: 9.7,
        note: {
          header: "Assaultive misconducts, past 36 months",
          notfound: "None recorded in the past 36 months",
        },
      },
      {
        title:
          "Number of misconducts for fighting, threatening behavior, or possession of a weapon in past 6 months",
        type: "NUMBER",
        countDescriptor: "Misconducts",
        description:
          "Includes any incarceration periods overlapping the past 6 months.",
        bounds: 0,
        multiplier: 6,
        note: {
          header: "Fighting misconducts, past 6 months",
          notfound: "None recorded in the last 6 months",
        },
      },
      {
        title:
          "Number of misconducts for fighting, threatening behavior, or possession of a weapon in past incarceration period(s), within past 36 months (max 4)",
        type: "NUMBER",
        countDescriptor: "Misconducts",
        description:
          "Counts misconducts from previous incarceration periods that happened in the past 36 months.",
        bounds: 4,
        multiplier: 2,
        note: {
          header: "Fighting misconducts, past 36 months",
          notfound: "None recorded in the past 36 months",
        },
      },
      {
        title:
          "Number of other Class I or Class II misconducts in past 6 months in current incarceration period",
        type: "NUMBER",
        countDescriptor: "Misconducts",
        description: "Auto-filled from misconduct records.",
        bounds: 0,
        multiplier: 1,
        note: {
          header: "Other non-violent Class I and II misconducts, past 6 months",
          notfound: "None recorded in the past 6 months",
        },
      },
    ],
  },
] satisfies UsMiAssessmentSectionsSpec[];

export const miMaleAgeClassificationQuestions = {
  title: "Background factors",
  questions: [
    {
      title: "Age",
      type: "SINGLE",
      description: "Auto-filled from date of birth.",
      options: [
        { text: "25 or Younger", score: 13.8 },
        { text: "26-30", score: 9.7 },
        { text: "31-35", score: 8.3 },
        { text: "36-40", score: 7.7 },
        { text: "41-49", score: 6.4 },
        { text: "50 or Older", score: 6.3 },
      ],
      note: {
        header: "Age",
        notfound: "No age found",
      },
    },
    {
      title: "VFO score",
      type: "SINGLE",
      description:
        "Based on most recent COMPAS assessment on record (all time). “None” applies if the person has no COMPAS assessment on record.",
      options: [
        { text: "Low", score: -1.2 },
        { text: "Medium", score: 0 },
        { text: "High", score: 2.1 },
        { text: "None", score: 0 },
      ],
      note: {
        header: "Most recent COMPAS assessment",
        notfound: "No VFO score found",
      },
    },
  ],
} satisfies UsMiAssessmentSectionsSpec;

export const miMaleInitialClassificationQuestions = [
  miMaleAgeClassificationQuestions,
  ...miBaseInitialClassificationQuestions,
] satisfies UsMiAssessmentSectionsSpec[];

const miFemaleAgeClassificationQuestions = {
  title: "Background factors",
  questions: [
    {
      title: "Age",
      type: "SINGLE",
      description: "Auto-filled from date of birth.",
      options: [
        { text: "25 or Younger", score: 13.8 },
        { text: "26-30", score: 9.7 },
        { text: "31-35", score: 8.3 },
        { text: "36-40", score: 7.7 },
        { text: "41-49", score: 6.4 },
        { text: "50 or Older", score: 6.3 },
      ],
      note: {
        header: "Age",
        notfound: "No age found",
      },
    },
    {
      title: "VFO score",
      type: "SINGLE",
      description:
        "Based on most recent COMPAS assessment on record (all time). “None” applies if the person has no COMPAS assessment on record.",
      options: [
        { text: "Low", score: -1.2 },
        { text: "Medium", score: 0 },
        { text: "None", score: 0 },
      ],
      note: {
        header: "Most recent COMPAS assessment",
        notfound: "No VFO score found",
      },
    },
  ],
} satisfies UsMiAssessmentSectionsSpec;

export const miFemaleInitialClassificationQuestions = [
  miFemaleAgeClassificationQuestions,
  ...miBaseInitialClassificationQuestions,
] satisfies UsMiAssessmentSectionsSpec[];
