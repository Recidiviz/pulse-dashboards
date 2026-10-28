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
import { CalendarGridSkeleton } from "../CalendarGridSkeleton";

const status = () => screen.getByRole("status", { name: "Loading the month" });

describe("CalendarGridSkeleton", () => {
  test("lays out a weekday header and five weeks of day cells", () => {
    render(<CalendarGridSkeleton />);

    const grid = status().lastElementChild as HTMLElement;
    expect(grid.children).toHaveLength(7 + 5 * 7);
  });

  test("shows as many weeks as asked for", () => {
    render(<CalendarGridSkeleton weeks={6} />);

    const grid = status().lastElementChild as HTMLElement;
    expect(grid.children).toHaveLength(7 + 6 * 7);
  });

  test("shades the weekend columns for the week's first day and leaves them empty", () => {
    render(<CalendarGridSkeleton firstDay={1} weeks={1} />);

    const cells = [...(status().lastElementChild as HTMLElement).children];
    const [monday, , , , , saturday, sunday] = cells.slice(7);
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
    expect(
      within(sunday as HTMLElement).getAllByTestId("skeleton"),
    ).toHaveLength(1);
  });

  test("puts chips on weekdays by weekday, whatever the first day", () => {
    render(<CalendarGridSkeleton firstDay={1} weeks={1} />);

    const cells = [...(status().lastElementChild as HTMLElement).children];
    const monday = cells[7] as HTMLElement;
    // The first week's pattern gives Monday one chip: a number and a label bar.
    expect(within(monday).getAllByTestId("skeleton")).toHaveLength(2);
  });

  test("the list view shows day headings with chips under them", () => {
    render(<CalendarGridSkeleton view="list" />);

    // Four days, after the status's screen-reader text.
    expect(status().children).toHaveLength(1 + 4);
  });
});
