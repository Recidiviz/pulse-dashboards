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

import {
  CalendarCenter,
  CalendarHeader,
  CalendarMonthIconButton,
  CalendarYearIconButton,
  CalendarYearStack,
} from "./DatePicker.styles";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/**
 * Default calendar header used by `DatePicker`: month + year text in the
 * center with grouped year-up/down caret buttons, and prev/next-month
 * arrow buttons on the outside.
 */
export function DatePickerHeader({
  date,
  changeYear,
  decreaseMonth,
  increaseMonth,
}: ReactDatePickerCustomHeaderProps) {
  const year = date.getFullYear();
  return (
    <CalendarHeader>
      <CalendarMonthIconButton
        onClick={decreaseMonth}
        aria-label="Previous month"
      >
        <Icon
          kind="Arrow"
          color={palette.pine3}
          style={{ transform: "scaleX(-1)" }}
        />
      </CalendarMonthIconButton>
      <CalendarCenter>
        <span>
          {MONTHS[date.getMonth()]} {year}
        </span>
        <CalendarYearStack>
          <CalendarYearIconButton
            onClick={() => changeYear(year + 1)}
            aria-label="Next year"
          >
            <Icon
              kind="Caret"
              color={palette.pine3}
              style={{ transform: "scaleY(-1)" }}
            />
          </CalendarYearIconButton>
          <CalendarYearIconButton
            onClick={() => changeYear(year - 1)}
            aria-label="Previous year"
          >
            <Icon kind="Caret" color={palette.pine3} />
          </CalendarYearIconButton>
        </CalendarYearStack>
      </CalendarCenter>
      <CalendarMonthIconButton onClick={increaseMonth} aria-label="Next month">
        <Icon kind="Arrow" color={palette.pine3} />
      </CalendarMonthIconButton>
    </CalendarHeader>
  );
}
