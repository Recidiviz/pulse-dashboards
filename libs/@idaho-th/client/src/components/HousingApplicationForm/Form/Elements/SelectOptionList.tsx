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

import CheckIcon from "../../../assets/tabler-icon-check.svg?react";
import * as Styled from "../../HousingApplicationForm.styles";

export interface SelectOptionListProps {
  options: readonly string[];
  selectedValue: string;
  onSelect: (value: string) => void;
}

export const SelectOptionList: React.FC<SelectOptionListProps> = ({
  options,
  selectedValue,
  onSelect,
}) => (
  <>
    {options.map((value) => {
      const selected = value === selectedValue;
      return (
        <Styled.SelectDropdownMenuItem
          key={value}
          type="button"
          role="option"
          aria-selected={selected}
          onClick={() => onSelect(value)}
        >
          <Styled.SelectDropdownOptionCheck $selected={selected}>
            <CheckIcon aria-hidden />
          </Styled.SelectDropdownOptionCheck>
          <Styled.SelectDropdownMenuItemLabel>
            {value}
          </Styled.SelectDropdownMenuItemLabel>
        </Styled.SelectDropdownMenuItem>
      );
    })}
  </>
);
