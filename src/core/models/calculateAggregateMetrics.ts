// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2021 Recidiviz, Inc.
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

import { partialRight } from "lodash";
import {
  compose,
  groupBy,
  map,
  pipe,
  property,
  sortBy,
  sum,
  sumBy,
  values,
} from "lodash/fp";
import filter from "lodash/fp/filter";
import reduce from "lodash/fp/reduce";

import { Dimension } from "../types/dimensions";
import { PopulationFilterValues } from "../types/filters";
import { MetricRecord } from "./types";
import {
  and,
  filterRecordByDate,
  filterRecordByDimensions,
  properties,
} from "./utils";

const THREE_MONTH_AGGREGATE_LOOKBACK = 2;

interface AggregateMetricsInterface<T> {
  dimensions: Dimension[];
  mostRecentDate: Date;
  records: T[] | undefined;
}

export function recordsWithAggregateMetrics<T = MetricRecord>(
  metric: AggregateMetricsInterface<T>,
  filters: PopulationFilterValues,
  monthRange: number
): T[] {
  const { dimensions, mostRecentDate, records } = metric;

  const matchingDateRangeWithLookback = partialRight(filterRecordByDate, {
    monthRange: monthRange + THREE_MONTH_AGGREGATE_LOOKBACK,
    since: mostRecentDate,
  });

  const matchingDateRange = partialRight(filterRecordByDate, {
    monthRange,
    since: mostRecentDate,
  });

  const matchingDimensions = partialRight(
    filterRecordByDimensions,
    dimensions,
    filters
  );

  return pipe(
    filter(and(matchingDimensions, matchingDateRangeWithLookback)),
    groupedByMonth,
    reduce((memo: T[], recordsInMonth: T[]): T[] => {
      memo.push({
        // Destructure all non-aggregate fields
        ...recordsInMonth[0],
        ...calculateAggregateMetrics<T>(memo, recordsInMonth),
      });

      return memo;
    }, []),
    filter(matchingDateRange),
    sortBy(["year", "month"])
  )(records);
}

export type MonthOverMonthMetrics = {
  avg90day: number;
  count: number;
};

export function calculateAggregateMetrics<T>(
  pastMonths: T[],
  currentMonthRecords: T[]
): MonthOverMonthMetrics {
  /*
    @param pastMonths chronological list of past months' aggregates
    @param currentMonthsRecords list of non-aggregates that occurred "this" month
    Calculates aggregate metrics for a given month.
      - sums the count of all events for the current month
      - average count of events over the last 3 months

   */
  const currentMonthCount = sumBy("count", currentMonthRecords);
  const threeMonthWindow = [
    ...map(
      property("count"),
      pastMonths.slice(-THREE_MONTH_AGGREGATE_LOOKBACK)
    ),
    currentMonthCount,
  ];

  return {
    avg90day: Math.round(sum(threeMonthWindow) / threeMonthWindow.length),
    count: currentMonthCount,
  };
}

const groupedByMonth = compose(groupBy(properties("year", "month")), values);
