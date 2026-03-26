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

import { FilterOption, PopulationFilter } from "../../filters";
import {
  RadioContainer,
  RadioDot,
  RadioGroupGrid,
  RadioInput,
  RadioLabel,
} from "./RadioGroup.styles";

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
  const [state, setState] = useState(defaultValue);
  const { type, options } = filter;

  return (
    <RadioGroupGrid>
      {options.map(({ value, label }) => (
        <RadioContainer key={value}>
          <RadioLabel>{label}</RadioLabel>
          <RadioInput
            type="radio"
            name={type}
            checked={state === value}
            onChange={() => {
              setState(value);
              onChange([{ value, label }], type);
            }}
            tabIndex={0}
          />
          <RadioDot $checked={state === value} />
        </RadioContainer>
      ))}
    </RadioGroupGrid>
  );
};

export default RadioGroup;
