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
import {
  appendClearedEventSpecificFilters,
  hasClearedFilterForEveryRecord,
} from "./admissionsAndReleasesFilters";
import SnapshotMetric from "./SnapshotMetric";

type ConstructorOptions = ConstructorParameters<typeof SnapshotMetric>[0] & {
  /** The filters that describe only one event type, e.g. admission type. */
  eventSpecificFilters: readonly string[];
};

/**
 * A bar chart on the Admissions & Releases dashboard. It requests and draws
 * like any SnapshotMetric, with two differences:
 *
 * - The backend applies the chart's own filter. A shared SnapshotMetric drops
 *   it from the request and filters its own bars, which these charts cannot
 *   do: the type charts' bars hold plain values while their options hold
 *   custody status and type together, and the custody status chart draws its
 *   own bars.
 * - Clearing every option of an event-specific filter keeps the other event
 *   type, instead of showing no data.
 */
export default class AdmissionsAndReleasesSnapshotMetric extends SnapshotMetric {
  readonly eventSpecificFilters: readonly string[];

  constructor({ eventSpecificFilters, ...props }: ConstructorOptions) {
    super(props);
    this.eventSpecificFilters = eventSpecificFilters;
  }

  override get hasEmptyFilterSelection(): boolean {
    return hasClearedFilterForEveryRecord(this.eventSpecificFilterState);
  }

  override getQueryParams(): URLSearchParams {
    const queryParams = super.getQueryParams();
    const dimension = snakeCase(this.accessor.toString());
    const ownFilterValues =
      this.store.filters[this.accessor as keyof PopulationFilterValues] ?? [];
    ownFilterValues
      .filter((value) => value !== "ALL")
      .forEach((value) => queryParams.append(`filters[${dimension}]`, value));
    appendClearedEventSpecificFilters(
      queryParams,
      this.eventSpecificFilterState,
    );
    return queryParams;
  }

  private get eventSpecificFilterState() {
    return {
      filterValues: this.store.filters,
      enabledFilters: this.filters.enabledFilters,
      eventSpecificFilters: this.eventSpecificFilters,
    };
  }
}
