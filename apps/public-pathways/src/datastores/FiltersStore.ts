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

import { action, computed, makeObservable, observable } from "mobx";

import {
  FiltersStoreBase,
  FilterType,
  PathwaysTenantId,
} from "~shared-pathways";

import { enabledFilterOptionsByTenant } from "./enabledFilters";
import {
  disabledFiltersForEventType,
  singleEventTypeForSection,
} from "./eventTypes";
import type { RootStore } from "./RootStore";

export default class FiltersStore extends FiltersStoreBase {
  private readonly rootStore: RootStore;

  constructor({ rootStore }: { rootStore: RootStore }) {
    super();
    this.rootStore = rootStore;

    makeObservable(this, {
      filters: observable,
      metricMode: observable,
      timePeriodLabel: computed,
      setFilters: action,
      setMetricMode: action,
      resetFilters: action,
      clearDisabledFilters: action,
      metric: computed,
      pathwaysTenantId: computed,
      filterOptions: computed,
      enabledFilters: computed,
      filtersLabels: computed,
      sortedFilters: computed,
      filtersDescription: computed,
      enabledFiltersDefaultQueryString: computed,
      currentMetricMode: computed,
      monthRange: computed,
    });

    this.resetFilters = this.resetFilters.bind(this);
    this.getFilterLabel = this.getFilterLabel.bind(this);
    this.getFilterLongLabel = this.getFilterLongLabel.bind(this);
  }

  // --- Implements abstract members ---

  get metric() {
    return this.rootStore.metricsStore.current;
  }

  get pathwaysTenantId(): PathwaysTenantId {
    return this.rootStore.currentTenantId;
  }

  get enabledFilterOptionsByTenant() {
    return enabledFilterOptionsByTenant;
  }

  /**
   * Leaves out the filters that describe an event type the chart does not
   * count. A section that counts one event type decides this itself, so
   * "Releases by type" never lists an admission type even while the combined
   * view is selected. Any other section follows the selected event type.
   */
  protected override isFilterListedInDescription(
    filterType: FilterType,
  ): boolean {
    const eventTypeInView =
      singleEventTypeForSection(this.rootStore.section) ??
      this.rootStore.eventType;
    return (
      super.isFilterListedInDescription(filterType) &&
      !(filterType in disabledFiltersForEventType(eventTypeInView))
    );
  }
}
