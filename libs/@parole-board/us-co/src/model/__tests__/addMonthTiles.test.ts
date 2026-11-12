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

import { addMonthChoices } from "~@parole-board/common/fixtures";

import { addMonthTiles, initialSelection } from "../addMonthTiles";
import { toYearMonthParam } from "../month";

const OCTOBER_2026 = { year: 2026, month: 10 };

const keys = (tiles: { year: number; month: number }[]) =>
  tiles.map(toYearMonthParam);

describe("addMonthTiles", () => {
  it("gives 13 selectable tiles when the current month is offered", () => {
    const tiles = addMonthTiles(addMonthChoices.options, OCTOBER_2026);

    expect(tiles).toHaveLength(13);
    expect(tiles[0]).toEqual({
      year: 2026,
      month: 10,
      label: "October",
      alreadyAdded: false,
    });
    expect(tiles.at(-1)).toMatchObject({ year: 2027, month: 10 });
    expect(tiles.some(({ alreadyAdded }) => alreadyAdded)).toBeFalse();
  });

  it("starts at the next month when the current month isn't offered", () => {
    const options = addMonthChoices.options.slice(1);

    const tiles = addMonthTiles(options, OCTOBER_2026);

    expect(tiles).toHaveLength(12);
    expect(keys(tiles)[0]).toBe("2026-11");
    expect(keys(tiles).at(-1)).toBe("2027-10");
  });

  it("marks a month of the next 12 that isn't offered as already added", () => {
    const tiles = addMonthTiles(
      addMonthChoices.optionsWithSomeAdded,
      OCTOBER_2026,
    );

    expect(tiles).toHaveLength(13);
    expect(tiles.filter(({ alreadyAdded }) => alreadyAdded)).toEqual([
      {
        year: 2026,
        month: 11,
        label: "November",
        alreadyAdded: true,
      },
      {
        year: 2026,
        month: 12,
        label: "December",
        alreadyAdded: true,
      },
    ]);
  });

  it("marks all 12 months already added when nothing is offered", () => {
    const tiles = addMonthTiles([], OCTOBER_2026);

    expect(tiles).toHaveLength(12);
    expect(tiles.every(({ alreadyAdded }) => alreadyAdded)).toBeTrue();
  });

  it("orders the tiles across the year boundary", () => {
    const tiles = addMonthTiles([], { year: 2026, month: 12 });

    expect(keys(tiles)).toEqual([
      "2027-01",
      "2027-02",
      "2027-03",
      "2027-04",
      "2027-05",
      "2027-06",
      "2027-07",
      "2027-08",
      "2027-09",
      "2027-10",
      "2027-11",
      "2027-12",
    ]);
  });

  it("keeps an offered month outside the window as a selectable tile", () => {
    const tiles = addMonthTiles(
      [
        { year: 2027, month: 11 },
        { year: 2026, month: 9 },
      ],
      OCTOBER_2026,
    );

    expect(keys(tiles)[0]).toBe("2026-09");
    expect(keys(tiles).at(-1)).toBe("2027-11");
    expect(tiles[0].alreadyAdded).toBeFalse();
    expect(tiles.at(-1)?.alreadyAdded).toBeFalse();
  });

  it("gives a month offered twice one tile", () => {
    const tiles = addMonthTiles(
      [OCTOBER_2026, OCTOBER_2026, { year: 2026, month: 11 }],
      OCTOBER_2026,
    );

    expect(keys(tiles).filter((key) => key === "2026-10")).toHaveLength(1);
  });
});

describe("initialSelection", () => {
  it("selects the earliest selectable tile", () => {
    const tiles = addMonthTiles(
      addMonthChoices.optionsWithSomeAdded.slice(1),
      OCTOBER_2026,
    );

    expect(initialSelection(tiles)).toEqual(["2027-01"]);
  });

  it("selects nothing when every tile is disabled", () => {
    expect(initialSelection(addMonthTiles([], OCTOBER_2026))).toEqual([]);
  });
});
