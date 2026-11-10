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

import React from "react";

import * as Styled from "./TextInput.styles";

export interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  id?: string;
  hasError?: boolean;
  errorText?: string;
  placeholder?: string;
  maxLength?: number;
  "aria-label"?: string;
}

export const TextInput: React.FC<TextInputProps> = ({
  value,
  onChange,
  onKeyDown,
  disabled,
  id,
  hasError,
  errorText,
  placeholder,
  maxLength,
  "aria-label": ariaLabel,
}) => (
  <>
    <Styled.Input
      id={id}
      type="text"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={onKeyDown}
      disabled={disabled}
      placeholder={placeholder}
      maxLength={maxLength}
      $hasError={hasError}
      aria-invalid={hasError}
      aria-label={ariaLabel}
    />
    {hasError && errorText && (
      <Styled.ErrorText role="alert">{errorText}</Styled.ErrorText>
    )}
  </>
);
