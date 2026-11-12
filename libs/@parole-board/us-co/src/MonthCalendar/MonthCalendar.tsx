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

import { useMemo } from "react";

import type {
  CalendarGridEntry,
  CalendarHoliday,
  EntryDto,
  YearMonthOption,
} from "~@parole-board/common";
import { CalendarGrid, useCalendarConfig } from "~@parole-board/common";

import { formatMonthYear } from "../model/month";
import { useStableList } from "../model/useStableList";
import { toGridEntries } from "./toGridEntries";
import { useIsNarrowViewport } from "./useIsNarrowViewport";

type MonthCalendarProps = {
  month: YearMonthOption;
  /** The month's entries from months.get, in the server's order. */
  entries: readonly EntryDto[];
  /** The month's holidays from months.get, labelled by name in their days. */
  holidays: CalendarHoliday[];
  selectedEntryIds: readonly string[];
  /** Ids of entries a drag move is saving, which show it on their chips. */
  busyEntryIds?: ReadonlySet<string>;
  /** Days a drag move is saving to or from, whose chips ignore clicks. */
  busyDates?: ReadonlySet<string>;
  /**
   * Called with a chip's entry id when it's clicked, or gets Enter or Space.
   * Without it, as for a month editors can't change, chips can't be selected
   * or focused.
   */
  onEntryClick?: (entryId: string) => void;
  /**
   * True turns dragging off: for a month editors can't change, and while a
   * move is running, so a second drag can't send an entry's old version.
   * Defaults to true.
   */
  readOnly?: boolean;
  /**
   * Called with every entry a drop moves and the day, "YYYY-MM-DD". The grid
   * puts the dragged chip back itself, so the month's data decides where the
   * entries show.
   */
  onEntriesDrop?: (entryIds: string[], date: string) => void;
};

const sameGridEntry = (a: CalendarGridEntry, b: CalendarGridEntry) =>
  a.id === b.id &&
  a.date === b.date &&
  a.label === b.label &&
  a.kind === b.kind &&
  a.cancelled === b.cancelled &&
  a.title === b.title;

const sameHoliday = (a: CalendarHoliday, b: CalendarHoliday) =>
  a.date === b.date && a.name === b.name;

/**
 * The month's entries on the shared CalendarGrid, in the calendar's timezone
 * from config.get. Chips can be dropped only on the calendar's allowed
 * weekdays from config.get (Monday to Friday for US_CO). The grid always
 * starts on Sunday with weekend columns, as the design shows, while
 * Colorado's data starts weeks on Monday for its rules and counts. Narrow
 * viewports get the list view. A cancelled meeting's chip says "Cancelled"
 * in plain red text above its label, as the design draws it. Each holiday
 * is labelled by name in its day, and nothing stops an entry from sitting
 * on a holiday.
 */
export function MonthCalendar({
  month,
  entries,
  holidays,
  selectedEntryIds,
  busyEntryIds,
  busyDates,
  onEntryClick,
  readOnly = true,
  onEntriesDrop,
}: MonthCalendarProps) {
  const { data: config } = useCalendarConfig();
  const narrow = useIsNarrowViewport();

  // A background refetch returns new entry and holiday objects even when
  // nothing changed, so the grid keeps its lists until one differs and
  // FullCalendar doesn't rebuild its events.
  const gridHolidays = useStableList(holidays, sameHoliday);
  const mapped = useMemo(
    () => toGridEntries(entries, config.resources),
    [entries, config.resources],
  );
  const gridEntries = useStableList(mapped, sameGridEntry);

  return (
    <CalendarGrid
      month={month}
      entries={gridEntries}
      holidays={gridHolidays}
      view={narrow ? "list" : "month"}
      timeZone={config.calendar.timezone}
      firstDay={0}
      cancelledTag="text"
      readOnly={readOnly}
      allowedWeekdays={config.calendar.allowedWeekdays}
      onEntriesDrop={onEntriesDrop}
      selectedEntryIds={selectedEntryIds}
      busyEntryIds={busyEntryIds}
      busyDates={busyDates}
      onEntryClick={onEntryClick}
      ariaLabel={`${formatMonthYear(month)} calendar`}
    />
  );
}
