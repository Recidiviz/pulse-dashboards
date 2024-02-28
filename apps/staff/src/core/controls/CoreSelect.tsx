// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2021 Recidiviz, Inc.
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
import React, { forwardRef } from "react";
import ReactSelect, { IndicatorProps } from "react-select";

import { coreSelectCustomStyles } from "./utils";

type FilterOption = {
  label: string;
  value: any;
};

type CoreSelectProps = {
  isChanged: boolean;
  value: FilterOption | FilterOption[];
  defaultValue: FilterOption | FilterOption[];
  options: FilterOption[];
  onChange: (option: FilterOption) => void;
  [key: string]: any;
};

const CustomDropdownIndicator = ({
  selectProps,
}: IndicatorProps<FilterOption, false>) => {
  return (
    <div className="CoreSelect__custom-indicator">
      <span
        className={cn("CoreSelect__custom-arrow", {
          "CoreSelect__custom-arrow--changed": selectProps.isChanged,
        })}
      />
    </div>
  );
};

export const CoreSelect = forwardRef<HTMLInputElement, CoreSelectProps>(
  (props, ref) => {
    return (
      <ReactSelect
        // @ts-ignore
        ref={ref}
        aria-label={props.id}
        className="CoreSelect"
        classNamePrefix="CoreSelect"
        components={{
          IndicatorSeparator: () => null,
          DropdownIndicator: CustomDropdownIndicator,
        }}
        styles={coreSelectCustomStyles(props.isChanged)}
        {...props}
      />
    );
  },
);

CoreSelect.displayName = "Select";
