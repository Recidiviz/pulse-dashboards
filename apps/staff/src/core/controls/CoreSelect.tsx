// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import "./CoreSelect.scss";

import cn from "classnames";
import React, { ReactNode } from "react";

import {
  Dropdown,
  DropdownMenu,
  DropdownMenuItem,
  DropdownToggle,
} from "~design-system";

type FilterOption = {
  label: string;
  value: any;
};

const CustomDropdownIndicator = () => {
  return (
    <div className="CoreSelect__custom-indicator">
      <span className={cn("CoreSelect__custom-arrow", {})} />
    </div>
  );
};

export const CoreSelect: React.FC<{
  value: FilterOption[];
  defaultValue: string;
  options: FilterOption[];
  onChange: (option: FilterOption) => void;
  id: string;
  isChanged: boolean;
}> = ({ value, defaultValue, options, onChange, id, isChanged }): ReactNode => {
  return (
    <Dropdown className={"CoreSelect"} id={id}>
      <DropdownToggle
        kind="link"
        aria-label={`Select ${id}`}
        className={cn("CoreSelect__control", {
          "CoreSelect__control--changed": isChanged,
        })}
        // Override the tabIndex in DropdownToggle since this is in a Toolbar
        tabIndex={-1}
      >
        <div
          className="CoreSelect__value-container"
          aria-label={value[0].label || defaultValue}
        >
          {value[0].label || defaultValue}
        </div>
        <CustomDropdownIndicator />
      </DropdownToggle>
      <DropdownMenu
        alignment="right"
        className="CoreSelect__menu"
        ariaLabel={`${id} dropdown menu`}
      >
        {options.map((option: FilterOption) => {
          return (
            <DropdownMenuItem
              key={option.value}
              onClick={() => onChange(option)}
              className={`CoreSelect__option ${option.value === value[0].value ? "CoreSelect__option--selected" : ""}`}
            >
              {option.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenu>
    </Dropdown>
  );
};

CoreSelect.displayName = "Select";
