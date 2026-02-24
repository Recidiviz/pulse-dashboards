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

import { eachMonthOfInterval, startOfMonth, subMonths } from "date-fns";
import { computed, makeObservable } from "mobx";

import { TimeSeriesDataRecord } from "../types";
import { getRecordDate } from "../utils";
import PathwaysNewBackendMetric from "./PathwaysNewBackendMetric";
import { SharedMetricConstructorOptions } from "./types";

export default class OverTimeMetric extends PathwaysNewBackendMetric<TimeSeriesDataRecord> {
  constructor(props: SharedMetricConstructorOptions<TimeSeriesDataRecord>) {
    super(props);

    makeObservable<OverTimeMetric>(this, {
      dataSeries: computed,
    });

    this.dataTransformer = this.extrapolateRecords;
  }

  get dataSeries(): TimeSeriesDataRecord[] {
    return this.allRecords ?? [];
  }

  get dataSeriesForDiffing(): TimeSeriesDataRecord[] {
    return this.dataSeries;
  }

  get isEmpty(): boolean {
    return !this.dataSeries?.length;
  }

  static mostRecentDate(records?: TimeSeriesDataRecord[]): Date {
    if (!records || records.length === 0) {
      return new Date(9999, 11, 31);
    }

    return getRecordDate(records.slice(-1)[0]);
  }

  extrapolateRecords(records: TimeSeriesDataRecord[]): TimeSeriesDataRecord[] {
    const { monthRange } = this.store.filtersStore;
    const mostRecentDate = OverTimeMetric.mostRecentDate(records);
    const earliestDate = startOfMonth(subMonths(mostRecentDate, monthRange));

    const recordsGrouped = new Map<string, TimeSeriesDataRecord>();
    records?.forEach((record) => {
      recordsGrouped.set(getRecordDate(record).toDateString(), record);
    });

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
