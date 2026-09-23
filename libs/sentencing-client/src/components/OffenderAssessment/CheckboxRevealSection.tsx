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
  Checkbox,
  CheckboxContainer,
  CheckboxLabel,
} from "../shared/styles/CheckboxStyles";
import * as Styled from "./CheckboxRevealSection.styles";

interface CheckboxRevealSectionProps {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => Promise<void>;
  disabled?: boolean;
  children: React.ReactNode; // rendered only when checked
}

export const CheckboxRevealSection: React.FC<CheckboxRevealSectionProps> = ({
  label,
  checked,
  onChange,
  disabled,
  children,
}) => {
  const handleChange = () => onChange(!checked);

  return (
    <Styled.Container>
      <CheckboxContainer>
        <Checkbox
          type="checkbox"
          checked={checked}
          onChange={handleChange}
          disabled={disabled}
        />
        <CheckboxLabel>{label}</CheckboxLabel>
      </CheckboxContainer>

      {checked && children}
    </Styled.Container>
  );
};
