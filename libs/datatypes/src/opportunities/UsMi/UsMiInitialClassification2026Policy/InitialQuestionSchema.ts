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

type SingleExtendedAssessmentQuestionSpec =
  SingleSectionAssessmentQuestionSpec & {
    description: string;
  };

// to-do - move this towards BreakdownAssessmentQuestionSpecV2
// and extend with description & bounds

// and - or - move the tn utils out to a shared reusable file
type MultiplierExtendedAssessmentQuestionSpec = {
  title: string;
  type: "NUMBER";
  description: string;
  bounds: number;
  multiplier: number;
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
    title: "Criminal & Incarceration History",
    questions: [
      {
        title: "Released from Level V in the last 60 Months",
        type: "SINGLE",
        description:
          "Based on the most recent release to supervision or liberty in the past 60 months and the TRUE security level at that release. Temporary release on writ does not count.",
        options: [
          { text: "Yes", score: 8 },
          { text: "No", score: 0 },
        ],
      },
      {
        title: "Had an assaultive felony conviction in past 36 months",
        type: "SINGLE",
        description:
          "Not auto-filled. Review the felony convictions below and determine which are assaultive per MDOC policy. 36 months is based on the date imposed.",
        options: [
          { text: "Yes", score: 1.6 },
          { text: "No", score: 0 },
        ],
      },
    ],
  },
  {
    title: "Disciplinary history",
    questions: [
      {
        title: "Administrative Segregation Placements in Past 36 Months",
        type: "NUMBER",
        description:
          "Counts distinct ad seg placement starts (current or previous incarceration periods) in past 36 months.",
        bounds: 0,
        multiplier: 4.2,
      },
      {
        title:
          "Number of Misconducts for Assault, Homicide, Sexual Violence, Inciting a Riot or Strike In Past 6 Months",
        type: "NUMBER",
        description:
          "Includes any incarceration periods overlapping the past 6 months.",
        bounds: 0,
        multiplier: 24.1,
      },
      {
        title:
          "Number of Misconducts for Assault, Homicide, Sexual Violence, Inciting a Riot or Strike In Past 0-36 Months",
        type: "NUMBER",
        bounds: 4,
        description:
          "Includes any incarceration periods overlapping the past 36 months.",
        multiplier: 9.7,
      },
      {
        title:
          "Number of Misconducts for Fighting, Threatening Behavior, or Possession of a Weapon In Past 6 Months",
        type: "NUMBER",
        description:
          "Includes any incarceration periods overlapping the past 6 months.",
        bounds: 0,
        multiplier: 6,
      },
      {
        title:
          "Number of Misconducts for Fighting, Threatening Behavior, or Possession of a Weapon In Past 0-36 Months",
        type: "NUMBER",
        description:
          "Includes any incarceration periods overlapping the past 36 months.",
        bounds: 4,
        multiplier: 2,
      },
      {
        title: "Number of Class One or Class Two Misconducts in Past 6 Months",
        type: "NUMBER",
        description: "Auto-filled from misconduct records.",
        bounds: 0,
        multiplier: 1,
      },
      {
        title: "Assaultive Acts in Jail",
        type: "NUMBER",
        description: "Not auto-filled.",
        bounds: 4,
        multiplier: 6.5,
      },
    ],
  },
] satisfies UsMiAssessmentSectionsSpec[];

export const miMaleAgeClassificationQuestions = {
  title: "Background Factors",
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
    },
    {
      title: "VFO Score",
      type: "SINGLE",
      description:
        "Based on most recent COMPAS assessment on record (all time). “Neither” applies if the person has never had a COMPAS assessment.",
      options: [
        { text: "Low", score: -1.2 },
        { text: "High", score: 2.1 },
        { text: "Neither", score: 0 },
      ],
    },
  ],
} satisfies UsMiAssessmentSectionsSpec;

export const miMaleInitialClassificationQuestions = [
  miMaleAgeClassificationQuestions,
  ...miBaseInitialClassificationQuestions,
];

const miFemaleAgeClassificationQuestions = {
  title: "Background Factors",
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
    },
    {
      title: "VFO Score",
      type: "SINGLE",
      description:
        "Based on most recent COMPAS assessment on record (all time). “Neither” applies if the person has never had a COMPAS assessment.",
      options: [
        { text: "Low", score: -1.2 },
        { text: "Neither", score: 0 },
      ],
    },
  ],
} satisfies UsMiAssessmentSectionsSpec;

export const miFemaleInitialClassificationQuestions = [
  miFemaleAgeClassificationQuestions,
  ...miBaseInitialClassificationQuestions,
];
