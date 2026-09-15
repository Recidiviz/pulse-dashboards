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

import { eachYearOfInterval } from "date-fns";

import { AdmissionsAndReleasesTimeSeriesRecord } from "../types";

/**
 * Returns one record per year across the range the data covers, so that a year
 * the backend reports nothing for is drawn as zero rather than joining the
 * years either side of it into one straight line.
 *
 * This steps by year rather than by month, because these figures are annual.
 * A monthly walk would return a row for every month in the span and zero out
 * all but one per year, which draws as spikes separated by gaps.
 */
export function fillMissingYears(
  records: AdmissionsAndReleasesTimeSeriesRecord[],
): AdmissionsAndReleasesTimeSeriesRecord[] {
  if (!records.length) return [];

  const recordsByYear = new Map(records.map((record) => [record.year, record]));
  const years = records.map((record) => record.year);

  return eachYearOfInterval({
    start: new Date(Math.min(...years), 0, 1),
    end: new Date(Math.max(...years), 0, 1),
  }).map((date) => {
    const year = date.getFullYear();
    return (
      recordsByYear.get(year) ?? {
        year,
        month: 1,
        admissionsCount: 0,
        releasesCount: 0,
      }
    );
  });
}
