// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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
} from "../common/ScoredAssessmentQuestion";

export const assessmentQuestionNumbers = [1, 2, 3, 4, 5, 6] as const;

export type AssessmentQuestionNumber =
  (typeof assessmentQuestionNumbers)[number];

export const assessmentQuestions = [
  {
    title: "PRIOR VIOLENT FELONY CONVICTIONS",
    type: "SINGLE",
    canBeNone: true,
    options: [
      {
        text: "Violent Felony Conviction in Last 24 Months",
        score: 4,
      },
      {
        text: "Violent Felony Conviction 24-60 Months Ago",
        score: 3,
      },
    ],
  },
  {
    title: "SEVERITY OF CURRENT OFFENSE (Rate most serious)",
    type: "SINGLE",
    options: [
      { text: "Low", score: 10 },
      { text: "Moderate", score: 11 },
      { text: "High", score: 12 },
      { text: "Highest", score: 13 },
    ],
  },
  {
    title: "CLASS B OR C DISCIPLINARY REPORTS SINCE RECEPTION",
    type: "SINGLE",
    options: [
      { text: "Yes", score: 6 },
      { text: "No", score: -1 },
    ],
  },
  {
    title: "NONVIOLENT CLASS A DISCIPLINARY REPORTS",
    type: "SINGLE",
    options: [
      { text: "Yes", score: 12 },
      { text: "No", score: -1 },
    ],
  },
  {
    title: "VIOLENT CLASS A DISCIPLINARY REPORTS SINCE RECEPTION",
    type: "SINGLE",
    options: [
      { text: "Yes", score: 30 },
      { text: "No", score: -1 },
    ],
  },
  {
    title: "AGE",
    type: "SINGLE",
    options: [
      { text: "21 or Younger", score: 10 },
      { text: "22 - 25", score: 5 },
      { text: "26 - 30", score: 2 },
      { text: "31 - 35", score: 1 },
      { text: "36 - 40", score: 0 },
      { text: "41 - 45", score: -1 },
      { text: "Older than 45", score: -2 },
    ],
  },
] satisfies TupleWithArity<
  AssessmentQuestionSpec,
  typeof assessmentQuestionNumbers
>;
