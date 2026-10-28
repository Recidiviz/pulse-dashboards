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

import type { ReactNode } from "react";

import type { CalendarWeekday } from "./dates";

/**
 * One item on the grid. The admin page builds it from a calendar entry and
 * the public site from a snapshot entry, which has no id, so the public site
 * builds one such as "2026-09-24-3".
 */
export interface CalendarGridEntry {
  /** Stable key, unique within the month. */
  id: string;
  /** A calendar date with no time, "YYYY-MM-DD". */
  date: string;
  /** The resource label, else the kind label: "FCF", "Full Board", "Business Meeting". */
  label: string;
  /** The kind code, such as "HEARING". Kinds are data, so this is a plain string. */
  kind: string;
  cancelled: boolean;
  /** Short flag text shown as a badge on the chip, such as a holiday name. */
  flag?: string | null;
  /**
   * Hover text for the chip, such as a facility's full name while the chip
   * shows its abbreviation. Falls back to label.
   */
  title?: string;
}

export interface CalendarHoliday {
  /** "YYYY-MM-DD" */
  date: string;
  /** The holiday's name as shown, such as "Labor Day". */
  name: string;
}

export interface CalendarMonthRef {
  year: number;
  /** 1 to 12 */
  month: number;
}

export interface CalendarGridProps {
  month: CalendarMonthRef;
  /** Already sorted; each day renders its entries in this order. */
  entries: CalendarGridEntry[];
  holidays?: CalendarHoliday[];
  /** "month" (the default) is the grid; "list" lists only days with entries. */
  view?: "month" | "list";
  /** Defaults to true. False lets editors drag chips between days. */
  readOnly?: boolean;
  /** Ids of the selected entries; each gets an outline and aria-pressed. */
  selectedEntryIds?: readonly string[];
  /**
   * Weekdays a chip may be dropped on, from the calendar's allowedWeekdays
   * setting. Defaults to every day. Other days get no drop outline and refuse
   * the drop. The grid still shows them.
   */
  allowedWeekdays?: readonly CalendarWeekday[];
  /** IANA time zone from the calendar's settings, such as "America/Denver". */
  timeZone: string;
  /** First column of the week, 0 (Sunday) to 6, from weekStartsOnToFirstDay. */
  firstDay: number;
  /** Accessible name for the grid, such as "September 2026 calendar". */
  ariaLabel?: string;
  /**
   * Called when a chip is clicked or, when focused, gets Enter or Space. The
   * caller toggles the entry's selection. Without it, chips aren't focusable.
   */
  onEntryClick?: (entryId: string) => void;
  /**
   * Called when chips are dragged to another day, with "YYYY-MM-DD". Dragging
   * a selected chip passes every selected entry not already on that day;
   * dragging an unselected chip passes only that one. The grid puts the chip
   * back, and the caller moves the entries in its data.
   */
  onEntriesDrop?: (entryIds: string[], date: string) => void;
  /** Replaces the default chip body. */
  renderEntry?: (entry: CalendarGridEntry) => ReactNode;
  /** Replaces the default holiday label, the holiday's name. */
  renderHolidayLabel?: (holiday: CalendarHoliday) => ReactNode;
}
