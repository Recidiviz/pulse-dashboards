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

// TODO(#4108): Consider and apply refactoring `UsTnAnnualReclassificationReview...` and `UsTnCustodyLevelDowngrade...` files to remove duplicated logic.
export type AssessmentQuestionSpec = {
  title: string;
  canBeNone: boolean;
  options: {
    text: string;
    score: number;
  }[];
};

// I'm not sure that this is the best way to do it, but the goal is to get the
// question numbers into typeland so keys like q3Score can check
export const assessmentQuestionNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

export type AssessmentQuestionNumber =
  (typeof assessmentQuestionNumbers)[number];

type TupleWithArity<OutType, InTuple> = {
  [K in keyof InTuple]: OutType;
};

export const assessmentQuestions: TupleWithArity<
  AssessmentQuestionSpec,
  typeof assessmentQuestionNumbers
> = [
  {
    title:
      "HISTORY OF INSTITUTIONAL VIOLENCE (Jail or Prison, Rate Most Serious)",
    canBeNone: true,
    options: [
      {
        text: "ASSAULT – no weapon, no serious injury (last 18 months)",
        score: 3,
      },
      {
        text: "ASSAULT – with weapon, no serious injury (last 18 months)",
        score: 5,
      },
      {
        text: "ASSAULT – with or without weapon, with serious injury or death (last 42 months)",
        score: 7,
      },
      {
        text: "ASSAULT – with or without weapon with serious injury or death (43 through 60 months)",
        score: 5,
      },
    ],
  },
  {
    title: "ASSAULT OCCUR WITHIN LAST SIX MONTHS",
    canBeNone: false,
    options: [
      { text: "No", score: 0 },
      { text: "Yes", score: 3 },
    ],
  },
  {
    title: "SEVERITY OF CURRENT OFFENSE (Rate Most Serious)",
    canBeNone: false,
    options: [
      { text: "Low", score: 0 },
      { text: "Moderate", score: 1 },
      { text: "High", score: 3 },
      { text: "Highest", score: 4 },
    ],
  },
  {
    title: "PRIOR ASSAULTIVE OFFENSE HISTORY (Rate Most Serious)",
    canBeNone: false, // could arguably be true, but we have no way to disambiguate a 0 score
    options: [
      { text: "Low", score: 0 },
      { text: "Moderate", score: 1 },
      { text: "High", score: 3 },
      { text: "Highest", score: 4 },
    ],
  },
  {
    title: "ESCAPE HISTORY (WITHIN LAST 5 YEARS OF INCARCERATION)",
    canBeNone: false,
    options: [
      {
        text: "No escapes or attempts",
        score: -2,
      },
      {
        text: "Escape or attempt from minimum custody, no actual or threatened violence: over 1 year ago",
        score: 0,
      },
      {
        text: "Escape or attempt from minimum custody, no actual or threatened violence: within the last year",
        score: 1,
      },
      {
        text: "Escape or attempt from medium or above custody, or from minimum custody with actual or threatened violence: over 1 year ago",
        score: 5,
      },
      {
        text: "Escape or attempt from medium or above custody, or from minimum custody with actual or threatened violence: within last year",
        score: 7,
      },
    ],
  },
  {
    title: "DISCIPLINARY REPORTS – GUILTY",
    canBeNone: false,
    options: [
      { text: "None in Last 18 Months", score: -4 },
      { text: "None in Last 12 Months", score: -2 },
      { text: "None in Last 6 Months", score: -1 },
      { text: "New Admission / Parole Violator", score: 0 },
      { text: "One in Last 6 Months", score: 1 },
      { text: "Two or More in Last 6 Months", score: 4 },
    ],
  },
  {
    title: "MOST SEVERE DISCIPLINARY RECEIVED (last 18 months)",
    canBeNone: true,
    options: [
      { text: "Class C", score: 2 },
      { text: "Class B", score: 5 },
      { text: "Class A", score: 7 },
    ],
  },
  {
    title: "DETAINER / NOTIFICATION / CHARGE PENDING",
    canBeNone: true,
    options: [
      { text: "Misdemeanor", score: 3 },
      { text: "Felony", score: 5 },
    ],
  },
  {
    title: "PRIOR FELONY CONVICTIONS",
    canBeNone: true,
    options: [
      { text: "One", score: 2 },
      { text: "Two or More", score: 4 },
    ],
  },
];
