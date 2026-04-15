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
  downloadChartAsData,
  FILTER_TYPES,
  MetricRecord,
  NewBackendRecord,
  OverTimeMetric,
  PATHWAYS_SECTIONS,
  PathwaysMetricStore,
  PopulationFilterValues,
  SnapshotDataRecord,
  SnapshotMetric,
} from "~shared-pathways";
import { formatDate, ZipFileEntry } from "~utils";

import { callPublicPathwaysApi } from "../api/metricsClient";
import { PUBLIC_PATHWAYS_TENANT } from "../tenantId";
import type { RootStore } from "./RootStore";

export default class MetricsStore implements PathwaysMetricStore {
  private readonly rootStore: RootStore;

  page = "prison";

  constructor({ rootStore }: { rootStore: RootStore }) {
    makeAutoObservable(this, { section: false });
    this.rootStore = rootStore;
  }

  get section(): string {
    return this.rootStore.section;
  }

  get filters(): PopulationFilterValues {
    return this.rootStore.filtersStore.filters;
  }

  get currentTenantId(): string {
    return PUBLIC_PATHWAYS_TENANT;
  }

  get filtersStore(): PathwaysMetricStore["filtersStore"] {
    return this.rootStore.filtersStore;
  }

  async download(): Promise<void> {
    const metric = this.current;
    const { downloadableData } = metric;
    if (!downloadableData) return;

    let methodologyPDF: ZipFileEntry | null = null;
    try {
      const response = await fetch(
        "/New York State DOCCS Dashboard Methodology.pdf",
      );
      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        methodologyPDF = {
          name: "New York State DOCCS Dashboard Methodology.pdf",
          data: arrayBuffer,
          type: "binary",
        };
      }
    } catch {
      // methodology PDF is optional; proceed without it if unavailable
    }

    const isOverTime = metric instanceof OverTimeMetric;
    const dateInPopulationValues =
      this.rootStore.filtersStore.filters[FILTER_TYPES.DATE_IN_POPULATION];
    const dateInPopulation =
      !isOverTime && dateInPopulationValues?.length === 1
        ? dateInPopulationValues[0]
        : undefined;

    let { filtersDescription } = this.rootStore.filtersStore;
    if (!isOverTime && dateInPopulation && dateInPopulation !== "ALL") {
      const [year, month, day] = dateInPopulation.split("-").map(Number);
      const formattedDate = formatDate(
        new Date(year, month - 1, day),
        "MM-dd-yyyy",
      );
      filtersDescription = filtersDescription.trimEnd();
      filtersDescription += `;\nAs of: ${formattedDate}\n`;
    }

    return downloadChartAsData({
      fileContents: [downloadableData],
      chartTitle: metric.chartTitle,
      filters: filtersDescription,
      includeFiltersDescriptionInCSV: true,
      methodologyPDF,
      dateInPopulation,
    });
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
        [PATHWAYS_SECTIONS["countByChargeCountyCode"]]:
          this.prisonPopulationByChargeCountyCode,
        [PATHWAYS_SECTIONS["countByOffenseType"]]:
          this.prisonPopulationByOffenseType,
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
      isHorizontal: true,
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

  get prisonPopulationByChargeCountyCode(): SnapshotMetric {
    return new SnapshotMetric({
      id: "prisonPopulationByChargeCountyCode",
      endpoint: "PrisonPopulationByDimensionCount",
      store: this,
      fetchMetrics: this.fetchMetrics,
      accessor: "chargeCountyCode",
      enableMetricModeToggle: true,
      isHorizontal: true,
    });
  }

  get prisonPopulationByOffenseType(): SnapshotMetric {
    return new SnapshotMetric({
      id: "prisonPopulationByOffenseType",
      endpoint: "PrisonPopulationByDimensionCount",
      store: this,
      fetchMetrics: this.fetchMetrics,
      accessor: "offenseType",
      enableMetricModeToggle: true,
      rotateLabels: true,
    });
  }
}
