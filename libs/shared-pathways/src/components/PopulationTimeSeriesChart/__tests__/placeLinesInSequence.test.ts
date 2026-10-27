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

import { HISTORICAL_LINE_CLASS, placeLinesInSequence } from "../helpers";

const line = (months: [number, number][]) => ({
  class: HISTORICAL_LINE_CLASS,
  data: months.map(([year, month]) => ({
    date: new Date(year, month - 1, 1),
    value: 1,
  })),
});

describe("placeLinesInSequence", () => {
  it("puts the months either side of a skipped year next to each other", () => {
    const { lines } = placeLinesInSequence(
      [
        line([
          [2023, 11],
          [2023, 12],
          [2025, 1],
        ]),
      ],
      1,
    );

    expect(lines[0].data.map(({ position }) => position)).toEqual([0, 1, 2]);
  });

  it("gives a month the same position on every line", () => {
    const { lines } = placeLinesInSequence(
      [
        line([
          [2023, 12],
          [2025, 1],
        ]),
        line([[2025, 1]]),
      ],
      1,
    );

    expect(lines[1].data[0].position).toBe(1);
  });

  it("labels each tick with the month it stands for", () => {
    const { tickValues, formatTick } = placeLinesInSequence(
      [
        line([
          [2023, 11],
          [2023, 12],
          [2025, 1],
        ]),
      ],
      2,
    );

    expect(tickValues.map(formatTick)).toEqual(["Nov '23", "Jan '25"]);
  });
});
