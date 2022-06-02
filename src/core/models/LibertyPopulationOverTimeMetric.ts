/*
 * Recidiviz - a data platform for criminal justice reform
 * Copyright (C) 2021 Recidiviz, Inc.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 * =============================================================================
 *
 */
import * as Sentry from "@sentry/react";
import { startOfMonth, subMonths } from "date-fns";
import { snakeCase } from "lodash";
import { autorun, computed, get, keys, makeObservable, toJS } from "mobx";

import { formatDate } from "../../utils";
import { downloadChartAsData } from "../../utils/downloads/downloadData";
import { DownloadableData, DownloadableDataset } from "../PagePractices/types";
import { formatMonthAndYear } from "../PopulationTimeSeriesChart/helpers";
import { PopulationFilterValues } from "../types/filters";
import { DiffError, diffTimeSeriesData } from "./backendDiff";
import { recordsWithAggregateMetrics } from "./calculateAggregateMetrics";
import PathwaysMetric, { BaseMetricConstructorOptions } from "./PathwaysMetric";
import { LibertyPopulationTimeSeriesRecord } from "./types";
import { getRecordDate } from "./utils";

export default class LibertyPopulationOverTimeMetric extends PathwaysMetric<LibertyPopulationTimeSeriesRecord> {
  constructor(
    props: BaseMetricConstructorOptions<LibertyPopulationTimeSeriesRecord>
  ) {
    super(props);

    makeObservable<LibertyPopulationOverTimeMetric>(this, {
      mostRecentDate: computed,
      dataSeries: computed,
      downloadableData: computed,
    });

    autorun(() => {
      if (!this.rootStore || !this.allRecords?.length) return;
      const { filters, monthRange } = this.rootStore.filtersStore;
      const queryParams = new URLSearchParams({ group: "year_month" });
      const since = startOfMonth(subMonths(new Date(), monthRange));
      queryParams.append("since", formatDate(since, "yyyy-MM-dd"));

      keys(filters).forEach((k) => {
        const key = k as keyof PopulationFilterValues;
        const values = toJS(get(filters, key));

        const queryKey = snakeCase(key);
        if (key !== "timePeriod") {
          values.forEach((val: any) => {
            if (val !== "ALL") {
              queryParams.append(`filters[${queryKey}]`, val);
            }
          });
        }
      });

      this.fetchNewMetrics(queryParams).then((results) => {
        if (
          this.endpoint &&
          process.env.REACT_APP_DEPLOY_ENV !== "production"
        ) {
          const diffs = diffTimeSeriesData(this.dataSeries, results);
          if (diffs.size > 0) {
            Sentry.captureException(
              new DiffError(JSON.stringify(Object.fromEntries(diffs)))
            );
          }
        }
      });
    });

    this.download = this.download.bind(this);
  }

  get dataSeries(): LibertyPopulationTimeSeriesRecord[] {
    if (!this.rootStore || !this.allRecords?.length) return [];
    const { filters, monthRange } = this.rootStore.filtersStore;
    return recordsWithAggregateMetrics<LibertyPopulationTimeSeriesRecord>(
      this,
      filters,
      monthRange
    );
  }

  get mostRecentDate(): Date {
    const { allRecords } = this;

    if (!allRecords || allRecords.length === 0) {
      return new Date(9999, 11, 31);
    }

    return getRecordDate(allRecords.slice(-1)[0]);
  }

  get downloadableData(): DownloadableData | undefined {
    if (!this.dataSeries) return undefined;

    const datasets = [] as DownloadableDataset[];
    const data: Record<string, number>[] = [];
    const labels: string[] = [];

    this.dataSeries.forEach((d: LibertyPopulationTimeSeriesRecord) => {
      data.push({
        value: Math.round(d.count),
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
      lastUpdatedOn: formatDate(this.mostRecentDate),
      methodologyContent: this.methodology,
    });
  }
}
