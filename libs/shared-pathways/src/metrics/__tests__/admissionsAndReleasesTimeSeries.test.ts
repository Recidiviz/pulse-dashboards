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

import { AdmissionsAndReleasesTimeSeriesRecord } from "../../types";
import { fillMissingYears } from "../admissionsAndReleasesTimeSeries";

const record = (
  year: number,
  admissionsCount: number,
  releasesCount: number,
): AdmissionsAndReleasesTimeSeriesRecord => ({
  year,
  month: 1,
  admissionsCount,
  releasesCount,
});

describe("fillMissingYears", () => {
  it("returns nothing for no records", () => {
    expect(fillMissingYears([])).toEqual([]);
  });

  it("leaves consecutive years untouched", () => {
    const records = [record(2023, 10, 20), record(2024, 11, 21)];

    expect(fillMissingYears(records)).toEqual(records);
  });

  it("fills a skipped year with zeros rather than joining across it", () => {
    const filled = fillMissingYears([
      record(2023, 10, 20),
      record(2025, 12, 22),
    ]);

    expect(filled.map((r) => r.year)).toEqual([2023, 2024, 2025]);
    expect(filled[1]).toEqual(record(2024, 0, 0));
  });

  it("steps by year, not by month, for annual figures", () => {
    // A monthly walk across the same span would return 25 rows, nearly all of
    // them zero, which would draw as spikes with gaps between them.
    const filled = fillMissingYears([
      record(2023, 10, 20),
      record(2025, 12, 22),
    ]);

    expect(filled).toHaveLength(3);
  });

  it("keeps one row per year, so two event counts never share a date", () => {
    const filled = fillMissingYears([
      record(2023, 10, 20),
      record(2024, 11, 21),
      record(2025, 12, 22),
    ]);

    expect(new Set(filled.map((r) => r.year)).size).toBe(3);
  });
});
