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

import { currentYearMonth } from "~@modules/Calendar/rules";
import type { YearMonthOption } from "~@parole-board/common";
import { useCalendarConfig } from "~@parole-board/common";

/**
 * The current month in the calendar's timezone (America/Denver for Colorado),
 * from config.get. The timezone is a calendar setting, so this never reads
 * the browser's own.
 */
export function useCurrentYearMonth(): YearMonthOption {
  const { data: config } = useCalendarConfig();
  return currentYearMonth(config.calendar.timezone);
}
