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

import { eachMonthOfInterval } from "date-fns";

import { RECORD_EVENT_TYPES } from "../constants";
import {
  AdmissionsAndReleasesMonthlyCountRecord,
  AdmissionsAndReleasesTimeSeriesRecord,
} from "../types";

const monthKey = (year: number, month: number) => `${year}-${month}`;

/**
 * Returns one record per month, carrying both event counts, from the API's
 * one row per month per event type.
 *
 * @example
 * // [{ movementDate: "2024-02-01", eventType: "admission", count: 5 },
 * //  { movementDate: "2024-02-01", eventType: "release", count: 7 }]
 * // becomes
 * // [{ year: 2024, month: 2, admissionsCount: 5, releasesCount: 7 }]
 */
export function pivotMonthlyCounts(
  rows: AdmissionsAndReleasesMonthlyCountRecord[],
): AdmissionsAndReleasesTimeSeriesRecord[] {
  const recordsByMonth = new Map<
    string,
    AdmissionsAndReleasesTimeSeriesRecord
  >();

  rows.forEach(({ movementDate, eventType, count }) => {
    // Split the ISO date rather than parse it, so the month never shifts with
    // the reader's time zone.
    const [year, month] = movementDate.split("-").map(Number);
    const key = monthKey(year, month);
    const record = recordsByMonth.get(key) ?? {
      year,
      month,
      admissionsCount: 0,
      releasesCount: 0,
    };

    if (eventType === RECORD_EVENT_TYPES.ADMISSION) {
      record.admissionsCount += count;
    } else if (eventType === RECORD_EVENT_TYPES.RELEASE) {
      record.releasesCount += count;
    } else {
      throw new Error(
        `Unexpected eventType "${eventType}" on an admissions and releases row for ${movementDate}.`,
      );
    }
    recordsByMonth.set(key, record);
  });

  return [...recordsByMonth.values()];
}

/**
 * Returns one record per month across the range the data covers, so that a
 * month the backend reports nothing for is drawn as zero rather than joining
 * the months either side of it into one straight line.
 */
export function fillMissingMonths(
  records: AdmissionsAndReleasesTimeSeriesRecord[],
): AdmissionsAndReleasesTimeSeriesRecord[] {
  if (!records.length) return [];

  const recordsByMonth = new Map(
    records.map((record) => [monthKey(record.year, record.month), record]),
  );
  const dates = records.map(
    (record) => new Date(record.year, record.month - 1, 1),
  );

  return eachMonthOfInterval({
    start: new Date(Math.min(...dates.map(Number))),
    end: new Date(Math.max(...dates.map(Number))),
  }).map((date) => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    return (
      recordsByMonth.get(monthKey(year, month)) ?? {
        year,
        month,
        admissionsCount: 0,
        releasesCount: 0,
      }
    );
  });
}
