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

import type { CalendarRules } from "../calendarRules";
import type { Holiday } from "../holidays/types";
import type { IsoDate, PatternRule, YearMonth } from "../types";

/**
 * A CalendarEntryKind row, as the draft generator reads it. Its behaviour
 * comes from the entry type with the same code in the calendar's rules.
 */
export interface DraftKind {
  id: string;
  calendarId: string;
  /** CalendarEntryKind.code, e.g. "HEARING" or "FULL_BOARD". */
  code: string;
  /** Used in notice copy. */
  label: string;
  sortOrder: number;
}

/** A CalendarResource row, as the draft generator reads it. */
export interface DraftResource {
  id: string;
  calendarId: string;
  /** CalendarResource.code, copied into the slotKey. */
  code: string;
  /** Used in notice copy. */
  label: string;
  sortOrder: number;
  isActive: boolean;
}

/** One slot's current CalendarEntryPattern. */
export interface DraftPattern {
  kindId: string;
  /** Set exactly when the kind requires a resource. */
  resourceId: string | null;
  /** From the pattern's JSON column, so the generator checks them with parsePatternRules. */
  rules: PatternRule[];
  /** "HH:mm". */
  startTime: string | null;
  /** "HH:mm", after startTime. */
  endTime: string | null;
}

export interface GenerateMonthDraftInput {
  calendarId: string;
  yearMonth: YearMonth;
  /**
   * The calendar's rules from its state's code: its settings, its entry
   * types and, optionally, the state's own changes to a draft.
   */
  rules: CalendarRules;
  kinds: DraftKind[];
  resources: DraftResource[];
  patterns: DraftPattern[];
  /**
   * Holidays covering at least this month, from getHolidays for the calendar's
   * holidayRegion. Holidays outside the month are ignored.
   */
  holidays: Holiday[];
}

/** One entry of a new draft month. */
export interface DraftEntry {
  date: IsoDate;
  kindId: string;
  kindCode: string;
  /** Null for a kind with no resource. */
  resourceId: string | null;
  /** From entrySlotKey: "HEARING:FCF" or "FULL_BOARD". */
  slotKey: string;
  /** Copied from the pattern. */
  startTime: string | null;
  /** Copied from the pattern. */
  endTime: string | null;
  source: "PATTERN";
}

/** A date a pattern makes in the next month, which the draft leaves out. */
export interface OutsideMonthEntry {
  /** In the next month. */
  date: IsoDate;
  kindId: string;
  kindCode: string;
  resourceId: string | null;
  slotKey: string;
  /** The resource's label, or the kind's when there's no resource. */
  label: string;
  rule: PatternRule;
  startTime: string | null;
  endTime: string | null;
}

/** Something the editor should know about a new draft, with copy to show them. */
export type DraftNotice =
  | { code: "KIND_WITHOUT_PATTERN"; kindCode: string; message: string }
  | { code: "ENTRIES_OUTSIDE_MONTH"; message: string; count: number }
  /**
   * A state's rules moved entries to another day, and some couldn't go there
   * because their slot already had that day or it's a holiday.
   */
  | { code: "ENTRIES_NOT_MOVED"; message: string; count: number };

/** The generated entries for a new draft month, and what was left out. */
export interface MonthDraft {
  yearMonth: YearMonth;
  entries: DraftEntry[];
  outsideMonth: OutsideMonthEntry[];
  /** Holidays inside this month, sorted by date. */
  holidays: Holiday[];
  notices: DraftNotice[];
}
