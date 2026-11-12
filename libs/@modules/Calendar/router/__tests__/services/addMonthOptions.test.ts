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
  addMonthOptions,
  addMonthWindow,
} from "../../src/services/addMonthOptions";

describe("addMonthWindow", () => {
  it("is the current month and the next 12", () => {
    expect(addMonthWindow({ year: 2026, month: 10 })).toEqual([
      { year: 2026, month: 10 },
      { year: 2026, month: 11 },
      { year: 2026, month: 12 },
      ...Array.from({ length: 10 }, (_, i) => ({ year: 2027, month: i + 1 })),
    ]);
  });
});

describe("addMonthOptions", () => {
  it("offers the next 12 months once the current month exists", () => {
    const options = addMonthOptions({ year: 2026, month: 10 }, [
      { year: 2026, month: 10 },
    ]);

    expect(options[0]).toEqual({ year: 2026, month: 11 });
    expect(options.at(-1)).toEqual({ year: 2027, month: 10 });
    expect(options).toHaveLength(12);
  });

  it("offers the current month and the next 12 when none exist", () => {
    const options = addMonthOptions({ year: 2026, month: 10 }, []);

    expect(options[0]).toEqual({ year: 2026, month: 10 });
    expect(options.at(-1)).toEqual({ year: 2027, month: 10 });
    expect(options).toHaveLength(13);
  });

  it("crosses a year boundary and skips existing months in the middle", () => {
    expect(
      addMonthOptions({ year: 2026, month: 12 }, [
        { year: 2027, month: 2 },
        { year: 2025, month: 12 },
      ]),
    ).toEqual([
      { year: 2026, month: 12 },
      { year: 2027, month: 1 },
      ...Array.from({ length: 10 }, (_, i) => ({ year: 2027, month: i + 3 })),
    ]);
  });

  it("is empty when every month in the window exists", () => {
    const current = { year: 2026, month: 10 };

    expect(addMonthOptions(current, addMonthWindow(current))).toEqual([]);
  });
});
