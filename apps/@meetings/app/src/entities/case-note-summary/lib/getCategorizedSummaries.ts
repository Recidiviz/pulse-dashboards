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
  CaseNoteInsightsSummary,
  EmploymentSummary,
  HousingSummary,
  PaymentSummary,
} from "../model/types";

function isHousing(
  summary: CaseNoteInsightsSummary,
): summary is HousingSummary {
  return summary.category === "housing";
}

function isEmployment(
  summary: CaseNoteInsightsSummary,
): summary is EmploymentSummary {
  return summary.category === "employment";
}

function isPayments(
  summary: CaseNoteInsightsSummary,
): summary is PaymentSummary {
  return summary.category === "payments";
}

export function getCategorizedSummaries(summaries?: CaseNoteInsightsSummary[]) {
  const housing = summaries?.find(isHousing);
  const employment = summaries?.find(isEmployment);
  const payments = summaries?.find(isPayments);

  if (!housing && !employment && !payments) return null;

  return { housing, employment, payments };
}
