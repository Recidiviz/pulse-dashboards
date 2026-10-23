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

import { IsoDate } from "../types";

/** One holiday on one date, e.g. { date: "2026-09-07", name: "Labor Day" }. */
export interface Holiday {
  date: IsoDate;
  name: string;
}

/** Inclusive on both ends. */
export interface DateRange {
  start: IsoDate;
  end: IsoDate;
}

export interface HolidaySource {
  /** Stable id for logs and tests, e.g. "dhr-static:2026-01-01..2027-06-30". */
  readonly id: string;
  /**
   * Holidays dated within the range, sorted by date. Synchronous on purpose:
   * a list loaded from a database is wrapped with staticHolidaySource first.
   */
  getHolidays(range: DateRange): Holiday[];
}
