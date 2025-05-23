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

import { action, computed, makeObservable, observable, reaction } from "mobx";

import { matchesAllFilters } from "~staff-shared-server";

import {
  DISTRICT,
  LEVEL_1_SUPERVISION_LOCATION,
  LEVEL_2_SUPERVISION_LOCATION,
} from "../../utils/constants";
import BaseDataStore from "./BaseDataStore";

export const CHARTS = {
  District: {
    name: "District",
    file: "revocations_matrix_distribution_by_district",
    skippedFilters: [
      DISTRICT,
      LEVEL_1_SUPERVISION_LOCATION,
      LEVEL_2_SUPERVISION_LOCATION,
    ],
  },
  Officer: {
    name: "Officer",
    file: "revocations_matrix_distribution_by_officer",
  },
  "Risk level": {
    name: "Risk level",
    file: "revocations_matrix_distribution_by_risk_level",
  },
  Violation: {
    name: "Violation",
    file: "revocations_matrix_distribution_by_violation",
  },
  Gender: {
    name: "Gender",
    file: "revocations_matrix_distribution_by_gender",
    statePopulationFile: "state_gender_population",
  },
  Race: {
    name: "Race",
    file: "revocations_matrix_distribution_by_race",
    statePopulationFile: "state_race_ethnicity_population",
  },
};

const DEFAULT_SELECTED_CHART = "District";

export default class RevocationsChartStore extends BaseDataStore {
  selectedChart = DEFAULT_SELECTED_CHART;

  constructor({ rootStore }) {
    super({
      rootStore,
      file: CHARTS[DEFAULT_SELECTED_CHART].file,
      statePopulationFile: CHARTS[DEFAULT_SELECTED_CHART].statePopulationFile,
      skippedFilters: CHARTS[DEFAULT_SELECTED_CHART].skippedFilters,
    });
    makeObservable(this, {
      selectedChart: observable,
      setSelectedChart: action.bound,
      currentDistricts: computed,
      districtChartData: computed,
    });

    reaction(
      () => this.selectedChart,
      () => {
        super.file = CHARTS[this.selectedChart].file;
        this.fetchData({
          tenantId: this.rootStore.currentTenantId,
        });

        super.statePopulationFile =
          CHARTS[this.selectedChart].statePopulationFile;
        this.fetchStatePopulationData({
          tenantId: this.rootStore.currentTenantId,
        });
      },
    );
  }

  setSelectedChart(chartId) {
    this.selectedChart = chartId;
    this.skippedFilters = CHARTS[chartId].skippedFilters || [];
  }

  get availableChartIds() {
    return this.rootStore.userRestrictionsStore.enabledRevocationsCharts;
  }

  get filteredData() {
    const dataFilter = matchesAllFilters({
      filters: this.filters,
      skippedFilters: this.skippedFilters,
    });
    return this.filterData(this.apiData, dataFilter);
  }

  get districtChartData() {
    const {
      districtIdToLabel,
      districtKeys: { filterByKey },
    } = this.rootStore.districtsStore;

    return this.filteredData.map((data) => {
      return {
        ...data,
        district: districtIdToLabel[data[filterByKey]],
      };
    });
  }

  get currentDistricts() {
    if (this.selectedChart !== CHARTS.District.name) return [];
    const {
      districtIdToLabel,
      districtKeys: { filterKey },
    } = this.rootStore.districtsStore;
    return this.filters[filterKey].map((district) => {
      if (district === "All") return district;
      return districtIdToLabel[district];
    });
  }
}
