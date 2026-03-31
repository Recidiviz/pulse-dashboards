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

import configureFilename from "../configureFileName";
import getTimeStamp from "../getTimeStamp";

vi.mock("../getTimeStamp");

const mockTimeStamp = "03-16-2026-10-30-00-AM";

beforeEach(() => {
  vi.mocked(getTimeStamp).mockReturnValue(mockTimeStamp);
});

describe("configureFilename", () => {
  it("returns filename with Downloaded timestamp when withoutFilters is true", () => {
    expect(configureFilename("chartId", null, true)).toBe(
      `chartId-Downloaded-${mockTimeStamp}`,
    );
  });

  it("returns filename with filters appended", () => {
    const filters = {
      metricType: "counts",
      metricPeriodMonths: "12",
      supervisionType: "PAROLE",
      district: "D1",
    };
    expect(configureFilename("chartId", filters, false)).toBe(
      `chartId-Downloaded-${mockTimeStamp}-counts-12-PAROLE-D1`,
    );
  });

  it("includes As-Of date when dateInPopulation is provided", () => {
    const filters = { dateInPopulation: "2026-03-16" };
    expect(configureFilename("chartId", filters, true)).toBe(
      `chartId-As-Of-03-16-2026-Downloaded-${mockTimeStamp}`,
    );
  });

  it("does not include As-Of when dateInPopulation is ALL", () => {
    const filters = { dateInPopulation: "ALL" };
    expect(configureFilename("chartId", filters, true)).toBe(
      `chartId-Downloaded-${mockTimeStamp}`,
    );
  });

  it("does not include As-Of when dateInPopulation is not provided", () => {
    expect(configureFilename("chartId", {}, true)).toBe(
      `chartId-Downloaded-${mockTimeStamp}`,
    );
  });

  it("includes As-Of date alongside other filters", () => {
    const filters = {
      dateInPopulation: "2026-01-15",
      metricType: "rates",
    };
    expect(configureFilename("chartId", filters, false)).toBe(
      `chartId-As-Of-01-15-2026-Downloaded-${mockTimeStamp}-rates`,
    );
  });
});
