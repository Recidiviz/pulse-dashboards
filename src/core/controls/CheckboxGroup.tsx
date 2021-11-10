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

import { get } from "mobx";
import { observer } from "mobx-react-lite";
import React, { useCallback, useState } from "react";

import Checkbox from "../../components/Checkbox";
import { sortByLabel } from "../../utils/datasets";
import { useCoreStore } from "../CoreStoreProvider";
import { FilterOption, PopulationFilter } from "../types/filters";
import { getFilterOptions } from "../utils/filterOptions";

type CheckboxGroupProps = {
  filter: PopulationFilter;
  summingOption: FilterOption;
  onChange: any;
};

const CheckboxGroup: React.FC<CheckboxGroupProps> = ({
  filter,
  summingOption,
  onChange,
}) => {
  const { filtersStore } = useCoreStore();
  const { filters } = filtersStore;
  const current = getFilterOptions(get(filters, filter.type), filter.options);
  const [selectedOptions, setSelectedOptions] = useState(current);
  const enabledOptions = filter.options.slice(1);
  sortByLabel(enabledOptions, "label");

  const handleChange = useCallback(
    (option: FilterOption) => {
      const newOptions = [...selectedOptions];
      const optionIndex = newOptions.indexOf(option);
      const summingOptionIndex = newOptions.indexOf(summingOption);

      // if option is unchecked, then delete it from newOptions. Else add it to newOptions.
      if (optionIndex > -1) {
        newOptions.splice(optionIndex, 1);
      } else {
        newOptions.push(option);
      }
      // if "ALL" option is unchecked, then delete it from newOptions.
      if (summingOptionIndex > -1) {
        newOptions.splice(summingOptionIndex, 1);
      }
      // if newOptions has "ALL" option, then delete every options except "ALL".
      if (newOptions.includes(summingOption)) {
        newOptions.splice(0, newOptions.length, summingOption);
      }
      // if newOptions doesn't have any option, then add to it "ALL" option.
      if (newOptions.length === 0) {
        newOptions.push(summingOption);
      }
      // if newOptions contains all options except "ALL", then delete every options except "ALL".
      if (newOptions.length === enabledOptions.length) {
        newOptions.splice(0, newOptions.length, summingOption);
      }

      setSelectedOptions(newOptions);
      onChange(newOptions, filter.type);
    },
    [selectedOptions, enabledOptions, summingOption, onChange, filter.type]
  );

  const checkBoxOptions = (
    <>
      {enabledOptions.map((option) => {
        return (
          <Checkbox
            key={option.value}
            value={option.value}
            checked={selectedOptions.includes(option)}
            onChange={() => handleChange(option)}
          >
            {option.label}
          </Checkbox>
        );
      })}
    </>
  );
  return (
    <>
      {/* All option checkbox */}
      <Checkbox
        value={summingOption.value}
        checked={selectedOptions.includes(summingOption)}
        disabled={selectedOptions.includes(summingOption)}
        onChange={() => handleChange(summingOption)}
      >
        {summingOption.label}
      </Checkbox>
      {/* enabledOptions checkboxes */}
      {checkBoxOptions}
    </>
  );
};

export default observer(CheckboxGroup);
