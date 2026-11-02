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

import { usArResidentJiiDataFixtures } from "~@jii/fixtures";
import { RawUsArResidentJiiData, usArStateDataSchema } from "~@jii/schemas";

import { EdovoProgressCardPresenter } from "./EdovoProgressCardPresenter";

// Noon in Arkansas on October 15
const NOW = new Date("2026-10-15T17:00:00Z");

function createPresenter(overrides: Partial<RawUsArResidentJiiData> = {}) {
  const metadata = usArStateDataSchema.parse({
    ...usArResidentJiiDataFixtures[0],
    edovoCarryInHours: 3,
    edovoHoursThisMonth: 6.5,
    edovoHoursToNextCpu: 6.5,
    edovoIsCreditingMonth: true,
    edovoDataBuiltAt: "2026-10-15T08:00:00Z",
    ...overrides,
  });
  return new EdovoProgressCardPresenter(metadata);
}

beforeEach(() => {
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("progress bar", () => {
  it("uses the backend's hours when they were built this month", () => {
    const presenter = createPresenter();
    expect(presenter.progress).toMatchObject({
      edovoCarryInHours: 3,
      edovoHoursThisMonth: 6.5,
      edovoHoursToNextCpu: 6.5,
      edovoIsCreditingMonth: true,
    });
  });

  it("shows an empty month when the hours were built last month", () => {
    const presenter = createPresenter({
      edovoDataBuiltAt: "2026-09-20T15:00:00Z",
    });
    expect(presenter.progress).toMatchObject({
      edovoCarryInHours: 0,
      edovoHoursThisMonth: 0,
      edovoHoursToNextCpu: 16,
      edovoIsCreditingMonth: false,
    });
  });

  it("trusts the hours when the build time is missing", () => {
    const presenter = createPresenter({ edovoDataBuiltAt: undefined });
    expect(presenter.progress).toMatchObject({
      edovoCarryInHours: 3,
      edovoHoursThisMonth: 6.5,
    });
  });

  it("counts a 9pm October 31 build in Arkansas as October", () => {
    // 9pm in Arkansas is already November 1 in UTC
    const presenter = createPresenter({
      edovoDataBuiltAt: "2026-11-01T02:00:00Z",
    });
    expect(presenter.isDataCurrent).toBe(true);
  });

  it("rounds the total to one decimal place", () => {
    const presenter = createPresenter({
      edovoCarryInHours: 1.1,
      edovoHoursThisMonth: 2.2,
    });
    expect(presenter.totalHours).toBe(3.3);
  });
});

describe("bar widths", () => {
  it("splits the bar between carry-in and this month", () => {
    const presenter = createPresenter();
    expect(presenter.carryInWidth).toBe(18.75);
    expect(presenter.currentMonthWidth).toBe(40.625);
  });

  it("gives this month only the space the carry-in leaves", () => {
    const presenter = createPresenter({
      edovoCarryInHours: 15,
      edovoHoursThisMonth: 4,
    });
    expect(presenter.carryInWidth).toBe(93.75);
    expect(presenter.currentMonthWidth).toBe(6.25);
  });
});
