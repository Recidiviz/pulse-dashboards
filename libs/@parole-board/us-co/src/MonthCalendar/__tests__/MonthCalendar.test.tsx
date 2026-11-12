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

import { render } from "@testing-library/react";

import type { EntryDto } from "~@parole-board/common";
import { CalendarGrid, useCalendarConfig } from "~@parole-board/common";
import {
  queryResult,
  september2026Config,
  september2026MonthDetail,
  september2026MonthDetailWithHolidayHearings,
} from "~@parole-board/common/fixtures";

import { MonthCalendar } from "../MonthCalendar";
import { NARROW_VIEWPORT_QUERY } from "../useIsNarrowViewport";

vi.mock("~@parole-board/common", async (importOriginal) => {
  const actual = await importOriginal<typeof import("~@parole-board/common")>();
  return {
    ...actual,
    CalendarGrid: vi.fn(() => null),
    useCalendarConfig: vi.fn(),
  };
});

const SEPTEMBER = { year: 2026, month: 9 };
const onEntryClick = vi.fn();

const gridProps = () => vi.mocked(CalendarGrid).mock.lastCall?.[0];

const { holidays } = september2026MonthDetail;

const renderMonth = (entries: readonly EntryDto[]) =>
  render(
    <MonthCalendar
      month={SEPTEMBER}
      entries={entries}
      holidays={holidays}
      selectedEntryIds={["2026-09-14:HEARING:FCF"]}
      onEntryClick={onEntryClick}
    />,
  );

beforeEach(() => {
  vi.mocked(useCalendarConfig).mockReturnValue(
    queryResult({
      ...september2026Config,
      calendar: {
        ...september2026Config.calendar,
        timezone: "America/Phoenix",
        weekStartsOn: "MONDAY",
      },
    }) as ReturnType<typeof useCalendarConfig>,
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("MonthCalendar", () => {
  test("renders the grid read-only, Sunday-first, in the config's timezone", () => {
    renderMonth(september2026MonthDetail.entries);

    expect(gridProps()).toMatchObject({
      month: SEPTEMBER,
      view: "month",
      timeZone: "America/Phoenix",
      firstDay: 0,
      readOnly: true,
      selectedEntryIds: ["2026-09-14:HEARING:FCF"],
      onEntryClick,
      ariaLabel: "September 2026 calendar",
    });
    expect(gridProps()?.entries).toHaveLength(
      september2026MonthDetail.entries.length,
    );
  });

  test("turns dragging on with the config's allowed weekdays and passes drops through", () => {
    const onEntriesDrop = vi.fn();
    render(
      <MonthCalendar
        month={SEPTEMBER}
        entries={september2026MonthDetail.entries}
        holidays={holidays}
        selectedEntryIds={[]}
        onEntryClick={onEntryClick}
        readOnly={false}
        onEntriesDrop={onEntriesDrop}
      />,
    );

    expect(gridProps()).toMatchObject({
      readOnly: false,
      allowedWeekdays: september2026Config.calendar.allowedWeekdays,
    });
    gridProps()?.onEntriesDrop?.(["2026-09-15:HEARING:CCF"], "2026-09-21");
    expect(onEntriesDrop).toHaveBeenCalledWith(
      ["2026-09-15:HEARING:CCF"],
      "2026-09-21",
    );
  });

  test("keeps the grid's entries and holidays when a refetch returns equal ones", () => {
    const { rerender } = renderMonth(september2026MonthDetail.entries);
    const before = gridProps()?.entries;
    const beforeHolidays = gridProps()?.holidays;

    rerender(
      <MonthCalendar
        month={SEPTEMBER}
        entries={structuredClone(september2026MonthDetail.entries)}
        holidays={structuredClone(holidays)}
        selectedEntryIds={[]}
        onEntryClick={onEntryClick}
      />,
    );

    expect(gridProps()?.entries).toBe(before);
    expect(gridProps()?.holidays).toBe(beforeHolidays);
  });

  test("passes new entries when one changes", () => {
    const { rerender } = renderMonth(september2026MonthDetail.entries);
    const before = gridProps()?.entries;

    const cancelled = september2026MonthDetail.entries.map((entry) =>
      entry.id === "2026-09-11:FULL_BOARD:Full Board"
        ? { ...entry, cancelled: true }
        : entry,
    );
    rerender(
      <MonthCalendar
        month={SEPTEMBER}
        entries={cancelled}
        holidays={holidays}
        selectedEntryIds={[]}
        onEntryClick={onEntryClick}
      />,
    );

    expect(gridProps()?.entries).not.toBe(before);
    expect(
      gridProps()?.entries.find(
        (entry) => entry.id === "2026-09-11:FULL_BOARD:Full Board",
      ),
    ).toMatchObject({ cancelled: true });
  });

  test("passes the month's holidays along with the entries on them", () => {
    renderMonth(september2026MonthDetailWithHolidayHearings.entries);

    expect(gridProps()?.holidays).toEqual([
      { date: "2026-09-07", name: "Labor Day" },
    ]);
    expect(
      gridProps()
        ?.entries.filter((entry) => entry.date === "2026-09-07")
        .map((entry) => entry.label),
    ).toEqual(["FCF", "CTCF"]);
  });

  test("uses the list view below 768px", () => {
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: query === NARROW_VIEWPORT_QUERY,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));

    renderMonth(september2026MonthDetail.entries);

    expect(gridProps()?.view).toBe("list");
  });
});
