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
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { useState } from "react";

import { september2026 } from "~@parole-board/common/fixtures";

import { semantics } from "../../theme";
import { buildHandlers, CalendarGrid } from "../CalendarGrid";
import styles from "../CalendarGrid.module.css";
import type { CalendarGridProps } from "../types";

const baseProps: CalendarGridProps = {
  month: september2026.month,
  entries: september2026.entries,
  holidays: september2026.holidays,
  timeZone: september2026.timeZone,
  firstDay: september2026.firstDay,
};

// jsdom has no layout, so FullCalendar leaves event chips at visibility:
// hidden until it can measure them. Chip tests check the DOM, not visibility.

function renderGrid(props: Partial<CalendarGridProps> = {}) {
  return render(<CalendarGrid {...baseProps} {...props} />);
}

const dayCell = (date: string) => {
  const cell = document.querySelector<HTMLElement>(`[data-date="${date}"]`);
  if (!cell) throw new Error(`No cell for ${date}`);
  return cell;
};

// By hover title, since jsdom leaves chips at visibility: hidden (see above),
// which also hides their text from accessible-name queries.
const chip = (date: string, title: string) =>
  within(dayCell(date)).getByTitle(title);

const chipLabels = (date: string) =>
  Array.from(dayCell(date).querySelectorAll(`.${styles["entry"]}`)).map(
    (chip) => chip.textContent,
  );

