// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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

import { eachMonthOfInterval, startOfMonth, subMonths } from "date-fns";
import { computed, makeObservable } from "mobx";

import { formatDate } from "../../utils";
import { downloadChartAsData } from "../../utils/downloads/downloadData";
import { DownloadableData, DownloadableDataset } from "../PageVitals/types";
import { formatMonthAndYear } from "../PopulationTimeSeriesChart/helpers";
import { TimeSeriesDiffer } from "./backendDiff/TimeSeriesDiffer";
import { BaseMetricConstructorOptions } from "./PathwaysMetric";
import PathwaysNewBackendMetric from "./PathwaysNewBackendMetric";
import { TimeSeriesDataRecord } from "./types";
import { getRecordDate } from "./utils";

export default class OverTimeMetric extends PathwaysNewBackendMetric<TimeSeriesDataRecord> {
  constructor(props: BaseMetricConstructorOptions<TimeSeriesDataRecord>) {
    super(props);

    makeObservable<OverTimeMetric>(this, {
      mostRecentDate: computed,
      dataSeries: computed,
      downloadableData: computed,
    });

    this.download = this.download.bind(this);
    this.differ = new TimeSeriesDiffer();
  }

  get dataSeries(): TimeSeriesDataRecord[] {
    if (!this.rootStore || !this.allRecords?.length) return [];
    const { monthRange } = this.rootStore.filtersStore;
    return this.extrapolateRecordsForRange(monthRange);
  }

  get dataSeriesForDiffing(): TimeSeriesDataRecord[] {
    return this.dataSeries;
  }

  get mostRecentDate(): Date {
    const { allRecords } = this;

    if (!allRecords || allRecords.length === 0) {
      return new Date(9999, 11, 31);
    }

    // Records are sorted by date on the backend in order to calculate 90 day averages, so we don't
    // need to search through all of them.
    return getRecordDate(allRecords.slice(-1)[0]);
  }

  get downloadableData(): DownloadableData | undefined {
    if (!this.dataSeries) return undefined;

    const datasets = [] as DownloadableDataset[];
    const data: Record<string, number>[] = [];
    const labels: string[] = [];

    this.dataSeries.forEach((d: TimeSeriesDataRecord) => {
      data.push({
        Population: Math.round(d.count),
        ...(d.avg90day && {
          "3-month rolling average": Math.round(d.avg90day),
        }),
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
      lastUpdatedOn: formatDate(this.mostRecentDate),
      methodologyContent: this.methodology,
    });
  }

  extrapolateRecordsForRange(monthRange: number): TimeSeriesDataRecord[] {
    const { mostRecentDate, records } = this;
    const earliestDate = startOfMonth(subMonths(mostRecentDate, monthRange));

    const recordsGrouped = new Map<string, TimeSeriesDataRecord>();
    records?.forEach((record) => {
      recordsGrouped.set(getRecordDate(record).toDateString(), record);
    });

    // For each month in range, if we have an entry for it add it to the array. If not, add an entry
    // with a count of 0.
    return eachMonthOfInterval({
      start: earliestDate,
      end: mostRecentDate,
    }).map((date) => {
      return (
        recordsGrouped.get(date.toDateString()) ?? {
          year: date.getFullYear(),
          month: date.getMonth() + 1,
          count: 0,
          avg90day: 0,
        }
      );
    });
  }
}
