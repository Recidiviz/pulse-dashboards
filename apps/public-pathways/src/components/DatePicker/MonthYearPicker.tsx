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
import ReactDatePicker from "react-datepicker";

import { MonthYearHeader } from "./MonthYearHeader";
import { MonthYearPickerWrapper } from "./MonthYearPicker.styles";

export interface MonthYearPickerProps {
  className?: string;
  selected: Date | null;
  onChange: (date: Date | null) => void;
  minDate?: Date;
  maxDate?: Date;
}

/**
 * An always-visible (not popover-triggered) calendar restricted to picking a
 * single month/year, e.g. for choosing which monthly snapshot to export.
 * Uses `react-datepicker`'s `inline` mode, which renders the calendar
 * directly in place instead of behind a text input.
 */
export const MonthYearPicker: React.FC<MonthYearPickerProps> = ({
  className,
  selected,
  onChange,
  minDate,
  maxDate,
}) => {
  return (
    <MonthYearPickerWrapper className={className}>
      <ReactDatePicker
        selected={selected}
        onChange={onChange}
        minDate={minDate}
        maxDate={maxDate}
        showMonthYearPicker
        inline
        renderCustomHeader={(headerProps) => (
          <MonthYearHeader {...headerProps} />
        )}
      />
    </MonthYearPickerWrapper>
  );
};