describe("CalendarGrid month view", () => {
  test("numbers the 30 days and leaves days outside the month blank", () => {
    renderGrid();
    expect(within(dayCell("2026-09-01")).getByText("1")).toBeInTheDocument();
    expect(within(dayCell("2026-09-30")).getByText("30")).toBeInTheDocument();
    expect(
      document.querySelector('[data-date="2026-08-31"]')?.textContent ?? "",
    ).toBe("");
  });

  test.each(["America/Denver", "UTC", "Pacific/Kiritimati"])(
    "reads each cell's date in the calendar's time zone, %s",
    (timeZone) => {
      // The weekend class comes from toIsoDate on the Date FullCalendar passes
      // for each cell, so this pins how it passes dates in a named zone:
      // reading the 1st in UTC would land on the 31st and drop its number.
      renderGrid({ timeZone });
      expect(within(dayCell("2026-09-01")).getByText("1")).toBeInTheDocument();
      expect(dayCell("2026-09-01")).not.toHaveClass(styles["dayMuted"]);
    },
  );

  test("shows 5 weeks for September 2026", () => {
    renderGrid();
    expect(screen.getAllByRole("row", { name: /^Week/ })).toHaveLength(5);
  });

  test("puts Sunday first by default and Monday first with firstDay 1", () => {
    const { unmount } = renderGrid();
    expect(screen.getAllByRole("columnheader")[0]).toHaveAccessibleName(
      "Sunday",
    );
    unmount();
    renderGrid({ firstDay: 1 });
    expect(screen.getAllByRole("columnheader")[0]).toHaveAccessibleName(
      "Monday",
    );
  });

  test("renders all 11 entries on the 24th in input order, with no more link", () => {
    renderGrid();
    expect(chipLabels("2026-09-24")).toEqual([
      "ICC/FED",
      "YOS",
      "CCCF",
      "Boulder",
      "Hilltop",
      "ISP Fremont",
      "ISP/Montrose",
      "ISP Grfld/Mesa",
      "Lamar",
      "SLV",
      "STERCOM",
    ]);
    expect(screen.queryByText(/\+\d+ more/)).not.toBeInTheDocument();
  });

  test("keeps input order rather than sorting by label", () => {
    renderGrid({
      entries: [
        {
          id: "b",
          date: "2026-09-02",
          label: "Zeta",
          kind: "HEARING",
          cancelled: false,
        },
        {
          id: "a",
          date: "2026-09-02",
          label: "Alpha",
          kind: "HEARING",
          cancelled: false,
        },
      ],
    });
    expect(chipLabels("2026-09-02")).toEqual(["Zeta", "Alpha"]);
  });

  test("shows a cancelled entry with a Cancelled badge and accessible text", () => {
    renderGrid({ entries: september2026.entriesWithCancelledMeeting });
    const cancelled = chip("2026-09-11", "Full Board");
    expect(within(cancelled).getByText("Cancelled")).toBeInTheDocument();
    expect(cancelled).toHaveTextContent("Full Board, cancelled");
    const kept = chip("2026-09-04", "Full Board");
    expect(within(kept).queryByText("Cancelled")).not.toBeInTheDocument();
    expect(kept).not.toHaveTextContent("cancelled");
  });

  test("shows the Business Meeting by its label", () => {
    renderGrid();
    expect(chipLabels("2026-09-25")).toEqual([
      "Full Board",
      "Business Meeting",
    ]);
  });

  test("shows an entry's flag as text", () => {
    renderGrid({
      entries: [
        {
          id: "x",
          date: "2026-09-07",
          label: "FCF",
          kind: "HEARING",
          cancelled: false,
          flag: "Labor Day",
        },
      ],
      holidays: [],
    });
    expect(
      within(dayCell("2026-09-07")).getByText("Labor Day"),
    ).toBeInTheDocument();
  });

  test("labels a holiday after the day's entries, or with renderHolidayLabel", () => {
    const flagged = {
      id: "2026-09-07:HEARING:FCF",
      date: "2026-09-07",
      label: "FCF",
      kind: "HEARING",
      cancelled: false,
    };
    const { unmount } = renderGrid({
      entries: [...september2026.entries, flagged],
      onEntryClick: vi.fn(),
    });
    const cell = dayCell("2026-09-07");
    const label = within(cell).getByText("Labor Day");
    const chip = within(cell).getByText("FCF");
    expect(
      chip.compareDocumentPosition(label) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(label.closest('[role="button"]')).toBeNull();
    expect(label.closest(`.${styles["entry"]}`)).toBeNull();
    unmount();
    renderGrid({
      renderHolidayLabel: (holiday) => `Holiday: ${holiday.name}`,
    });
    expect(
      within(dayCell("2026-09-07")).getByText("Holiday: Labor Day"),
    ).toBeInTheDocument();
  });

  test("doesn't make holiday labels draggable", () => {
    renderGrid({ readOnly: false });
    const label = within(dayCell("2026-09-07")).getByText("Labor Day");
    expect(label.closest(`.${styles["entryEditable"]}`)).toBeNull();
  });

  const fcf14 = () => chip("2026-09-14", "FCF");

  test("makes each chip a toggle button when onEntryClick is set", () => {
    renderGrid({ onEntryClick: vi.fn() });
    expect(fcf14()).toHaveAttribute("role", "button");
    expect(fcf14()).toHaveAttribute("tabindex", "0");
    expect(fcf14()).toHaveAttribute("aria-pressed", "false");
  });

  test("calls onEntryClick once with the entry id on a click", async () => {
    const user = userEvent.setup();
    const onEntryClick = vi.fn();
    renderGrid({ onEntryClick });
    await user.click(fcf14());
    expect(onEntryClick).toHaveBeenCalledExactlyOnceWith(
      "2026-09-14:HEARING:FCF",
    );
  });

  test.each(["{Enter}", " "])(
    "calls onEntryClick from a focused chip with %s",
    async (key) => {
      const user = userEvent.setup();
      const onEntryClick = vi.fn();
      renderGrid({ onEntryClick });
      fcf14().focus();
      await user.keyboard(key);
      expect(onEntryClick).toHaveBeenCalledExactlyOnceWith(
        "2026-09-14:HEARING:FCF",
      );
    },
  );

  test("toggles a chip's selection as selectedEntryIds changes", async () => {
    const user = userEvent.setup();
    function Toggling() {
      const [ids, setIds] = useState<string[]>([]);
      return (
        <CalendarGrid
          {...baseProps}
          selectedEntryIds={ids}
          onEntryClick={(id) =>
            setIds((cur) =>
              cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id],
            )
          }
        />
      );
    }
    render(<Toggling />);
    const ccf15 = chip("2026-09-15", "CCF");
    expect(fcf14()).toHaveAttribute("aria-pressed", "false");

    await user.click(fcf14());
    await user.click(ccf15);
    expect(fcf14()).toHaveAttribute("aria-pressed", "true");
    expect(ccf15).toHaveAttribute("aria-pressed", "true");

    await user.click(fcf14());
    expect(fcf14()).toHaveAttribute("aria-pressed", "false");
    expect(ccf15).toHaveAttribute("aria-pressed", "true");
  });

  test("outlines a selected chip in border.action and rings focus in border.focus", () => {
    renderGrid({
      onEntryClick: vi.fn(),
      selectedEntryIds: ["2026-09-14:HEARING:FCF"],
    });
    expect(fcf14()).toHaveStyleRule(
      "outline",
      expect.stringContaining(String(semantics.border.action)),
      { modifier: '&[aria-pressed="true"]' },
    );
    expect(fcf14()).toHaveStyleRule(
      "box-shadow",
      expect.stringContaining(String(semantics.border.focus)),
      { modifier: "&:focus-visible" },
    );
  });

  test("makes chips plain content without onEntryClick", () => {
    renderGrid({ selectedEntryIds: ["2026-09-14:HEARING:FCF"] });
    expect(
      screen.queryByRole("button", { hidden: true }),
    ).not.toBeInTheDocument();
  });

  test("gives each chip its title, else its label, as hover text", () => {
    renderGrid({
      entries: [
        {
          id: "a",
          date: "2026-09-14",
          label: "FCF",
          title: "Fremont Correctional Facility",
          kind: "HEARING",
          cancelled: false,
        },
        {
          id: "b",
          date: "2026-09-14",
          label: "Full Board",
          kind: "FULL_BOARD",
          cancelled: false,
        },
      ],
    });
    expect(
      within(dayCell("2026-09-14")).getByTitle("Fremont Correctional Facility"),
    ).toHaveTextContent("FCF");
    expect(
      within(dayCell("2026-09-14")).getByTitle("Full Board"),
    ).toHaveTextContent("Full Board");
  });

  test("isn't draggable by default", () => {
    renderGrid();
    expect(document.querySelector(`.${styles["entryEditable"]}`)).toBeNull();
  });

  test("marks entries draggable when readOnly is false", () => {
    renderGrid({ readOnly: false });
    expect(
      document.querySelectorAll(`.${styles["entryEditable"]}`),
    ).toHaveLength(september2026.entries.length);
  });

  test("replaces the chip body with renderEntry", () => {
    renderGrid({ renderEntry: (entry) => `Custom ${entry.label}` });
    expect(
      within(dayCell("2026-09-14")).getByText("Custom FCF"),
    ).toBeInTheDocument();
  });

  test("has no axe violations", async () => {
    const { container } = renderGrid();
    expect(await axe(container)).toHaveNoViolations();
  });

  test("has no axe violations with selectable and selected chips", async () => {
    const { container } = renderGrid({
      readOnly: false,
      onEntryClick: vi.fn(),
      selectedEntryIds: ["2026-09-14:HEARING:FCF", "2026-09-15:HEARING:CCF"],
    });
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("CalendarGrid list view", () => {
  test("lists only the days with entries", () => {
    renderGrid({ view: "list" });
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.getByText("Greeley")).toBeVisible();
    expect(screen.getAllByText("Full Board")).toHaveLength(4);
  });

  test("leaves out holiday labels", () => {
    renderGrid({ view: "list" });
    expect(screen.queryByText("Labor Day")).not.toBeInTheDocument();
  });

  test("has no axe violations", async () => {
    const { container } = renderGrid({ view: "list" });
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("buildHandlers", () => {
  const month = september2026.month;
  const entries = september2026.entries;
  const fcf14 = "2026-09-14:HEARING:FCF";
  const ccf15 = "2026-09-15:HEARING:CCF";
  const ccf16 = "2026-09-16:HEARING:CCF";
  const fakeEvent = (id: string, startStr: string) =>
    ({ id, startStr }) as never;

  function drop(selected: string[], draggedId: string, toDate: string) {
    const onEntriesDrop = vi.fn();
    const revert = vi.fn();
    const { eventDrop } = buildHandlers({
      month,
      entries,
      selectedIds: new Set(selected),
      onEntriesDrop,
    });
    eventDrop({ event: fakeEvent(draggedId, toDate), revert });
    return { onEntriesDrop, revert };
  }

  test("puts the dragged chip back and passes only it when it isn't selected", () => {
    const { onEntriesDrop, revert } = drop([ccf15], fcf14, "2026-09-17");
    expect(revert).toHaveBeenCalledOnce();
    expect(onEntriesDrop).toHaveBeenCalledExactlyOnceWith(
      [fcf14],
      "2026-09-17",
    );
  });

  test("passes every selected id when the dragged chip is selected", () => {
    const { onEntriesDrop, revert } = drop(
      [ccf16, fcf14, ccf15],
      ccf15,
      "2026-09-17",
    );
    expect(revert).toHaveBeenCalledOnce();
    // In the grid's entry order, not selection order.
    expect(onEntriesDrop).toHaveBeenCalledExactlyOnceWith(
      [fcf14, ccf15, ccf16],
      "2026-09-17",
    );
  });

  test("leaves out selected entries already on the drop day", () => {
    const { onEntriesDrop } = drop([fcf14, ccf16], fcf14, "2026-09-16");
    expect(onEntriesDrop).toHaveBeenCalledExactlyOnceWith(
      [fcf14],
      "2026-09-16",
    );
  });

  test("ignores selected ids that aren't in the entries", () => {
    const { onEntriesDrop } = drop([fcf14, "gone"], fcf14, "2026-09-17");
    expect(onEntriesDrop).toHaveBeenCalledExactlyOnceWith(
      [fcf14],
      "2026-09-17",
    );
  });

  test.each([
    ["2026-08-31", false],
    ["2026-09-01", true],
    ["2026-09-30", true],
    ["2026-10-01", false],
  ])("allows a drop on %s: %s", (startStr, allowed) => {
    const { eventAllow } = buildHandlers({
      month,
      entries,
      selectedIds: new Set(),
    });
    expect(eventAllow({ startStr } as never, null)).toBe(allowed);
  });

  test.each([
    ["2026-09-12", false],
    ["2026-09-13", false],
    ["2026-09-14", true],
    ["2026-09-18", true],
  ])(
    "with Monday to Friday allowed, allows a drop on %s: %s",
    (startStr, allowed) => {
      const { eventAllow } = buildHandlers({
        month,
        entries,
        selectedIds: new Set(),
        allowedWeekdays: [
          "MONDAY",
          "TUESDAY",
          "WEDNESDAY",
          "THURSDAY",
          "FRIDAY",
        ],
      });
      expect(eventAllow({ startStr } as never, null)).toBe(allowed);
    },
  );

  test("ignores a click on a holiday label", () => {
    const onEntryClick = vi.fn();
    const { eventClick } = buildHandlers({
      month,
      entries,
      selectedIds: new Set(),
      onEntryClick,
    });
    eventClick({
      event: {
        id: "holiday:2026-09-07",
        startStr: "2026-09-07",
        extendedProps: { holiday: { date: "2026-09-07", name: "Labor Day" } },
      } as never,
    });
    expect(onEntryClick).not.toHaveBeenCalled();
  });
});
