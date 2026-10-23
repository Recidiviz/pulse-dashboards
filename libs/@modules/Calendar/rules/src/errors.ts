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

/**
 * Why a calendar rules function rejected its input. The calendar API maps
 * every code to a tRPC BAD_REQUEST unless its procedure says otherwise.
 */
export type CalendarRulesErrorCode =
  | "INVALID_DATE"
  | "INVALID_DATE_RANGE"
  | "INVALID_YEAR_MONTH"
  | "INVALID_ENTRY"
  | "INVALID_RULE"
  | "ANCHOR_WEEKDAY_MISMATCH"
  | "INVALID_SETTINGS"
  | "INVALID_TIME_ZONE";

/** Thrown by every public function in this library when its input is invalid. */
export class CalendarRulesError extends Error {
  readonly code: CalendarRulesErrorCode;

  constructor(code: CalendarRulesErrorCode, message: string) {
    super(message);
    this.name = "CalendarRulesError";
    this.code = code;
  }
}
