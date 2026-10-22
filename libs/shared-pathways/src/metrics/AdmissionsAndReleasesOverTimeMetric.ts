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

import { format } from "date-fns";
import { computed, makeObservable } from "mobx";

import {
  AdmissionsAndReleasesMonthlyCountRecord,
  AdmissionsAndReleasesTimeSeriesRecord,
  DownloadableData,
  DownloadableDataset,
} from "../types";
import { getRecordDate } from "../utils";
import {
  fillMissingMonths,
  pivotMonthlyCounts,
} from "./admissionsAndReleasesTimeSeries";
import PathwaysNewBackendMetric from "./PathwaysNewBackendMetric";
import { MetricsFetcher, SharedMetricConstructorOptions } from "./types";

/** The composite dimension that returns one row per month per event type. */
const MONTHLY_COUNT_GROUP = "movement_date_event_type";

type ConstructorOptions = Omit<
  SharedMetricConstructorOptions<AdmissionsAndReleasesTimeSeriesRecord>,
  "fetchMetrics"
> & {
  fetchMetrics: MetricsFetcher<AdmissionsAndReleasesMonthlyCountRecord>;
};

/**
 * Admissions and releases counted per month, as two counts on each record, so
 * one chart can draw them as two lines.
 *
 * The API returns one row per month per event type. This metric pivots those
 * rows as they arrive, so nothing past the fetch sees the API's shape.
 */
export default class AdmissionsAndReleasesOverTimeMetric extends PathwaysNewBackendMetric<AdmissionsAndReleasesTimeSeriesRecord> {
  override readonly isOverTime = true;

  constructor({ fetchMetrics, ...props }: ConstructorOptions) {
    super({
      ...props,
      fetchMetrics: async (endpoint, params, signal) => {
        const response = await fetchMetrics(endpoint, params, signal);
        return { ...response, data: pivotMonthlyCounts(response.data) };
      },
    });

    makeObservable<AdmissionsAndReleasesOverTimeMetric>(this, {
      dataSeries: computed,
      downloadableData: computed,
    });

    this.dataTransformer = fillMissingMonths;
  }

  override getQueryParams(): URLSearchParams {
    const queryParams = super.getQueryParams();
    queryParams.append("group", MONTHLY_COUNT_GROUP);
    return queryParams;
  }

  get dataSeries(): AdmissionsAndReleasesTimeSeriesRecord[] {
    return this.allRecords ?? [];
  }

  get dataSeriesForDiffing(): AdmissionsAndReleasesTimeSeriesRecord[] {
    return this.dataSeries;
  }

  get isEmpty(): boolean {
    return !this.dataSeries.length;
  }

  get downloadableData(): DownloadableData {
    if (!this.dataSeries.length) return undefined;

    const data: Record<string, number>[] = [];
    const labels: string[] = [];

    this.dataSeries.forEach((record) => {
      data.push({
        Admissions: Math.round(record.admissionsCount),
        Releases: Math.round(record.releasesCount),
      });
      labels.push(format(getRecordDate(record), "MMM yyyy"));
    });

    const datasets: DownloadableDataset[] = [{ data, label: "" }];

    return {
      chartDatasets: datasets,
      chartLabels: labels,
      chartId: this.chartTitle,
      dataExportLabel: "Month",
    };
  }
}
