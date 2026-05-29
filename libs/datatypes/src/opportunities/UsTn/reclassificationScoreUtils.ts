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

import { z } from "zod";

import { UsTnReclassification2026DraftData } from "./UsTnReclassification2026Policy";
import { multiIncidentPeriodReportSchema, TrusteeFormSchema } from "./utils";

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

export type BreakdownAssessmentQuestionSpecV2 = {
  title: string;
  type: "BREAKDOWNV2";
  sections: {
    period: BreakdownAssessmentQuestionPeriod;
    multiplier: number;
  }[];
};

export type AssessmentQuestionSpec =
  | SingleSectionAssessmentQuestionSpec
  | BreakdownAssessmentQuestionSpec
  | BreakdownAssessmentQuestionSpecV2;

export type TupleWithArity<OutType, InTuple> = {
  [K in keyof InTuple]: OutType;
};

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
): number | undefined {
  if (selection === undefined) return undefined;
  if (selection === -1) return 0;

  return question.options[selection]?.score ?? 0;
}

export function getBreakdownSectionScore(
  section: BreakdownAssessmentQuestionSpec["sections"][number],
  selection: number | undefined,
): number {
  if (selection === undefined || selection === -1) return 0;

  return section.scores[selection] ?? 0;
}

export function getV2BreakdownSectionQuestionCount(
  section: BreakdownAssessmentQuestionSpecV2["sections"][number],
  reports: z.output<typeof multiIncidentPeriodReportSchema>,
): number {
  const { period } = section;
  const report = reports.find(
    (r) => r.incidentTimePeriod === `${period} months`,
  );

  return report?.numIncidents ?? 0;
}

export function getBreakdownSectionScoreV2(
  section: BreakdownAssessmentQuestionSpecV2["sections"][number],
  disciplinaryCount: number | undefined,
): number {
  const { period, multiplier } = section;
  if (disciplinaryCount === undefined) return 0;
  if (disciplinaryCount === 0 && period === "0-6") return -1;
  return disciplinaryCount * multiplier;
}

export function isEligibleForTrusteeStatus(
  formData: Partial<TrusteeFormSchema>,
): boolean {
  return [
    formData.trusteeHas10YearsOrLessRemaining,
    formData.trusteeNoAssaultiveDisciplinaryWithSeriousInjury,
    formData.trusteeNoEscapeFromLowTrusteePast5Years,
    formData.trusteeNoEscapeFromMediumCloseMaxPast10Years,
    formData.trusteeNoViolentFelonyConvictionPast5YearsIncarceration,
    formData.trusteeNotConvictedOfViolentOffenseOr12MonthsInCustody,
    formData.trusteeNotScoredHighForViolence,
    formData.trusteeNotServingForSexualOffense,
    formData.trusteeNoFelonyDetainers,
    formData.trusteeNoPendingFelonyCharges,
    formData.trusteeNoPendingImmigrationActions,
    formData.trusteeWardenHasApproved,
  ].every((criterion) => criterion === "true");
}

export function showTrusteeChecklist(
  totalText: string,
  formData: Partial<UsTnReclassification2026DraftData>,
): boolean {
  // Only show the trustee checklist if all three questions at top are true
  // (no 1st degree, 10 years or less, and not serving life) and the person
  // has been scored or overridden to "LOW"
  return (
    formData.trusteeNotConvictedOfFirstDegreeMurder === "true" &&
    formData.trusteeHas10YearsOrLessRemaining === "true" &&
    formData.isServingLife === "false" &&
    formData.trusteeNotServingForSexualOffense === "true" &&
    (totalText === "LOW" ||
      formData.counselorRecommendedCustody === "LOW" ||
      formData.recommendationCustodyLevel === "LOW")
  );
}

export function getTotalScore(
  scores: (number | undefined)[],
  upperThresholdForMaxClassification: number,
): number | undefined {
  return scores.every((s) => s !== undefined)
    ? Math.min(
        upperThresholdForMaxClassification + 1,
        scores.reduce((a, b) => a + b, 0),
      )
    : undefined;
}
