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
  AdmissionsAndReleasesTimeSeriesRecord,
  DownloadableData,
  DownloadableDataset,
} from "../types";
import { getRecordDate } from "../utils";
import { fillMissingYears } from "./admissionsAndReleasesTimeSeries";
import PathwaysNewBackendMetric from "./PathwaysNewBackendMetric";
import { SharedMetricConstructorOptions } from "./types";

/**
 * Admissions and releases counted per calendar year, as two counts on each
 * record. Keeping both counts together lets one chart draw them as two lines,
 * and keeps one row per year, which the yearly gap filling below relies on.
 */
export default class AdmissionsAndReleasesOverTimeMetric extends PathwaysNewBackendMetric<AdmissionsAndReleasesTimeSeriesRecord> {
  override readonly isOverTime = true;

  constructor(
    props: SharedMetricConstructorOptions<AdmissionsAndReleasesTimeSeriesRecord>,
  ) {
    super(props);

    makeObservable<AdmissionsAndReleasesOverTimeMetric>(this, {
      dataSeries: computed,
      downloadableData: computed,
    });

    this.dataTransformer = fillMissingYears;
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
      labels.push(format(getRecordDate(record), "yyyy"));
    });

    const datasets: DownloadableDataset[] = [{ data, label: "" }];

    return {
      chartDatasets: datasets,
      chartLabels: labels,
      chartId: this.chartTitle,
      dataExportLabel: "Calendar year",
    };
  }
}
