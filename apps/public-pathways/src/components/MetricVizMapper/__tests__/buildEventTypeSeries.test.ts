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

import { AdmissionsAndReleasesTimeSeriesRecord } from "~shared-pathways";

import { EVENT_TYPES } from "../../../datastores/eventTypes";
import { buildEventTypeSeries } from "../VizAdmissionsAndReleasesOverTime";

const records: AdmissionsAndReleasesTimeSeriesRecord[] = [
  { year: 2023, month: 1, admissionsCount: 100, releasesCount: 200 },
  { year: 2024, month: 1, admissionsCount: 110, releasesCount: 210 },
];

describe("buildEventTypeSeries", () => {
  it("draws both lines when the reader asks for both event types", () => {
    const series = buildEventTypeSeries(records, EVENT_TYPES.ALL);

    expect(series.map((line) => line.name)).toEqual(["Admissions", "Releases"]);
  });

  it("draws admissions alone when only admissions are counted", () => {
    const series = buildEventTypeSeries(records, EVENT_TYPES.ADMISSIONS);

    expect(series.map((line) => line.name)).toEqual(["Admissions"]);
    expect(series[0].data.map((point) => point.value)).toEqual([100, 110]);
  });

  it("draws releases alone when only releases are counted", () => {
    const series = buildEventTypeSeries(records, EVENT_TYPES.RELEASES);

    expect(series.map((line) => line.name)).toEqual(["Releases"]);
    expect(series[0].data.map((point) => point.value)).toEqual([200, 210]);
  });

  it("gives each line its own color, so the legend can tell them apart", () => {
    const [admissions, releases] = buildEventTypeSeries(
      records,
      EVENT_TYPES.ALL,
    );

    expect(admissions.color).toBeDefined();
    expect(releases.color).toBeDefined();
    expect(admissions.color).not.toBe(releases.color);
  });

  it("dates each point from its record's year", () => {
    const [admissions] = buildEventTypeSeries(records, EVENT_TYPES.ALL);

    expect(admissions.data.map((point) => point.date.getFullYear())).toEqual([
      2023, 2024,
    ]);
  });
});
