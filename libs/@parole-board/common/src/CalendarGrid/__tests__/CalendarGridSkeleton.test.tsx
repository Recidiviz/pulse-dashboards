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

import { render, screen, within } from "@testing-library/react";

import { semantics } from "../../theme";
import { CalendarGridSkeleton, weeksInMonth } from "../CalendarGridSkeleton";

const FEBRUARY_2026 = { year: 2026, month: 2 };
const AUGUST_2026 = { year: 2026, month: 8 };
const SEPTEMBER_2026 = { year: 2026, month: 9 };

const status = () => screen.getByRole("status", { name: "Loading the month" });

/** The grid's day cells, after its seven weekday headers. */
const dayCells = () =>
  [...(status().lastElementChild as HTMLElement).children].slice(
    7,
  ) as HTMLElement[];

/** A cell's chips: its placeholders less the day number's. */
const chipsIn = (cell: HTMLElement) =>
  Math.max(within(cell).queryAllByTestId("skeleton").length - 1, 0);

/** A list day's chips: its placeholders less the heading's two lines. */
const listChipsIn = (day: HTMLElement) =>
  within(day).queryAllByTestId("skeleton").length - 2;

describe("weeksInMonth", () => {
  test.each([
    [FEBRUARY_2026, 4],
    [SEPTEMBER_2026, 5],
    [AUGUST_2026, 6],
  ])("a Sunday-first grid for %o has %i weeks", (month, weeks) => {
    expect(weeksInMonth(month)).toBe(weeks);
  });

  test("counts from the grid's first day", () => {
    // February 2026 starts on a Sunday, so a Monday-first grid needs a week
    // for that day alone.
    expect(weeksInMonth(FEBRUARY_2026, 1)).toBe(5);
  });
});

describe("CalendarGridSkeleton", () => {
  test("lays out a weekday header and five weeks before the month is known", () => {
    render(<CalendarGridSkeleton />);

    expect(dayCells()).toHaveLength(5 * 7);
  });

  test.each([
    [FEBRUARY_2026, 4],
    [SEPTEMBER_2026, 5],
    [AUGUST_2026, 6],
  ])("draws the weeks %o spans", (month, weeks) => {
    render(<CalendarGridSkeleton month={month} />);

    expect(dayCells()).toHaveLength(weeks * 7);
  });

  test("leaves days outside the month blank and muted", () => {
    render(<CalendarGridSkeleton month={SEPTEMBER_2026} />);

    // September 2026 starts on a Tuesday.
    const [sunday, monday, tuesday] = dayCells();
    expect(monday).toHaveStyleRule(
      "background",
      String(semantics.surface.muted),
    );
    expect(within(monday).queryAllByTestId("skeleton")).toHaveLength(0);
    expect(within(sunday).queryAllByTestId("skeleton")).toHaveLength(0);
    expect(tuesday).toHaveStyleRule("background", String(semantics.surface.bg));
    expect(within(tuesday).queryAllByTestId("skeleton")).not.toHaveLength(0);
  });

  test("draws chipsOn's chips on each day", () => {
    const chipsOn = vi.fn(
      (isoDate: string) =>
        ({ "2026-09-01": 2, "2026-09-17": 12 })[isoDate] ?? 0,
    );
    render(<CalendarGridSkeleton month={SEPTEMBER_2026} chipsOn={chipsOn} />);

    const cells = dayCells();
    // Tuesday the 1st is the third cell, and Thursday the 17th is in the
    // third week.
    expect(chipsIn(cells[2])).toBe(2);
    expect(chipsIn(cells[2 * 7 + 4])).toBe(12);
    expect(cells.map(chipsIn).reduce((a, b) => a + b)).toBe(14);
    // Asked once for each day of the month, and never for a blank day.
    expect(chipsOn).toHaveBeenCalledTimes(30);
  });

  test("shades the weekend columns for the week's first day and leaves them empty", () => {
    render(<CalendarGridSkeleton firstDay={1} />);

    const [monday, , , , , saturday, sunday] = dayCells();
    expect(saturday).toHaveStyleRule(
      "background",
      String(semantics.surface.muted),
    );
    expect(sunday).toHaveStyleRule(
      "background",
      String(semantics.surface.muted),
    );
    expect(monday).toHaveStyleRule("background", String(semantics.surface.bg));
    // A weekend cell holds only its day number.
    expect(chipsIn(sunday)).toBe(0);
    // Without chipsOn, the first week's pattern gives Monday one chip.
    expect(chipsIn(monday)).toBe(1);
  });

  test("the list view shows each day with chips, with its chips under its heading", () => {
    const chipsOn = (isoDate: string) =>
      ({ "2026-09-01": 2, "2026-09-17": 12, "2026-09-25": 2 })[isoDate] ?? 0;
    render(
      <CalendarGridSkeleton
        view="list"
        month={SEPTEMBER_2026}
        chipsOn={chipsOn}
      />,
    );

    // Three days, after the status's screen-reader text.
    const days = [...status().children].slice(1) as HTMLElement[];
    expect(days.map(listChipsIn)).toEqual([2, 12, 2]);
  });

  test("the list view shows four days before the month is known", () => {
    render(<CalendarGridSkeleton view="list" />);

    expect(status().children).toHaveLength(1 + 4);
  });
});
