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

import { UsMiAssessmentSectionsSpec } from "../UsMiInitialClassification2026Policy/InitialQuestionSchema";

export const miBaseReviewClassificationQuestions = [
  {
    title: "Disciplinary history",
    questions: [
      {
        title: "Administrative Segregation Placements in Past 36 Months",
        type: "NUMBER",
        countDescriptor: "Placements",
        description:
          "Counts distinct ad seg placement starts (current or previous incarceration periods) in past 36 months.",
        bounds: 0,
        multiplier: 4.2,
        note: {
          type: "AdSeg",
          header: "Administrative Segregation Placements, past 36 months",
          notfound: "None recorded in the last 36 months",
        },
      },
      {
        title:
          "Number of Misconducts for Assault, Homicide, Sexual Violence, Inciting a Riot or Strike In Past 6 Months",
        type: "NUMBER",
        countDescriptor: "Misconducts",
        description:
          "Includes any incarceration periods overlapping the past 6 months.",
        bounds: 0,
        multiplier: 12.3,
        note: {
          type: "Incidents",
          header: "Assaultive misconducts, past 6 months",
          notfound: "None recorded in the last 6 months",
        },
      },
      {
        title:
          "Number of Misconducts for Assault, Homicide, Sexual Violence, Inciting a Riot or Strike In Past 6-12 Months",
        type: "NUMBER",
        countDescriptor: "Misconducts",
        description:
          "Includes any incarceration periods overlapping the past 6-12 months.",
        bounds: 0,
        multiplier: 7.5,
        note: {
          type: "Incidents",
          header: "Assaultive misconducts, past 6-12 months",
          notfound: "None recorded in the last 6-12 months",
        },
      },
      {
        title:
          "Number of Misconducts for Assault, Homicide, Sexual Violence, Inciting a Riot or Strike In Past 12-24 Months",
        type: "NUMBER",
        countDescriptor: "Misconducts",
        description:
          "Includes any incarceration periods overlapping the past 12-24 months.",
        bounds: 0,
        multiplier: 4.6,
        note: {
          type: "Incidents",
          header: "Assaultive misconducts, past 12-24 months",
          notfound: "None recorded in the last 12-24 months",
        },
      },
      {
        title:
          "Number of Misconducts for Assault, Homicide, Sexual Violence, Inciting a Riot or Strike In Past 24-36 Months",
        type: "NUMBER",
        countDescriptor: "Misconducts",
        description:
          "Includes any incarceration periods overlapping the past 24-36 months.",
        bounds: 0,
        multiplier: 3.7,
        note: {
          type: "Incidents",
          header: "Assaultive misconducts, past 24-36 months",
          notfound: "None recorded in the last 24-36 months",
        },
      },
      {
        title:
          "Number of Misconducts for Assault, Homicide, Sexual Violence, Inciting a Riot or Strike In Past 0-36 Months",
        type: "NUMBER",
        countDescriptor: "Misconducts",
        bounds: 4,
        description:
          "Includes any incarceration periods overlapping the past 36 months.",
        multiplier: 3.7,
        note: {
          type: "Incidents",
          header: "Assaultive misconducts, past 36 months",
          notfound: "None recorded in the last 36 months",
        },
      },
      {
        title:
          "Number of Misconducts for Fighting, Threatening Behavior, or Possession of a Weapon In Past 6 Months",
        type: "NUMBER",
        countDescriptor: "Misconducts",
        description:
          "Includes any incarceration periods overlapping the past 6 months.",
        bounds: 0,
        multiplier: 6,
        note: {
          type: "Incidents",
          header: "Fighting misconducts, past 6 months",
          notfound: "None recorded in the last 6 months",
        },
      },
      {
        title:
          "Number of Misconducts for Fighting, Threatening Behavior, or Possession of a Weapon In Past 6-12 Months",
        type: "NUMBER",
        countDescriptor: "Misconducts",
        description:
          "Includes any incarceration periods overlapping the past 6-12 months.",
        bounds: 0,
        multiplier: 3.5,
        note: {
          type: "Incidents",
          header: "Fighting misconducts, past 6-12 months",
          notfound: "None recorded in the last 6-12 months",
        },
      },
      {
        title:
          "Number of Misconducts for Fighting, Threatening Behavior, or Possession of a Weapon In Past 12-36 Months",
        type: "NUMBER",
        countDescriptor: "Misconducts",
        description:
          "Includes any incarceration periods overlapping the past 12-36 months.",
        bounds: 0,
        multiplier: 2,
        note: {
          type: "Incidents",
          header: "Fighting misconducts, past 12-36 months",
          notfound: "None recorded in the last 12-36 months",
        },
      },
      {
        title:
          "Number of Misconducts for Fighting, Threatening Behavior, or Possession of a Weapon In Past 0-36 Months",
        type: "NUMBER",
        countDescriptor: "Misconducts",
        description:
          "Includes any incarceration periods overlapping the past 36 months.",
        bounds: 4,
        multiplier: 2,
        note: {
          type: "Incidents",
          header: "Fighting misconducts, past 36 months",
          notfound: "None recorded in the last 36 months",
        },
      },
      {
        title: "Number of Class One or Class Two Misconducts in Past 6 Months",
        type: "NUMBER",
        countDescriptor: "Misconducts",
        description: "Auto-filled from misconduct records.",
        bounds: 0,
        multiplier: 1,
        note: {
          type: "Incidents",
          header: "Class I and Class II misconducts, past 6 months",
          notfound: "None recorded in the last 6 months",
        },
      },
    ],
  },
  {
    title: "Good Behavior and Programming",
    questions: [
      {
        title:
          "Number of 4 Month Periods Without Misconducts In Past 12 Months",
        type: "NUMBER",
        countDescriptor: "Periods Without Misconducts",
        description: "Auto-filled from misconduct records.",
        bounds: 0,
        multiplier: -0.8,
        note: {
          type: "NoMisconducts",
          header: "Periods without misconducts, past 12 months",
          notfound: "None recorded in the last 12 months",
        },
      },
      {
        title: "Program Completion - Core",
        type: "NUMBER",
        countDescriptor: "Programs",
        description:
          "Count of CORE program completions in the current incarceration period.",
        bounds: 0,
        multiplier: -0.8,
        note: {
          type: "Programs",
          header: "Count of CORE Program completions",
          notfound: "None recorded",
        },
      },
      {
        title: "Program Completion - High",
        type: "SINGLE",
        description:
          "Count of High program completions in the current incarceration period.",
        options: [
          { text: "True", score: -1.8 },
          { text: "False", score: 0 },
        ],
        note: {
          type: "Programs",
          header: "Count of High Program completions",
          notfound: "None recorded",
        },
      },
      {
        title: "Work Participation",
        type: "NUMBER",
        countDescriptor: "Periods with satisfactory work",
        autofilled: false,
        description:
          "Not autofilled. Number of 4-month periods with satisfactory work performance in past 12 months. Satisfactory performance is determined by facility staff.",
        bounds: 0,
        multiplier: -1,
      },
    ],
  },
] satisfies UsMiAssessmentSectionsSpec[];

