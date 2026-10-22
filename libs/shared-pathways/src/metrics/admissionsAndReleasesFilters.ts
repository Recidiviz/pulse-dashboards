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

import { snakeCase } from "lodash";

import { PopulationFilterValues } from "../filters";

/**
 * The Admissions & Releases rules a shared metric does not know about. Some
 * filters describe only one event type: an admission has an admission type,
 * but a release does not. Unchecking every option of such a filter removes
 * that event type and leaves the other, so there is still data to show.
 */
type EventSpecificFilterState = {
  /** The reader's current selection for each filter. */
  filterValues: PopulationFilterValues;
  /** The filters the metric sends. */
  enabledFilters: readonly string[];
  /** The filters that describe only one event type. */
  eventSpecificFilters: readonly string[];
};

const isCleared = (values: readonly string[] | undefined) =>
  Array.isArray(values) && values.length === 0;

/**
 * Returns true if the reader cleared every option of a filter that describes
 * every record, so no record can match. A cleared event-specific filter does
 * not count, because the other event type still matches.
 */
export function hasClearedFilterForEveryRecord({
  filterValues,
  enabledFilters,
  eventSpecificFilters,
}: EventSpecificFilterState): boolean {
  return enabledFilters.some(
    (filter) =>
      !eventSpecificFilters.includes(filter) &&
      isCleared(filterValues[filter as keyof PopulationFilterValues]),
  );
}

/**
 * Adds one empty value for each event-specific filter with every option
 * cleared. The shared query leaves a cleared filter out, which the backend
 * reads as "no filter"; an empty value means "no option picked" instead. A
 * query string cannot carry an empty list.
 */
export function appendClearedEventSpecificFilters(
  queryParams: URLSearchParams,
  {
    filterValues,
    enabledFilters,
    eventSpecificFilters,
  }: EventSpecificFilterState,
): void {
  enabledFilters.forEach((filter) => {
    if (
      eventSpecificFilters.includes(filter) &&
      isCleared(filterValues[filter as keyof PopulationFilterValues])
    ) {
      queryParams.append(`filters[${snakeCase(filter)}]`, "");
    }
  });
}
