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

import CheckIcon from "../../../assets/check.svg?react";
import * as Styled from "./Checkbox.styles";

export interface CheckboxProps {
  checked: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  size?: number;
  disabled?: boolean;
  id?: string;
  "aria-label"?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onChange,
  size = 20,
  disabled,
  id,
  "aria-label": ariaLabel,
}) => {
  return (
    <Styled.Label>
      <Styled.HiddenInput
        id={id}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        aria-label={ariaLabel}
      />
      <Styled.CheckboxBox
        $checked={checked}
        $sizePx={size}
        $disabled={disabled}
        aria-hidden
      >
        {checked && <CheckIcon />}
      </Styled.CheckboxBox>
    </Styled.Label>
  );
};
