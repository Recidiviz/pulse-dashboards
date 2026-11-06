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

import type { GenerateMonthDraftInput, MonthDraft } from "./draft/types";
import type { CalendarSettings } from "./types";

/**
 * How entries of one kind behave. Each state's code lists its calendar's entry
 * types; the database stores only each kind's code, label and sortOrder.
 */
export interface CalendarEntryType<Code extends string = string> {
  /** The kind's code, the same as its CalendarEntryKind row's, e.g. "HEARING". */
  code: Code;
  /** True when every entry of this kind names a resource; false when none does. */
  requiresResource: boolean;
  /** Whether editors can cancel and un-cancel entries of this kind. */
  cancellable: boolean;
  /** Whether editors can delete entries of this kind. */
  deletable: boolean;
  /**
   * Whether entries of this kind appear on the public calendar, which shows
   * the live entries of published months.
   */
  isPublic: boolean;
  /** Whether entries of this kind count toward entryDays and entryCount. */
  countsTowardTotal: boolean;
}

/**
 * What a calendar's own code gives the generic engine: its settings and its
 * entry types. Each calendar's API passes its rules object to the
 * engine, so the engine never looks a calendar's behaviour up by name.
 */
export interface CalendarRules<Code extends string = string> {
  settings: CalendarSettings;
  /** Every entry type the calendar uses, one per CalendarEntryKind row. */
  entryTypes: readonly CalendarEntryType<Code>[];
  /**
   * The state's changes to a generated draft that patterns can't express,
   * such as Colorado's 3rd-Thursday rule. generateMonthDraft runs it last.
   * Without it, the generic draft stands. The generic draft leaves dates past
   * month end out of entries and lists them in outsideMonth.
   */
  adjustDraftMonth?: (
    draft: MonthDraft,
    input: GenerateMonthDraftInput,
  ) => MonthDraft;
}
