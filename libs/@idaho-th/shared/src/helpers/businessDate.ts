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

/**
 * The timezone whose calendar date the app treats as "today" for business
 * rules. Deliberately defined here rather than reusing the Intercom digest's
 * own zone constant, so a change to digest scheduling cannot silently move
 * date rules like the release-date floor.
 */
export const IDAHO_TH_TIME_ZONE = "America/Denver";

const ISO_DAY = /^(\d{4})-(\d{2})-(\d{2})(?:T.*)?$/;
const US_DAY = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;

/** `en-CA` renders `yyyy-MM-dd`, which sorts lexicographically by date. */
const businessDayFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: IDAHO_TH_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Today's calendar date in the app's business timezone, as `yyyy-MM-dd`. */
export const businessToday = (now: Date = new Date()): string =>
  businessDayFormatter.format(now);

/**
 * Normalizes a `MM/dd/yyyy` or ISO date string to `yyyy-MM-dd`.
 * Returns null when the value is empty or not in either shape.
 */
export const toCalendarDay = (
  value: string | null | undefined,
): string | null => {
  if (!value) return null;
  const trimmed = value.trim();

  const iso = ISO_DAY.exec(trimmed);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  const us = US_DAY.exec(trimmed);
  if (!us) return null;
  return `${us[3]}-${us[1].padStart(2, "0")}-${us[2].padStart(2, "0")}`;
};

/**
 * True when `day` (a `yyyy-MM-dd` string) falls before today in the business
 * timezone. Both sides are strings, so the comparison involves no `Date`
 * arithmetic — neither the daylight-saving hour nor the gap between
 * UTC midnight and local midnight can shift the answer by a day.
 */
export const isPastBusinessDay = (day: string, now?: Date): boolean =>
  day < businessToday(now);

/** How many days before today a release date may still be moved to. */
export const RELEASE_DATE_PAST_GRACE_PERIOD_DAYS = 7;

/**
 * Shifts a `yyyy-MM-dd` calendar day by `days` (negative moves it earlier).
 * Pure calendar arithmetic done in UTC — safe here because `day` already
 * carries no timezone information of its own.
 */
const shiftCalendarDay = (day: string, days: number): string => {
  const [year, month, date] = day.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, date + days))
    .toISOString()
    .slice(0, 10);
};

/**
 * The earliest calendar day (`yyyy-MM-dd`) a release date may be moved to:
 * up to `RELEASE_DATE_PAST_GRACE_PERIOD_DAYS` days before today, measured in
 * the business timezone.
 */
export const earliestAllowedReleaseDay = (now?: Date): string =>
  shiftCalendarDay(businessToday(now), -RELEASE_DATE_PAST_GRACE_PERIOD_DAYS);

/**
 * True when `day` (a `yyyy-MM-dd` string) falls more than
 * `RELEASE_DATE_PAST_GRACE_PERIOD_DAYS` days before today in the business
 * timezone — i.e. further back than a release date is allowed to move.
 */
export const isBeyondReleaseDatePastGracePeriod = (
  day: string,
  now?: Date,
): boolean => day < earliestAllowedReleaseDay(now);
