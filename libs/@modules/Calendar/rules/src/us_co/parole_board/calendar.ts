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

import type { CalendarRules } from "../../calendarRules";
import type { CalendarSettings } from "../../types";
import {
  US_CO_PAROLE_BOARD_ENTRY_TYPES,
  UsCoParoleBoardKindCode,
} from "./entryTypes";
import { adjustUsCoParoleBoardDraft } from "./generation";

/**
 * The Colorado Parole Board's public hearing calendar: the Calendar row its
 * API reads and writes. The API is fixed to this row, so no request names a
 * state or a calendar code.
 */
export const US_CO_PAROLE_BOARD = {
  stateCode: "US_CO",
  code: "PAROLE_BOARD_PUBLIC",
} as const;

/**
 * The Parole Board calendar's settings. They're code, not columns, so a
 * change goes through review like any other behaviour change.
 */
export const US_CO_PAROLE_BOARD_SETTINGS: CalendarSettings = {
  timezone: "America/Denver",
  // Pattern weeks run Monday to Friday, the Board's working week. The
  // editor grid still shows Sunday first; that's display only.
  weekStartsOn: "MONDAY",
  // Week N of a month is its Nth Monday, Nth Tuesday and so on, as the Board
  // counts them in its March and April 2027 drafts: the 1st Thursday of
  // April 2027 is April 1. Weeks 1 to 4 never leave the month.
  weekNumbering: "NTH_WEEKDAY_IN_MONTH",
  holidayRegion: "US-CO",
  // Publishing warns about entries on a holiday but doesn't block.
  holidayPolicy: "WARN",
  // Staff with this route can edit the calendar.
  editorRoute: "publicCalendar",
  // The Board holds no hearings or meetings at weekends, so the
  // generator never drafts one there and the API refuses to add or move one
  // there.
  allowedWeekdays: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"],
};

/** The Parole Board calendar's rules for the generic engine. */
export const US_CO_PAROLE_BOARD_RULES: CalendarRules<UsCoParoleBoardKindCode> =
  {
    settings: US_CO_PAROLE_BOARD_SETTINGS,
    entryTypes: US_CO_PAROLE_BOARD_ENTRY_TYPES,
    // The 3rd-Thursday rule.
    adjustDraftMonth: adjustUsCoParoleBoardDraft,
  };
