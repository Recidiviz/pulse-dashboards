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

import React from "react";

export type AssessmentOption = {
  text: string;
  score: number;
};

export type SingleSectionAssessmentQuestionSpec = {
  title: string;
  type: "SINGLE";
  canBeNone?: boolean;
  options: AssessmentOption[];
};

export type BreakdownAssessmentQuestionPeriod =
  | "0-6"
  | "6-12"
  | "12-18"
  | "18-36"
  | "36-60";

export type BreakdownAssessmentQuestionSpec = {
  title: string;
  type: "BREAKDOWN";
  sections: {
    period: BreakdownAssessmentQuestionPeriod;
    scores: [number, number, number, number];
  }[];
};

export type AssessmentQuestionSpec =
  | SingleSectionAssessmentQuestionSpec
  | BreakdownAssessmentQuestionSpec;

export type TupleWithArity<OutType, InTuple> = {
  [K in keyof InTuple]: OutType;
};

export type AssessmentQuestionProps<Spec = AssessmentQuestionSpec> = {
  questionSpec: Spec;
  questionNumber: number;
  disabled?: boolean;
  supportingText?: string;
  children?: React.ReactNode;
};
