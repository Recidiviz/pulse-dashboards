// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import React, { ReactNode } from "react";
import DatePicker, { ReactDatePickerCustomHeaderProps } from "react-datepicker";

import Arrow from "../assets/left-arrow-carot-icon.svg?react";
import DownArrow from "../assets/sort-down-icon.svg?react";
import UpArrow from "../assets/sort-up-icon.svg?react";
import * as CaseDetailsStyled from "../CaseDetails/CaseDetails.styles";

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

const DatePickerHeader = ({
  date,
  changeYear,
  changeMonth,
  decreaseMonth,
  increaseMonth,
  prevMonthButtonDisabled,
  nextMonthButtonDisabled,
}: ReactDatePickerCustomHeaderProps) => (
  <CaseDetailsStyled.CalendarHeader>
    <CaseDetailsStyled.CalendarMonthIconButton
      onClick={decreaseMonth}
      aria-label="Previous month"
    >
      <Arrow aria-hidden="true" />
    </CaseDetailsStyled.CalendarMonthIconButton>
    <CaseDetailsStyled.CalendarCenter>
      <span>
        {MONTHS[date.getMonth()]} {date.getFullYear()}
      </span>

      <CaseDetailsStyled.CalendarYearStack>
        <CaseDetailsStyled.CalendarYearIconButton
          onClick={() => changeYear(date.getFullYear() + 1)}
          aria-label="Next year"
        >
          <UpArrow aria-hidden="true" />
        </CaseDetailsStyled.CalendarYearIconButton>

        <CaseDetailsStyled.CalendarYearIconButton
          onClick={() => changeYear(date.getFullYear() - 1)}
          aria-label="Previous year"
        >
          <DownArrow aria-hidden="true" />
        </CaseDetailsStyled.CalendarYearIconButton>
      </CaseDetailsStyled.CalendarYearStack>
    </CaseDetailsStyled.CalendarCenter>

    <CaseDetailsStyled.CalendarMonthIconButton
      onClick={increaseMonth}
      aria-label="Next month"
    >
      <Arrow aria-hidden="true" style={{ transform: "scaleX(-1)" }} />
    </CaseDetailsStyled.CalendarMonthIconButton>
  </CaseDetailsStyled.CalendarHeader>
);

interface SharedDatePickerProps {
  selected: Date | null | undefined;
  onChange: (date: Date | null) => void;
  showIcon?: boolean;
  icon?: ReactNode;
  resetButton?: ReactNode;
  placeholder?: string;
}

export const SharedDatePicker: React.FC<SharedDatePickerProps> = ({
  selected,
  onChange,
  showIcon = false,
  icon,
  resetButton,
  placeholder,
}) => {
  return (
    <>
      <CaseDetailsStyled.DatePickerWrapper>
        <DatePicker
          shouldCloseOnSelect={false}
          showPopperArrow={false}
          renderCustomHeader={DatePickerHeader}
          showIcon={showIcon}
          icon={icon}
          popperClassName="rcd-cal"
          popperPlacement="bottom-start"
          selected={selected}
          onChange={onChange}
          placeholderText={placeholder}
        />
      </CaseDetailsStyled.DatePickerWrapper>
      {resetButton}
    </>
  );
};
