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

import { DayNumberText, DayTop } from "./CalendarGrid.styles";

type DayCellTopProps = {
  dayNumberText: string;
  isWeekend: boolean;
};

/**
 * The top of a day cell: the day number. It's hidden from screen readers,
 * since FullCalendar labels each cell with its full date. A holiday's label
 * sits below the chips, as an event (see CalendarGrid).
 */
export function DayCellTop({ dayNumberText, isWeekend }: DayCellTopProps) {
  return (
    <DayTop>
      <DayNumberText aria-hidden $weekend={isWeekend}>
        {dayNumberText}
      </DayNumberText>
    </DayTop>
  );
}
