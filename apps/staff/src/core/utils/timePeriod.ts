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

import { differenceInMonths } from "date-fns";

export function formatTimePeriodLabel(months: string): string {
  const numMonths = Number(months);
  if (Number.isNaN(numMonths) || !months) return "";
  if (numMonths === 1) return "1 month";
  if (numMonths < 12) return `${months} months`;
  if (numMonths === 12) return "1 year";
  return `${numMonths / 12} years`;
}

/**
 * Represents difference from current date as text. Durations under two years
 * represented as months, otherwise truncated to full years.
 */
export function formatRelativeToNow(start: Date): string {
  const months = differenceInMonths(new Date(), start);
  if (months < 24) return `${months} months`;
  return `${Math.floor(months / 12)} years`;
}
