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

import { makeAutoObservable } from "mobx";

import {
  EnabledFiltersByMetric,
  MetricRecord,
  NewBackendRecord,
  OverTimeMetric,
  PATHWAYS_SECTIONS,
  PathwaysMetricStore,
  PopulationFilterValues,
  SnapshotDataRecord,
  SnapshotMetric,
} from "~shared-pathways";

import { callPublicPathwaysApi } from "../api/metricsClient";
import { PUBLIC_PATHWAYS_TENANT } from "../tenantId";
import type { RootStore } from "./RootStore";

export default class MetricsStore implements PathwaysMetricStore {
  private readonly rootStore: RootStore;

  page = "prison";

  section = PATHWAYS_SECTIONS["countOverTime"];

  constructor({ rootStore }: { rootStore: RootStore }) {
    makeAutoObservable(this);
    this.rootStore = rootStore;
  }

  get filters(): PopulationFilterValues {
    return this.rootStore.filtersStore.filters;
  }

  get currentTenantId(): string {
    return PUBLIC_PATHWAYS_TENANT;
  }

  get filtersStore(): {
    enabledFilters: EnabledFiltersByMetric;
    monthRange: number;
  } {
    return this.rootStore.filtersStore;
  }

  private fetchMetrics = <R extends MetricRecord>(
    endpoint: string,
    params: URLSearchParams,
    signal: AbortSignal,
  ): Promise<NewBackendRecord<R>> => {
    return callPublicPathwaysApi(
      `public_pathways/${this.currentTenantId}/${endpoint}?${params.toString()}`,
      () => this.rootStore.userStore.getTokenSilently(),
      signal,
    );
  };

  private _map?: Record<string, OverTimeMetric | SnapshotMetric>;

  get map(): Record<string, OverTimeMetric | SnapshotMetric> {
    if (!this._map) {
      this._map = {
        [PATHWAYS_SECTIONS["countOverTime"]]: this.prisonPopulationOverTime,
        [PATHWAYS_SECTIONS["countByLocation"]]: this.prisonFacilityPopulation,
        [PATHWAYS_SECTIONS["countByRace"]]: this.prisonPopulationByRace,
        [PATHWAYS_SECTIONS["countByAgeGroup"]]: this.prisonPopulationByAgeGroup,
        [PATHWAYS_SECTIONS["countByGender"]]: this.prisonPopulationByGender,
        [PATHWAYS_SECTIONS["countBySex"]]: this.prisonPopulationBySex,
        [PATHWAYS_SECTIONS["countByEthnicity"]]:
          this.prisonPopulationByEthnicity,
        [PATHWAYS_SECTIONS["countBySentenceLengthMin"]]:
          this.prisonPopulationBySentenceLengthMin,
        [PATHWAYS_SECTIONS["countBySentenceLengthMax"]]:
          this.prisonPopulationBySentenceLengthMax,
      };
    }
    return this._map;
  }

  get current(): OverTimeMetric | SnapshotMetric {
    return this.map[this.section] ?? this.prisonPopulationOverTime;
  }

  get prisonPopulationOverTime(): OverTimeMetric {
    return new OverTimeMetric({
      id: "prisonPopulationOverTime",
      endpoint: "PrisonPopulationOverTime",
      store: this,
      fetchMetrics: this.fetchMetrics,
    });
  }

  get prisonFacilityPopulation(): SnapshotMetric {
    return new SnapshotMetric({
      id: "prisonFacilityPopulation",
      endpoint: "PrisonPopulationByDimensionCount",
      store: this,
      fetchMetrics: this.fetchMetrics,
      accessor: "facility" as keyof SnapshotDataRecord,
      enableMetricModeToggle: true,
      rotateLabels: true,
      isGeographic: true,
    });
  }

  get prisonPopulationByRace(): SnapshotMetric {
    return new SnapshotMetric({
      id: "prisonPopulationByRace",
      endpoint: "PrisonPopulationByDimensionCount",
      store: this,
      fetchMetrics: this.fetchMetrics,
      accessor: "race" as keyof SnapshotDataRecord,
      enableMetricModeToggle: true,
      rotateLabels: true,
    });
  }

  get prisonPopulationByAgeGroup(): SnapshotMetric {
    return new SnapshotMetric({
      id: "prisonPopulationByAgeGroup",
      endpoint: "PrisonPopulationByDimensionCount",
      store: this,
      fetchMetrics: this.fetchMetrics,
      accessor: "ageGroup" as keyof SnapshotDataRecord,
      enableMetricModeToggle: true,
      rotateLabels: true,
    });
  }

  get prisonPopulationByGender(): SnapshotMetric {
    return new SnapshotMetric({
      id: "prisonPopulationByGender",
      endpoint: "PrisonPopulationByDimensionCount",
      store: this,
      fetchMetrics: this.fetchMetrics,
      accessor: "gender" as keyof SnapshotDataRecord,
      enableMetricModeToggle: true,
      rotateLabels: true,
    });
  }

  get prisonPopulationBySex(): SnapshotMetric {
    return new SnapshotMetric({
      id: "prisonPopulationBySex",
      endpoint: "PrisonPopulationByDimensionCount",
      store: this,
      fetchMetrics: this.fetchMetrics,
      accessor: "sex" as keyof SnapshotDataRecord,
      enableMetricModeToggle: true,
      rotateLabels: true,
    });
  }

  get prisonPopulationByEthnicity(): SnapshotMetric {
    return new SnapshotMetric({
      id: "prisonPopulationByEthnicity",
      endpoint: "PrisonPopulationByDimensionCount",
      store: this,
      fetchMetrics: this.fetchMetrics,
      accessor: "ethnicity" as keyof SnapshotDataRecord,
      enableMetricModeToggle: true,
      rotateLabels: true,
    });
  }

  get prisonPopulationBySentenceLengthMin(): SnapshotMetric {
    return new SnapshotMetric({
      id: "prisonPopulationBySentenceLengthMin",
      endpoint: "PrisonPopulationByDimensionCount",
      store: this,
      fetchMetrics: this.fetchMetrics,
      accessor: "sentenceLengthMin" as keyof SnapshotDataRecord,
      enableMetricModeToggle: true,
      rotateLabels: true,
    });
  }

  get prisonPopulationBySentenceLengthMax(): SnapshotMetric {
    return new SnapshotMetric({
      id: "prisonPopulationBySentenceLengthMax",
      endpoint: "PrisonPopulationByDimensionCount",
      store: this,
      fetchMetrics: this.fetchMetrics,
      accessor: "sentenceLengthMax" as keyof SnapshotDataRecord,
      enableMetricModeToggle: true,
      rotateLabels: true,
    });
  }
}
