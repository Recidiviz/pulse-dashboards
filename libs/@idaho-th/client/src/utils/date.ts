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

import { format, isValid, parse } from "date-fns";
import moment from "moment-timezone";

const MM_DD_YYYY = /^\d{2}\/\d{2}\/\d{4}$/;

/**
 * Re-anchors a UTC-midnight calendar date (how the backend persists day-only
 * values like the expected release date) to local midnight, so local-time
 * formatters don't shift it a day back for viewers west of UTC.
 * `MM/dd/yyyy` strings are already timezone-less and parsed as-is.
 */
export const toCalendarDate = (value: Date | string): Date | null => {
  if (typeof value === "string" && MM_DD_YYYY.test(value)) {
    return parse(value, "MM/dd/yyyy", new Date());
  }
  const instant = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(instant.getTime())) return null;
  return new Date(
    instant.getUTCFullYear(),
    instant.getUTCMonth(),
    instant.getUTCDate(),
  );
};

/** Timezone-safe formatting for day-only values. */
export const formatCalendarDate = (
  value: Date | string | null | undefined,
  pattern = "MMMM d, yyyy",
): string => {
  if (!value) return "";
  const date = toCalendarDate(value);
  return date && isValid(date) ? format(date, pattern) : "";
};

/** Parses without re-anchoring, preserving the original instant. */
const parseInstant = (value: Date | string): Date => {
  if (value instanceof Date) return value;
  if (MM_DD_YYYY.test(value)) return parse(value, "MM/dd/yyyy", new Date());
  return new Date(value);
};

/**
 * For real timestamps (e.g. `createdAt`) — reads local components, which is
 * correct for a moment in time. Use {@link formatCalendarDate} for day-only values.
 */
export const formatTimestamp = (
  value: Date | string | null | undefined,
  pattern = "MMMM d, yyyy",
): string => {
  if (!value) return "";
  const date = parseInstant(value);
  return isValid(date) ? format(date, pattern) : "";
};

const LOCAL_TIME_ZONE = moment.tz.guess();

/** Viewer's local-timezone timestamp with abbreviation, e.g. "Apr 23, 2026, 14:05 PKT". */
export const formatResponseTimestamp = (date: Date): string => {
  return moment.tz(date, LOCAL_TIME_ZONE).format("MMM D, YYYY, HH:mm z");
};
