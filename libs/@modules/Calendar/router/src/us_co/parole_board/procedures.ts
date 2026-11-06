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

import {
  US_CO_PAROLE_BOARD,
  US_CO_PAROLE_BOARD_RULES,
  type UsCoParoleBoardKindCode,
} from "~@modules/Calendar/rules/us_co/parole_board";

import {
  createCalendarEditorProcedure,
  createCalendarPublicProcedure,
  type FixedCalendar,
} from "../../procedures";

/**
 * The calendar Colorado's API serves: US_CO's PAROLE_BOARD_PUBLIC row, with
 * Colorado's rules. No request names a state or a calendar.
 */
export const US_CO_PAROLE_BOARD_CALENDAR: FixedCalendar<UsCoParoleBoardKindCode> =
  { ...US_CO_PAROLE_BOARD, rules: US_CO_PAROLE_BOARD_RULES };

/**
 * An editor of the Parole Board calendar: a US_CO user with the
 * publicCalendar route from Colorado's settings (Auth0 sends it as
 * parole_publicCalendar), or any Recidiviz user. Both must send
 * the US_CO StateCode header.
 */
export const usCoPublicCalendarEditorProcedure = createCalendarEditorProcedure(
  US_CO_PAROLE_BOARD_CALENDAR,
);

/** The anonymous public read of the Parole Board calendar. */
export const usCoPublicCalendarAnonymousProcedure =
  createCalendarPublicProcedure(US_CO_PAROLE_BOARD_CALENDAR);
