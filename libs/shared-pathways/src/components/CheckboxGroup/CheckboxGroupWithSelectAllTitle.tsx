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

import React, { useCallback, useMemo } from "react";

import { FilterOption, PopulationFilter } from "../../";
import FilterSectionLayout from "../FilterSectionLayout/FilterSectionLayout";
import Checkbox from "./Checkbox";
import CheckboxGroup from "./CheckboxGroup";

type CheckboxGroupWithSelectAllTitleProps = {
  filter: PopulationFilter;
  selectedOptions: FilterOption[];
  onChange: (options: FilterOption[], filterType: string) => void;
};

const CheckboxGroupWithSelectAllTitle: React.FC<
  CheckboxGroupWithSelectAllTitleProps
> = ({ filter, selectedOptions, onChange }) => {
  const enabledOptions = useMemo(
    () => filter.options.slice(1),
    [filter.options],
  );

  const noneSelected = selectedOptions.length === 0;

  const allSelected = useMemo(
    () =>
      enabledOptions.every((opt) =>
        selectedOptions.some((s) => s.value === opt.value),
      ),
    [enabledOptions, selectedOptions],
  );

  const indeterminate =
    !noneSelected && !allSelected && selectedOptions.length > 0;

  const handleSelectAllToggle = useCallback(() => {
    if (allSelected || indeterminate) {
      onChange([], filter.type);
    } else {
      onChange([...enabledOptions], filter.type);
    }
  }, [allSelected, indeterminate, enabledOptions, onChange, filter.type]);

  return (
    <FilterSectionLayout
      title={filter.title}
      titlePrefix={
        <Checkbox
          value="select-all"
          checked={allSelected}
          indeterminate={indeterminate}
          onChange={handleSelectAllToggle}
        />
      }
    >
      <CheckboxGroup
        filter={filter}
        selectedOptions={selectedOptions}
        onChange={onChange}
        collapsible
      />
    </FilterSectionLayout>
  );
};

export default CheckboxGroupWithSelectAllTitle;