const miMaleAgeClassificationQuestions = {
  title: "Background Factors",
  questions: [
    {
      title: "Age",
      type: "SINGLE",
      description: "Auto-filled from date of birth.",
      options: [
        { text: "25 or Younger", score: 13.1 },
        { text: "26-30", score: 11.2 },
        { text: "31-35", score: 10.5 },
        { text: "36-40", score: 9.1 },
        { text: "41-49", score: 8.8 },
        { text: "50 or Older", score: 8.0 },
      ],
      note: {
        type: "Age",
        header: "Age",
        notfound: "No age found",
      },
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
      note: {
        type: "VFO",
        header: "Most recent COMPAS assessment",
        notfound: "No VFO score found",
      },
    },
  ],
} satisfies UsMiAssessmentSectionsSpec;

export const miMaleReviewClassificationQuestions = [
  miMaleAgeClassificationQuestions,
  ...miBaseReviewClassificationQuestions,
] satisfies UsMiAssessmentSectionsSpec[];

const miFemaleAgeClassificationQuestions = {
  title: "Background Factors",
  questions: [
    {
      title: "Age",
      type: "SINGLE",
      description: "Auto-filled from date of birth.",
      options: [
        { text: "25 or Younger", score: 13.1 },
        { text: "26-30", score: 11.2 },
        { text: "31-35", score: 10.5 },
        { text: "36-40", score: 9.1 },
        { text: "41-49", score: 8.8 },
        { text: "50 or Older", score: 8.0 },
      ],
      note: {
        type: "Age",
        header: "Age",
        notfound: "No age found",
      },
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
      note: {
        type: "VFO",
        header: "Most recent COMPAS assessment",
        notfound: "No VFO score found",
      },
    },
  ],
} satisfies UsMiAssessmentSectionsSpec;

export const miFemaleReviewClassificationQuestions = [
  miFemaleAgeClassificationQuestions,
  ...miBaseReviewClassificationQuestions,
] satisfies UsMiAssessmentSectionsSpec[];
