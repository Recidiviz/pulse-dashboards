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
  formatMonthAndYear,
  getRecordDate,
  OverTimeMetric as SharedOverTimeMetric,
  TimeSeriesDataRecord,
} from "~shared-pathways";
import { formatDate } from "~utils";

import { downloadChartAsData } from "../../utils/downloads/downloadData";
import CoreStore from "../CoreStore";
import {
  BaseNewMetricConstructorProps,
  generateStaffNewMetricOptions,
} from "./generateStaffNewMetricOptions";

export default class OverTimeMetric extends SharedOverTimeMetric {
  readonly rootStore: CoreStore;

  constructor(props: BaseNewMetricConstructorProps) {
    super(generateStaffNewMetricOptions(props));
    this.rootStore = props.rootStore;

    makeObservable<OverTimeMetric>(this, {
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

    this.dataSeries.forEach((d: TimeSeriesDataRecord) => {
      data.push({
        Population: Math.round(d.count),
        "3-month rolling average": Math.round(d.avg90day),
      });

      labels.push(formatMonthAndYear(getRecordDate(d)));
    });

    datasets.push({ data, label: "" });

    return {
      chartDatasets: datasets,
      chartLabels: labels,
      chartId: this.chartTitle,
      dataExportLabel: "Month",
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
      lastUpdatedOn: formatDate(OverTimeMetric.mostRecentDate(this.allRecords)),
      methodologyContent: this.methodology,
    });
  }
}
