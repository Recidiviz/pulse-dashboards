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

import React, { useState } from "react";

import { Radio } from "~design-system";

import { FilterOption, PopulationFilter } from "../../filters";
import { PathwaysRadioGroup } from "./RadioGroup.styles";

type RadioGroupProps = {
  filter: PopulationFilter;
  defaultValue: string;
  onChange: (newOptions: FilterOption[], filterType: string) => void;
};

const RadioGroup: React.FC<RadioGroupProps> = ({
  filter,
  defaultValue,
  onChange,
}) => {
  const [value, setValue] = useState(defaultValue);
  const { type, title, options } = filter;

  const handleChange = (next: string) => {
    setValue(next);
    const matched = options.find((o) => o.value === next);
    if (matched) {
      onChange([matched], type);
    }
  };

  return (
    <PathwaysRadioGroup
      value={value}
      onChange={handleChange}
      ariaLabel={title}
      name={type}
    >
      {options.map(({ value: optionValue, label }) => (
        <Radio key={optionValue} value={optionValue}>
          {label}
        </Radio>
      ))}
    </PathwaysRadioGroup>
  );
};

export default RadioGroup;
