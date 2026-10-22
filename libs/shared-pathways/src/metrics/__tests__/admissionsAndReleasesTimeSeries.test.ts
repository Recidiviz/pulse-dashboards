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

import {
  AdmissionsAndReleasesMonthlyCountRecord,
  AdmissionsAndReleasesTimeSeriesRecord,
} from "../../types";
import {
  fillMissingMonths,
  pivotMonthlyCounts,
} from "../admissionsAndReleasesTimeSeries";

const record = (
  year: number,
  month: number,
  admissionsCount: number,
  releasesCount: number,
): AdmissionsAndReleasesTimeSeriesRecord => ({
  year,
  month,
  admissionsCount,
  releasesCount,
});

const row = (
  movementDate: string,
  eventType: string,
  count: number,
): AdmissionsAndReleasesMonthlyCountRecord => ({
  movementDate,
  eventType,
  count,
});

describe("pivotMonthlyCounts", () => {
  it("puts both event counts for a month on one record", () => {
    expect(
      pivotMonthlyCounts([
        row("2024-02-01", "admission", 5),
        row("2024-02-01", "release", 7),
      ]),
    ).toEqual([record(2024, 2, 5, 7)]);
  });

  it("counts zero for an event type a month has no row for", () => {
    expect(pivotMonthlyCounts([row("2024-03-01", "release", 4)])).toEqual([
      record(2024, 3, 0, 4),
    ]);
  });

  it("reads the month from the date string, whatever the reader's time zone", () => {
    // new Date("2024-01-01") is midnight UTC, which is still December 31 in
    // any time zone west of UTC.
    expect(pivotMonthlyCounts([row("2024-01-01", "admission", 1)])).toEqual([
      record(2024, 1, 1, 0),
    ]);
  });

  it("throws on an event type it does not know, rather than dropping the count", () => {
    expect(() =>
      pivotMonthlyCounts([row("2024-01-01", "ADMISSIONS", 1)]),
    ).toThrow(/ADMISSIONS/);
  });
});

describe("fillMissingMonths", () => {
  it("returns nothing for no records", () => {
    expect(fillMissingMonths([])).toEqual([]);
  });

  it("leaves consecutive months untouched", () => {
    const records = [record(2023, 12, 10, 20), record(2024, 1, 11, 21)];

    expect(fillMissingMonths(records)).toEqual(records);
  });

  it("fills a skipped month with zeros rather than joining across it", () => {
    const filled = fillMissingMonths([
      record(2023, 11, 10, 20),
      record(2024, 1, 12, 22),
    ]);

    expect(filled.map((r) => [r.year, r.month])).toEqual([
      [2023, 11],
      [2023, 12],
      [2024, 1],
    ]);
    expect(filled[1]).toEqual(record(2023, 12, 0, 0));
  });
});
