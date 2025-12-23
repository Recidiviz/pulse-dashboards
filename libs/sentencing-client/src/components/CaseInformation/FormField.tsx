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

import moment from "moment";
import React, { useState } from "react";

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
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  value,
  onChange,
  type = "text",
  helperText,
  placeholder,
  inline = false,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  // Handle date picker
  const [pickerDate, setPickerDate] = useState<Date | null>(
    value && type === "date" ? new Date(value as string) : null,
  );

  const handleDateChange = (date: Date | null) => {
    setPickerDate(date);
    if (date) {
      // Format as YYYY-MM-DD
      const formatted = moment(date).utc().format("YYYY-MM-DD");
      onChange(formatted);
    } else {
      onChange("");
    }
  };

  const inputElement =
    type === "date" ? (
      <Styled.CustomDatePickerWrapper>
        <SharedDatePicker
          selected={pickerDate}
          onChange={handleDateChange}
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
          placeholder={placeholder}
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
