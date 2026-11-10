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

import * as Styled from "./SelectableChip.styles";

export interface SelectableChipProps {
  name: string;
  value: string;
  label: string;
  checked: boolean;
  disabled?: boolean;
  onSelect: () => void;
}

export const SelectableChip: React.FC<SelectableChipProps> = ({
  name,
  value,
  label,
  checked,
  disabled = false,
  onSelect,
}) => (
  <Styled.ChipLabel $selected={checked}>
    <Styled.HiddenRadio
      name={name}
      value={value}
      checked={checked}
      disabled={disabled}
      onChange={onSelect}
    />
    <Styled.RadioIndicator $selected={checked} aria-hidden>
      {checked && <Styled.RadioDot />}
    </Styled.RadioIndicator>
    <Styled.ChipText $selected={checked}>{label}</Styled.ChipText>
  </Styled.ChipLabel>
);
