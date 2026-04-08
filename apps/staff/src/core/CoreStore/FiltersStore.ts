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

import { action, computed, makeObservable, observable } from "mobx";

import { isDemoMode, isOfflineMode } from "~client-env-utils";
import { FiltersStoreBase, PathwaysTenantId } from "~shared-pathways";

import { isPathwaysTenantId } from "../../RootStore/types";
import type CoreStore from ".";
import { enabledFilterOptionsByTenant } from "./enabledFilters";

export default class FiltersStore extends FiltersStoreBase {
  rootStore: CoreStore;

  constructor({ rootStore }: { rootStore: CoreStore }) {
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
      isUsingDemoData: computed,
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

  override get isUsingDemoData(): boolean {
    return isDemoMode() || isOfflineMode();
  }

  get metric() {
    return this.rootStore.metricsStore.current;
  }

  get pathwaysTenantId(): PathwaysTenantId | undefined {
    if (isPathwaysTenantId(this.rootStore.currentTenantId)) {
      return this.rootStore.currentTenantId;
    }
  }

  get enabledFilterOptionsByTenant() {
    return enabledFilterOptionsByTenant;
  }
}
