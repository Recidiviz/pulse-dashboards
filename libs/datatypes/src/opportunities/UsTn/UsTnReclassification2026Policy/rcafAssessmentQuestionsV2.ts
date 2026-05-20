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
  AssessmentQuestionSpec,
  TupleWithArity,
} from "../reclassificationScoreUtils";
import { rcafAssessmentQuestionNumbers } from "./rcafAssessmentQuestions";

export const rcafAssessmentQuestionsV2 = [
  {
    title: "PRIOR VIOLENT/ASSAULTIVE FELONY CONVICTIONS",
    type: "SINGLE",
    canBeNone: true,
    options: [
      {
        text: "Violent/Assaultive Felony Conviction in Last 60 Months",
        score: 2,
      },
    ],
  },
  {
    title: "SEVERITY OF CURRENT OFFENSE (Rate Most Serious)",
    type: "SINGLE",
    options: [
      { text: "Low", score: 10 },
      { text: "Moderate", score: 11 },
      { text: "High", score: 12 },
      { text: "Highest", score: 13 },
    ],
  },
  {
    title: "CLASS B OR C DISCIPLINARY REPORTS (CHECK ALL THAT APPLY)",
    type: "BREAKDOWNV2",
    sections: [
      {
        period: "0-6",
        multiplier: 1,
      },
      {
        period: "6-12",
        multiplier: 1,
      },
    ],
  },
  {
    title: "NONVIOLENT CLASS A DISCIPLINARY REPORTS (CHECK ALL THAT APPLY)",
    type: "BREAKDOWNV2",
    sections: [
      {
        period: "0-6",
        multiplier: 2,
      },
      {
        period: "6-12",
        multiplier: 1,
      },
    ],
  },
  {
    title: "VIOLENT CLASS A DISCIPLINARY REPORTS (CHECK ALL THAT APPLY)",
    type: "BREAKDOWNV2",
    sections: [
      {
        period: "0-6",
        multiplier: 11,
      },
      {
        period: "6-12",
        multiplier: 7,
      },
      {
        period: "12-18",
        multiplier: 6,
      },
      {
        period: "18-36",
        multiplier: 4,
      },
      {
        period: "36-60",
        multiplier: 2,
      },
    ],
  },
  {
    title: "AGE",
    type: "SINGLE",
    options: [
      { text: "21 or Younger", score: 13 },
      { text: "22 - 25", score: 5 },
      { text: "26 - 30", score: 2 },
      {
        text: "30 or Younger with no Class A or B Disciplinary in Previous Year",
        score: 1,
      },
      { text: "31 - 35", score: 1 },
      { text: "36 - 40", score: 0 },
      { text: "41 - 45", score: -1 },
      { text: "Older than 45", score: -2 },
    ],
  },
  {
    title: "PROGRAM COMPLETIONS",
    type: "SINGLE",
    options: [
      { text: "None", score: 0 },
      { text: "One", score: -1 },
      { text: "Two", score: -2 },
      { text: "Three", score: -3 },
      { text: "Four", score: -4 },
      { text: "Five or More", score: -5 },
    ],
  },
] satisfies TupleWithArity<
  AssessmentQuestionSpec,
  typeof rcafAssessmentQuestionNumbers
>;
