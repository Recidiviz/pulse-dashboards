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

import {
  CheckboxBox,
  CheckboxContainer,
  CheckboxInput,
  CheckboxLabel,
} from "./CheckboxGroup.styles";

type CheckboxProps = {
  value: string;
  name?: string;
  checked: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
  onChange: () => void;
  children?: React.ReactNode;
};

const Checkbox: React.FC<CheckboxProps> = ({
  value,
  checked,
  indeterminate = false,
  name,
  disabled = false,
  onChange,
  children,
}) => {
  return (
    <CheckboxContainer>
      <CheckboxLabel>{children}</CheckboxLabel>
      <CheckboxInput
        data-testid={`checkbox-${name ?? value}`}
        type="checkbox"
        name={name}
        checked={checked}
        value={value}
        onChange={onChange}
        disabled={disabled}
        tabIndex={0}
      />
      <CheckboxBox
        $checked={checked}
        $indeterminate={indeterminate}
        $disabled={disabled}
      />
    </CheckboxContainer>
  );
};

export default Checkbox;
