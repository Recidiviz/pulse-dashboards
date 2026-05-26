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

import { ReactDatePickerCustomHeaderProps } from "react-datepicker";

import { Icon, palette } from "~design-system";

import { CalendarHeader, CalendarMonthIconButton } from "./DatePicker.styles";

/**
 * Year-only header for `<DatePicker showMonthYearPicker />` mode. Pair with
 * `dateFormat="MM/yyyy"` to render a picker that selects a calendar month.
 */
export function MonthYearHeader({
  date,
  decreaseYear,
  increaseYear,
}: ReactDatePickerCustomHeaderProps) {
  return (
    <CalendarHeader>
      <CalendarMonthIconButton
        onClick={decreaseYear}
        aria-label="Previous year"
      >
        <Icon
          kind="Arrow"
          color={palette.pine3}
          style={{ transform: "scaleX(-1)" }}
        />
      </CalendarMonthIconButton>
      <span>{date.getFullYear()}</span>
      <CalendarMonthIconButton onClick={increaseYear} aria-label="Next year">
        <Icon kind="Arrow" color={palette.pine3} />
      </CalendarMonthIconButton>
    </CalendarHeader>
  );
}
