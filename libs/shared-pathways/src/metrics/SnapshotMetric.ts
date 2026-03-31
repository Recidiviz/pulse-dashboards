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
import { sumBy } from "lodash/fp";
import map from "lodash/fp/map";
import { computed, makeObservable } from "mobx";

import { PopulationFilterLabels } from "../filters";
import {
  DefaultOffenseTypeOrder,
  DefaultSupervisionLevelOrder,
  DownloadableData,
  DownloadableDataset,
  OrderKeys,
  SnapshotDataRecord,
} from "../types";
import { convertLengthOfStay } from "../utils";
import PathwaysNewBackendMetric from "./PathwaysNewBackendMetric";
import { SharedMetricConstructorOptions } from "./types";

export default class SnapshotMetric extends PathwaysNewBackendMetric<SnapshotDataRecord> {
  accessor: keyof SnapshotDataRecord;

  constructor(
    props: SharedMetricConstructorOptions<SnapshotDataRecord> & {
      accessor: keyof SnapshotDataRecord;
    },
  ) {
    super(props);

    makeObservable<SnapshotMetric>(this, {
      totalCount: computed,
      dataSeries: computed,
      downloadableData: computed,
    });

    this.accessor = props.accessor;
  }

  get totalCount(): number | undefined {
    if (!this.store || !this.allRecords) return undefined;
    return sumBy("count", this.allRecords);
  }

  get supervisionLevelOrder(): OrderKeys | undefined {
    if (!this.store?.currentTenantId) return undefined;
    return DefaultSupervisionLevelOrder;
  }

  get offenseTypeOrder(): OrderKeys | undefined {
    if (!this.store?.currentTenantId) return undefined;
    return DefaultOffenseTypeOrder;
  }

  get dataSeries(): SnapshotDataRecord[] {
    const { totalCount } = this;
    if (!totalCount) return [];

    const result = map((record: SnapshotDataRecord) => {
      return {
        ...record,
        lengthOfStay: convertLengthOfStay(record),
        populationProportion: ((record.count * 100) / totalCount).toFixed(),
      };
    }, this.allRecords);

    return result as SnapshotDataRecord[];
  }

  get dataSeriesForDiffing(): SnapshotDataRecord[] {
    return this.dataSeries.map((record: SnapshotDataRecord) => {
      return {
        ...record,
        lastUpdated: this.lastUpdated,
      };
    });
  }

  get isEmpty(): boolean {
    return !this.totalCount;
  }

  get downloadableData(): DownloadableData {
    if (!this.dataSeries) return undefined;

    const datasets = [] as DownloadableDataset[];
    const data: Record<string, number>[] = [];
    const labels: string[] = [];

    this.dataSeries.forEach((d: SnapshotDataRecord) => {
      data.push({
        Count: Math.round(d.count),
      });

      const filterValue = d[this.accessor];
      if (filterValue) {
        labels.push(
          this.store.filtersStore.getFilterLabel(
            this.accessor as keyof PopulationFilterLabels,
            filterValue.toString(),
          ) || filterValue.toString(),
        );
      }
    });

    datasets.push({ data, label: "" });

    const filterOption =
      this.store.filtersStore.filterOptions[
        this.accessor as keyof PopulationFilterLabels
      ];

    return {
      chartDatasets: datasets,
      chartLabels: labels,
      chartId: this.chartTitle,
      dataExportLabel:
        filterOption?.title ||
        this.accessor
          .toString()
          .replace(/([A-Z])/g, " $1")
          .replace(/^./, (s) => s.toUpperCase())
          .trim(),
    };
  }

  override getQueryParams(): URLSearchParams {
    const queryParams = super.getQueryParams();
    queryParams.append("group", snakeCase(this.accessor.toString()));
    queryParams.delete(`filters[${snakeCase(this.accessor.toString())}]`);
    return queryParams;
  }
}
