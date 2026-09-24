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

import { subMonths } from "date-fns";

import {
  BreakdownAssessmentQuestionPeriod,
  isTrusteeAssessmentComplete,
  TrusteeFormSchema,
  UsTnReclassification2026FormInformation,
} from "~datatypes";

import { formatWorkflowsDateMonthYear } from "../../../../../utils";
import {
  BLOCKED_DOWNLOAD_MISSING_FIELDS_TOOLTIP,
  BLOCKED_DOWNLOAD_MISSING_HEARING_DATE,
  BLOCKED_DOWNLOAD_TRUSTEE_INCOMPLETE,
} from "./copy";

export const RCAF_V2_CUTOFF_DATE = new Date("2026-05-26");

export function cafBlockedDownloadTooltip(
  totalScore: number | undefined,
  hearingDate: string | undefined,
): string | undefined {
  if (totalScore === undefined) return BLOCKED_DOWNLOAD_MISSING_FIELDS_TOOLTIP;
  if (!hearingDate || hearingDate.length === 0)
    return BLOCKED_DOWNLOAD_MISSING_HEARING_DATE;
  return undefined;
}

/**
 * Why the packet cannot be downloaded yet, or undefined when it can. Shared by
 * both RCAF versions, which differ only in which form version is the wrong one.
 */
export function reclassificationBlockedDownloadTooltip({
  totalScore,
  hearingDate,
  formData,
  trusteeAssessmentRequired,
  wrongVersionTooltip,
}: {
  totalScore: number | undefined;
  hearingDate: string | undefined;
  formData: Partial<TrusteeFormSchema>;
  trusteeAssessmentRequired: boolean;
  /** Set when this form is the wrong version for its date; it outranks the rest. */
  wrongVersionTooltip: string | undefined;
}): string | undefined {
  if (wrongVersionTooltip) return wrongVersionTooltip;

  const cafTooltip = cafBlockedDownloadTooltip(totalScore, hearingDate);
  if (cafTooltip) return cafTooltip;

  // Approvals are recorded on paper, so only the parts answerable in the app
  // count toward completeness.
  return trusteeAssessmentRequired && !isTrusteeAssessmentComplete(formData)
    ? BLOCKED_DOWNLOAD_TRUSTEE_INCOMPLETE
    : undefined;
}

type Endpoint<T extends string> = T extends `${infer A}-${infer B}`
  ? A | B
  : never;
type MonthsAgo = Endpoint<BreakdownAssessmentQuestionPeriod>;

const ENDPOINT_TO_RECORD_KEY = {
  "6": "sixMonthsAgo",
  "12": "twelveMonthsAgo",
  "18": "eighteenMonthsAgo",
  "36": "thirtySixMonthsAgo",
  "60": "sixtyMonthsAgo",
} satisfies Record<
  Exclude<MonthsAgo, "0">,
  keyof UsTnReclassification2026FormInformation
>;

function dateForPeriodEndpoint(
  endpoint: MonthsAgo,
  record: Record<string, Date>,
): Date {
  if (endpoint === "0") {
    return new Date();
  }
  return record[ENDPOINT_TO_RECORD_KEY[endpoint]];
}

export function dateWindowString(
  period: BreakdownAssessmentQuestionPeriod,
  record: Record<string, Date>,
): string {
  // extract endpoints from period string. e.g. "6-12" -> ["6", "12"]
  const endpoints = period.split("-") as [MonthsAgo, MonthsAgo];

  // turn each endpoint into a Date
  const endpointDates = endpoints.map((e) => dateForPeriodEndpoint(e, record));

  // the near endpoint of every window except "0" is a stored boundary field
  // marking the end of the *previous* window, so shift it back a month to
  // avoid overlap. "0" is just today's date and needs no adjustment.
  if (endpoints[0] !== "0") {
    endpointDates[0] = subMonths(endpointDates[0], 1);
  }

  // turn into strings, reverse to put older date first, and join with a dash
  return endpointDates.map(formatWorkflowsDateMonthYear).reverse().join(" - ");
}
