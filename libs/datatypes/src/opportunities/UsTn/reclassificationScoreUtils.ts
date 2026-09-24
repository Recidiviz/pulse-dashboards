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

import {
  TRUSTEE_ANNEX_SUB_QUESTION,
  TRUSTEE_CRITERIA,
  TRUSTEE_REQUIREMENT_LABEL,
  TrusteeCriterionKey,
  trusteeCriterionNotMetHeading,
} from "./trusteeCriteria";
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

export type TrusteeOutcomeStatus =
  | "INCOMPLETE"
  | "NOT_ELIGIBLE"
  | "ELIGIBLE"
  | "ELIGIBLE_REQUIRES_AC_APPROVAL";

export type TrusteeOutcome = {
  status: TrusteeOutcomeStatus;
  failedHardBars: TrusteeCriterionKey[];
  failedConditionalCriteria: TrusteeCriterionKey[];
};

export function resolveTrusteeOutcome(
  formData: Partial<TrusteeFormSchema>,
): TrusteeOutcome {
  const failedHardBars: TrusteeCriterionKey[] = [];
  const failedConditionalCriteria: TrusteeCriterionKey[] = [];
  let anyUnanswered = false;

  for (const { key, isHardBar } of TRUSTEE_CRITERIA) {
    const answer = formData[key];

    if (answer === "false") {
      (isHardBar ? failedHardBars : failedConditionalCriteria).push(key);
    } else if (answer !== "true") {
      anyUnanswered = true;
    }
  }

  // Both lists report what was actually answered False. Whether a failure is
  // worth acting on is the caller's decision, made against the status.
  const failures = { failedHardBars, failedConditionalCriteria };

  if (failedHardBars.length > 0) return { status: "NOT_ELIGIBLE", ...failures };

  if (anyUnanswered) return { status: "INCOMPLETE", ...failures };

  if (failedConditionalCriteria.length > 0)
    return { status: "ELIGIBLE_REQUIRES_AC_APPROVAL", ...failures };

  return { status: "ELIGIBLE", ...failures };
}

export type AnnexOutcomeStatus = "INCOMPLETE" | "NOT_ELIGIBLE" | "ELIGIBLE";

export type AnnexOutcome = {
  status: AnnexOutcomeStatus;
  failedCriteria: TrusteeCriterionKey[];
  subQuestionRequired: boolean;
};

/**
 * Resolves Annex housing eligibility, a second outcome independent of Trustee
 * custody: not eligible for Trustee and eligible for Annex is valid.
 */
export function resolveAnnexOutcome(
  formData: Partial<TrusteeFormSchema>,
): AnnexOutcome {
  const { key: subQuestionKey, parentKey } = TRUSTEE_ANNEX_SUB_QUESTION;

  const subQuestionRequired = formData[parentKey] === "false";
  const subQuestionAnswer = subQuestionRequired
    ? formData[subQuestionKey]
    : undefined;

  const failedCriteria: TrusteeCriterionKey[] = [];
  let anyUnanswered = false;

  for (const { key, affectsAnnex } of TRUSTEE_CRITERIA) {
    if (!affectsAnnex) continue;

    const answer = formData[key];

    if (key === parentKey && answer === "false") {
      if (subQuestionAnswer === "false") {
        failedCriteria.push(key);
      } else if (subQuestionAnswer !== "true") {
        anyUnanswered = true;
      }
    } else if (answer === "false") {
      failedCriteria.push(key);
    } else if (answer !== "true") {
      anyUnanswered = true;
    }
  }

  if (failedCriteria.length > 0) {
    return { status: "NOT_ELIGIBLE", failedCriteria, subQuestionRequired };
  }

  return {
    status: anyUnanswered ? "INCOMPLETE" : "ELIGIBLE",
    failedCriteria,
    subQuestionRequired,
  };
}

export type TrusteeSkipState = {
  notRequired: TrusteeCriterionKey[];
  subQuestionNotRequired: boolean;
};

/**
 * Marks unanswered criteria whose answer could no longer change either outcome.
 * The Trustee and Annex ranges resolve independently.
 */
export function resolveTrusteeSkipState(
  formData: Partial<TrusteeFormSchema>,
): TrusteeSkipState {
  const { failedHardBars } = resolveTrusteeOutcome(formData);
  const annexOutcome = resolveAnnexOutcome(formData);

  const trusteeResolved = failedHardBars.length > 0;
  const annexResolved = annexOutcome.status !== "INCOMPLETE";

  const notRequired = TRUSTEE_CRITERIA.filter(({ key, affectsAnnex }) => {
    const answer = formData[key];
    if (answer === "true" || answer === "false") return false;

    // Annex criteria stay required until that outcome is settled too.
    return affectsAnnex ? trusteeResolved && annexResolved : trusteeResolved;
  }).map(({ key }) => key);

  const subQuestionAnswer = formData[TRUSTEE_ANNEX_SUB_QUESTION.key];
  const subQuestionAnswered =
    subQuestionAnswer === "true" || subQuestionAnswer === "false";

  return {
    notRequired,
    // Only matters while it can still decide Annex.
    subQuestionNotRequired:
      !subQuestionAnswered &&
      (!annexOutcome.subQuestionRequired ||
        annexOutcome.failedCriteria.length > 0),
  };
}

/** Plain text of a criterion, with the bold-segment markers removed. */
export function trusteeCriterionPlainText(key: TrusteeCriterionKey): string {
  return (
    TRUSTEE_CRITERIA.find((c) => c.key === key)
      ?.text.split("**")
      .join("") ?? ""
  );
}

/** One paragraph per failed hard bar, phrased as the requirement that was not met. */
export function buildTrusteeDenialReasons(
  formData: Partial<TrusteeFormSchema>,
): string {
  return resolveTrusteeOutcome(formData)
    .failedHardBars.map(
      (key) =>
        `${trusteeCriterionNotMetHeading(key)} ${TRUSTEE_REQUIREMENT_LABEL} ${trusteeCriterionPlainText(key)}`,
    )
    .join("\n\n");
}

export function showTrusteeChecklist(
  totalText: string,
  formData: Partial<UsTnReclassification2026DraftData>,
  trusteeChecklistReworkEnabled = false,
): boolean {
  const scoredOrOverriddenToLow =
    totalText === "LOW" ||
    formData.counselorRecommendedCustody === "LOW" ||
    formData.recommendationCustodyLevel === "LOW";

  // Under the rework criteria 1-3 live inside the checklist, so a False shows
  // as Not eligible rather than hiding the form.
  if (trusteeChecklistReworkEnabled) return scoredOrOverriddenToLow;

  // Only show the trustee checklist if all three questions at top are true
  // (no 1st degree, 10 years or less, and not serving life) and the person
  // has been scored or overridden to "LOW"
  return (
    formData.trusteeNotConvictedOfFirstDegreeMurder === "true" &&
    formData.trusteeHas10YearsOrLessRemaining === "true" &&
    formData.isServingLife === "false" &&
    formData.trusteeNotServingForSexualOffense === "true" &&
    scoredOrOverriddenToLow
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
