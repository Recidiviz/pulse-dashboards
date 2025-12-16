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

import { z } from "zod";

import { multiIncidentPeriodReportSchema } from "~datatypes";

import {
  BreakdownAssessmentQuestionSpec,
  SingleSectionAssessmentQuestionSpec,
} from "./types";

export function getSingleSectionQuestionIndex(
  question: SingleSectionAssessmentQuestionSpec,
  score: number | null,
): number {
  if (score === null) return -1;

  return question.options.findIndex((option) => option.score === score) ?? -1;
}

export function getBreakdownSectionQuestionIndex(
  section: BreakdownAssessmentQuestionSpec["sections"][number],
  reports: z.output<typeof multiIncidentPeriodReportSchema>,
): number {
  const { period } = section;
  const report = reports.find(
    (r) => r.incidentTimePeriod === `${period} months`,
  );

  return Math.min(report?.numIncidents ?? 0, 3);
}

export function getSingleSectionQuestionScore(
  question: SingleSectionAssessmentQuestionSpec,
  selection: number | undefined,
): number {
  if (selection === undefined || selection === -1) return 0;

  return question.options[selection]?.score ?? 0;
}

export function getBreakdownSectionScore(
  section: BreakdownAssessmentQuestionSpec["sections"][number],
  selection: number | undefined,
): number {
  if (selection === undefined || selection === -1) return 0;

  return section.scores[selection] ?? 0;
}
