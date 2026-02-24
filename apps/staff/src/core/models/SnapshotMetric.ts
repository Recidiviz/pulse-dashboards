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

import { computed, makeObservable } from "mobx";

import { isDemoMode, isOfflineMode } from "~client-env-utils";
import {
  DownloadableData,
  DownloadableDataset,
  PopulationFilterLabels,
  SnapshotDataRecord,
  SnapshotMetric as SharedSnapshotMetric,
} from "~shared-pathways";

import { toTitleCase } from "../../utils";
import { downloadChartAsData } from "../../utils/downloads/downloadData";
import CoreStore from "../CoreStore";
import {
  BaseNewMetricConstructorProps,
  generateStaffNewMetricOptions,
} from "./generateStaffNewMetricOptions";

export default class SnapshotMetric extends SharedSnapshotMetric {
  readonly rootStore: CoreStore;

  constructor(
    props: BaseNewMetricConstructorProps & {
      accessor: keyof SnapshotDataRecord;
    },
  ) {
    super({
      ...generateStaffNewMetricOptions<SnapshotDataRecord>(props),
      accessor: props.accessor,
    });
    this.rootStore = props.rootStore;

    makeObservable<SnapshotMetric>(this, {
      downloadableData: computed,
    });

    this.download = this.download.bind(this);
  }

  override get tenantId(): string | undefined {
    return isOfflineMode() || isDemoMode()
      ? undefined
      : this.store.currentTenantId;
  }

  get downloadableData(): DownloadableData | undefined {
    if (!this.dataSeries) return undefined;

    const datasets = [] as DownloadableDataset[];
    const data: Record<string, number>[] = [];
    const labels: string[] = [];

    this.dataSeries.forEach((d: SnapshotDataRecord) => {
      data.push({
        Count: Math.round(d.count),
      });

      if (this.rootStore?.filtersStore) {
        const filterValue = d[this.accessor];
        if (filterValue) {
          labels.push(
            this.rootStore?.filtersStore.getFilterLabel(
              this.accessor as keyof PopulationFilterLabels,
              filterValue.toString(),
            ) || filterValue.toString(),
          );
        }
      }
    });

    datasets.push({ data, label: "" });
    return {
      chartDatasets: datasets,
      chartLabels: labels,
      chartId: this.chartTitle,
      dataExportLabel:
        this.rootStore?.filtersStore.filterOptions?.[
          this.accessor as keyof PopulationFilterLabels
        ]?.title || toTitleCase(this.accessor.toString()),
    };
  }

  async download(): Promise<void> {
    return downloadChartAsData({
      fileContents: [this.downloadableData],
      chartTitle: this.chartTitle,
      shouldZipDownload: true,
      getTokenSilently: this.rootStore?.userStore.getTokenSilently,
      includeFiltersDescriptionInCSV: true,
      filters: {
        filtersDescription: this.rootStore?.filtersStore.filtersDescription,
      },
      methodologyContent: this.methodology,
    });
  }
}
