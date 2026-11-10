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

import { isValid, parse } from "date-fns";

import {
  isBeyondReleaseDatePastGracePeriod,
  RELEASE_DATE_PAST_GRACE_PERIOD_DAYS,
  toCalendarDay,
} from "~@idaho-th/shared";

export const RELEASE_DATE_IN_PAST = `Release date can't be more than ${RELEASE_DATE_PAST_GRACE_PERIOD_DAYS} days in the past.`;
export const RELEASE_DATE_INVALID = "Enter a valid date.";
export const RELEASE_DATE_INCOMPLETE = "Enter a complete date.";

export interface ReleaseDateValidationResult {
  isValid: boolean;
  reason: string | null;
}

const VALID: ReleaseDateValidationResult = { isValid: true, reason: null };

type ReleaseDateRule = (date: string) => string | null;

const isIncomplete: ReleaseDateRule = (date) =>
  toCalendarDay(date) === null ? RELEASE_DATE_INCOMPLETE : null;

// toCalendarDay only confirms MM/dd/yyyy shape (e.g. "13/45/2026" still
// matches it) — isValid is what catches a month or day that doesn't exist.
const isRealCalendarDate: ReleaseDateRule = (date) =>
  isValid(parse(date, "MM/dd/yyyy", new Date())) ? null : RELEASE_DATE_INVALID;

const isNotTooFarInThePast: ReleaseDateRule = (date) => {
  const day = toCalendarDay(date);
  return day !== null && isBeyondReleaseDatePastGracePeriod(day)
    ? RELEASE_DATE_IN_PAST
    : null;
};

// New rules append here, in the order they should be reported.
const RELEASE_DATE_RULES: ReleaseDateRule[] = [
  isIncomplete,
  isRealCalendarDate,
  isNotTooFarInThePast,
];

/**
 * Runs the release-date rules and reports the first one a date fails.
 * An unchanged or empty date is reported valid without running the rules —
 * only a date the case manager actually entered is judged.
 */
export const validateReleaseDate = (
  date: string | null,
  hasDateChanged: boolean,
): ReleaseDateValidationResult => {
  if (!hasDateChanged || !date) return VALID;

  for (const rule of RELEASE_DATE_RULES) {
    const reason = rule(date);
    if (reason) return { isValid: false, reason };
  }
  return VALID;
};
