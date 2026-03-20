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

import isSameDay from "date-fns/isSameDay";

import { useCommonTranslations } from "../namespaces/common/useCommonTranslations";

/**
 * Return a locale-aware string representing the distance between the given date and
 * today. The value is returned in either months & days or years & months,
 * depending on how far the date is from today.
 *
 * For convenience this hook returns undefined if given an undefined date.
 */
export function useDateDistanceTranslation(
  date: Date | undefined,
): string | undefined {
  const { t } = useCommonTranslations();

  if (!date) return;

  const today = new Date();
  const isToday = isSameDay(date, today);

  // Determine which distance translation to use based on whether date is today/past/future
  const distanceTranslations = t(($) => $.dateDistanceFromToday, {
    date,
    returnObjects: true,
  });
  if (isToday) {
    return distanceTranslations.now;
  } else if (date < today) {
    return distanceTranslations.past;
  } else {
    return distanceTranslations.future;
  }
}
