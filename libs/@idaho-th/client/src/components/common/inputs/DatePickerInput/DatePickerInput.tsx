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

import "react-datepicker/dist/react-datepicker.css";

import { format, isValid, parse } from "date-fns";
import React from "react";
import DatePicker from "react-datepicker";

import { Icon } from "~design-system";

import type { DatePickerVariant } from "./DatePickerInput.styles";
import * as Styled from "./DatePickerInput.styles";

const MM_DD_YYYY = "MM/dd/yyyy";

const parseSelectedDate = (value: string | null | undefined): Date | null => {
  if (!value) return null;
  const d = parse(value, MM_DD_YYYY, new Date());
  return isValid(d) ? d : null;
};

const formatMmDdYyyy = (raw: string): string | undefined => {
  const digits = raw.replace(/[^\d]/g, "").slice(0, 8);
  const mm = digits.slice(0, 2);
  const dd = digits.slice(2, 4);
  const yyyy = digits.slice(4, 8);
  if (digits.length <= 2) return mm;
  if (digits.length <= 4) return `${mm}/${dd}`;
  return `${mm}/${dd}/${yyyy}`;
};

export interface DatePickerInputProps {
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  onBlur?: () => void;
  disabled?: boolean;
  id?: string;
  name?: string;
  hasError?: boolean;
  variant?: DatePickerVariant;
  /** Earliest selectable calendar day. Only blocks calendar clicks — typed input still reaches `onChange`. */
  minDate?: Date;
  placeholder?: string;
  "aria-label"?: string;
  "aria-describedby"?: string;
}

export const DatePickerInput: React.FC<DatePickerInputProps> = ({
  value,
  onChange,
  onBlur,
  disabled,
  id,
  name,
  hasError,
  variant,
  minDate,
  placeholder = "mm/dd/yyyy",
  "aria-label": ariaLabel,
  "aria-describedby": ariaDescribedBy,
}) => {
  const displayValue = value ?? "";
  const selectedDate = parseSelectedDate(value);
  const openToDate =
    selectedDate && minDate && selectedDate < minDate ? minDate : undefined;

  const handleCalendarChange = (date: Date | null) => {
    if (!date || !isValid(date)) {
      onChange(null);
      return;
    }
    onChange(format(date, MM_DD_YYYY));
  };

  const handleChangeRaw = (
    event?: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>,
    selectionMeta?: { date: Date; formattedDate: string },
  ) => {
    if (selectionMeta) return;
    if (!event?.target || !(event.target instanceof HTMLInputElement)) return;

    const formatted = formatMmDdYyyy(event.target.value);
    event.target.value = formatted ?? "";
    onChange(formatted ? formatted : null);
    event.preventDefault();
  };

  return (
    <Styled.Shell>
      <Styled.DatePickerGlobalStyle />
      <DatePicker
        selected={selectedDate}
        value={displayValue}
        onChange={handleCalendarChange}
        onChangeRaw={handleChangeRaw}
        onBlur={onBlur}
        minDate={minDate}
        openToDate={openToDate}
        ariaInvalid={hasError ? "true" : "false"}
        ariaDescribedBy={ariaDescribedBy}
        dateFormat={MM_DD_YYYY}
        placeholderText={placeholder}
        disabled={disabled}
        popperClassName="idaho-th-datepicker"
        portalId="idaho-th-datepicker-portal"
        showIcon
        toggleCalendarOnIconClick
        icon={
          <Styled.CalendarIconWrapper aria-label="Open calendar">
            <Icon kind="CalendarSimple" size={16} />
          </Styled.CalendarIconWrapper>
        }
        customInput={
          <Styled.Input
            id={id}
            name={name}
            $hasError={hasError}
            $variant={variant}
            aria-label={ariaLabel}
            autoComplete="off"
            inputMode="numeric"
            maxLength={10}
          />
        }
      />
    </Styled.Shell>
  );
};
