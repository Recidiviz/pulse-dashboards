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

import { observer } from "mobx-react-lite";
import { useState } from "react";
import DatePicker, { ReactDatePickerCustomHeaderProps } from "react-datepicker";

import CalendarIcon from "../../../../components/assets/calendar-icon.svg?react";
import Arrow from "../../../../components/assets/left-arrow-carot-icon.svg?react";
import DownArrow from "../../../../components/assets/sort-down-icon.svg?react";
import UpArrow from "../../../../components/assets/sort-up-icon.svg?react";
import { useStore } from "../../../StoreProvider/StoreProvider";
import * as Styled from "../../CaseDetails.styles";
import { CUSTOM_DUE_DATE_KEY } from "../../constants";
import { form } from "../FormStore";
import { FormFieldProps } from "../types";
function CustomDueDateField({ isRequired }: FormFieldProps) {
  const { caseStore } = useStore();
  const caseAttributes = caseStore.caseAttributes;
  const [selectedDate, setSelectedDate] = useState<Date | null | undefined>(
    caseAttributes.dueDate,
  );
  function updateCustomDueDate(date: Date | null | undefined) {
    if (date) {
      setSelectedDate(date);
      form.updateForm(CUSTOM_DUE_DATE_KEY, date);
    } else {
      setSelectedDate(caseAttributes.dueDate);
    }
  }
  return (
    <>
      <Styled.InputLabel>
        Due {isRequired && <span>Required*</span>}
      </Styled.InputLabel>
      <div style={{ display: "flex", flexDirection: "row", width: "100%" }}>
        <Styled.DatePickerWrapper>
          <DatePicker
            shouldCloseOnSelect={false}
            showPopperArrow={false}
            renderCustomHeader={DatePickerHeader}
            showIcon
            popperClassName="rcd-cal"
            popperPlacement="bottom-start"
            icon={<CalendarIcon />}
            selected={selectedDate}
            onChange={(date: Date | null) => updateCustomDueDate(date)}
          />
        </Styled.DatePickerWrapper>
        <div>
          {selectedDate !== caseAttributes.dueDate && (
            <Styled.CalendarResetButton
              type="button"
              onClick={() => updateCustomDueDate(caseAttributes.dueDate)}
            >
              Reset
            </Styled.CalendarResetButton>
          )}
        </div>
      </div>
    </>
  );
}

export default observer(CustomDueDateField);
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
  <Styled.CalendarHeader>
    <Styled.CalendarMonthIconButton
      onClick={decreaseMonth}
      aria-label="Previous month"
    >
      <Arrow aria-hidden="true" />
    </Styled.CalendarMonthIconButton>
    <Styled.CalendarCenter>
      <span>
        {MONTHS[date.getMonth()]} {date.getFullYear()}
      </span>

      <Styled.CalendarYearStack>
        <Styled.CalendarYearIconButton
          onClick={() => changeYear(date.getFullYear() + 1)}
          aria-label="Next year"
        >
          <UpArrow aria-hidden="true" />
        </Styled.CalendarYearIconButton>

        <Styled.CalendarYearIconButton
          onClick={() => changeYear(date.getFullYear() - 1)}
          aria-label="Previous year"
        >
          <DownArrow aria-hidden="true" />
        </Styled.CalendarYearIconButton>
      </Styled.CalendarYearStack>
    </Styled.CalendarCenter>

    <Styled.CalendarMonthIconButton
      onClick={increaseMonth}
      aria-label="Next month"
    >
      <Arrow aria-hidden="true" style={{ transform: "scaleX(-1)" }} />
    </Styled.CalendarMonthIconButton>
  </Styled.CalendarHeader>
);
