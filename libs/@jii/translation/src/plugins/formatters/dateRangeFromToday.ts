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

import {
  differenceInMonths,
  formatDuration,
  intervalToDuration,
  startOfDay,
} from "date-fns";

import { getDateFnsLocale } from "../../utils/date";
import { CachedFormatFunction } from "./types";

/**
 * Formatter that creates a localized date range duration string from a given date to today
 * For shorter durations (< 12 months), shows "X months and Y days".
 * For longer durations, shows "X years and Y months".
 */
export const formatDateRangeFromTodayFormatter: CachedFormatFunction = (
  lng,
  options: { fallbackText?: string; delimiter?: string },
) => {
  const fallbackText = options.fallbackText ?? "";
  const delimiter = options.delimiter;
  const locale = getDateFnsLocale(lng);

  return (value) => {
    if (!value) return fallbackText;

    // Compare at day granularity so the duration is never less than its
    // smallest displayed unit (a day). Without this, a date under 24h away
    // rounds to an empty duration string.
    const today = startOfDay(new Date());
    const target = startOfDay(value);
    const start = target < today ? target : today;
    const end = target < today ? today : target;
    const monthDiff = Math.abs(differenceInMonths(end, start));

    const durationFromExp = intervalToDuration({ start, end });

    const formatOptions: Parameters<typeof formatDuration>[1] = {
      format: monthDiff < 12 ? ["months", "days"] : ["years", "months"],
      locale,
      delimiter: delimiter ?? ", ", // Default to comma + space if no delimiter provided
    };

    return formatDuration(durationFromExp, formatOptions);
  };
};
