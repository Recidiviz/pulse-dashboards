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

import React, { useState } from "react";

import { localDateFromUtcDate, localDateToUtcIsoDate } from "../../utils/utils";
import { SharedDatePicker } from "../shared/SharedDatePicker";
import * as Styled from "./FormField.styles";

interface FormFieldProps {
  label: string;
  value?: string | number | null;
  onChange: (value: string) => void;
  type?: "text" | "date";
  helperText?: string;
  placeholder?: string;
  inline?: boolean;
  showValidation?: boolean;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  value,
  onChange,
  type = "text",
  helperText,
  placeholder,
  inline = false,
  showValidation = true,
}) => {
  const [touched, setTouched] = useState(false);
  const [pickerDate, setPickerDate] = useState<Date | null>(
    typeof value === "string" && value !== "" && type === "date"
      ? localDateFromUtcDate(value)
      : null,
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const isEmpty =
    type === "date"
      ? pickerDate === null
      : !value || String(value).trim() === "";
  const hasError = showValidation && touched && isEmpty;

  const handleDateChange = (date: Date | null) => {
    setPickerDate(date);
    onChange(date ? localDateToUtcIsoDate(date) : "");
  };

  const inputElement =
    type === "date" ? (
      <Styled.CustomDatePickerWrapper $hasError={hasError}>
        <SharedDatePicker
          selected={pickerDate}
          onChange={handleDateChange}
          onCalendarClose={() => setTouched(true)}
          placeholder={placeholder}
        />
      </Styled.CustomDatePickerWrapper>
    ) : (
      <Styled.InputWrapper $inline={inline}>
        <Styled.InputBase
          $inline={inline}
          type={type}
          value={value || ""}
          onChange={handleChange}
          onBlur={() => setTouched(true)}
          placeholder={placeholder}
          $hasError={hasError}
        />
      </Styled.InputWrapper>
    );

  return (
    <Styled.FieldContainer>
      {inline ? (
        <Styled.InlineRow>
          <Styled.Label>{label}</Styled.Label>
          {inputElement}
        </Styled.InlineRow>
      ) : (
        <>
          <Styled.Label>{label}</Styled.Label>
          {inputElement}
        </>
      )}

      {helperText && <Styled.HelperText>{helperText}</Styled.HelperText>}
    </Styled.FieldContainer>
  );
};
