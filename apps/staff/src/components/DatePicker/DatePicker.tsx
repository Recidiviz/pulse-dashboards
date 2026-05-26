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

import * as React from "react";
import ReactDatePicker, {
  DatePickerProps as ReactDatePickerProps,
} from "react-datepicker";

import { DatePickerWrapper } from "./DatePicker.styles";
import { DatePickerHeader } from "./DatePickerHeader";

export type DatePickerProps = ReactDatePickerProps;

/**
 * Thin styled wrapper around `react-datepicker`. Forwards every library prop
 * untouched and supplies repo-default styling, header, and popper placement.
 * Caller-supplied props win over our defaults (the spread is positioned
 * after them), so any slot — `renderCustomHeader`, `calendarContainer`,
 * `customInput`, `dateFormat`, etc. — can be overridden without forking.
 */
export const DatePicker = React.forwardRef<ReactDatePicker, DatePickerProps>(
  function DatePicker(props, ref) {
    return (
      <DatePickerWrapper>
        <ReactDatePicker
          ref={ref}
          showPopperArrow={false}
          popperPlacement="bottom-start"
          dateFormat="MM/dd/yyyy"
          // Keep the popper open after a day is picked so users can keep
          // navigating (and so callers like `DatePickerWithRecurrence` can
          // expose a footer the user interacts with after picking a date).
          // The popper still closes on click-outside / blur via
          // `react-datepicker`'s built-in handlers.
          shouldCloseOnSelect={false}
          renderCustomHeader={(headerProps) => (
            <DatePickerHeader {...headerProps} />
          )}
          {...props}
        />
      </DatePickerWrapper>
    );
  },
);
