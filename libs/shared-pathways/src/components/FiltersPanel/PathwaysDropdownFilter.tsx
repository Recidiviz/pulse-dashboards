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

import { DropdownMenuItem } from "~design-system";

import { FilterOption } from "../../filters";
import {
  DropdownLabel,
  FilterDropdownMenu,
  FilterDropdownToggle,
  FilterDropdownWrapper,
} from "./FiltersPanel.styles";

type PathwaysDropdownFilterProps = {
  label: string;
  options: FilterOption[];
  selectedValue: string;
  onChange: (value: string) => void;
};

const PathwaysDropdownFilter: React.FC<PathwaysDropdownFilterProps> = ({
  label,
  options,
  selectedValue,
  onChange,
}) => {
  const selectedLabel =
    options.find((o) => o.value === selectedValue)?.label ?? options[0]?.label;

  return (
    <>
      <DropdownLabel>{label}</DropdownLabel>
      <FilterDropdownWrapper>
        <FilterDropdownToggle kind="secondary" shape="pill" showCaret>
          {selectedLabel}
        </FilterDropdownToggle>
        <FilterDropdownMenu alignment="left" ariaLabel={label}>
          {options.map((option) => (
            <DropdownMenuItem
              key={option.value}
              className={
                option.value === selectedValue
                  ? "filter-dropdown-active-item"
                  : undefined
              }
              onClick={() => onChange(option.value)}
            >
              {option.label}
            </DropdownMenuItem>
          ))}
        </FilterDropdownMenu>
      </FilterDropdownWrapper>
    </>
  );
};

export default PathwaysDropdownFilter;
