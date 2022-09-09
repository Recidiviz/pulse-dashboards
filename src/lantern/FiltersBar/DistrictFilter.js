// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2020 Recidiviz, Inc.
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
import map from "lodash/fp/map";
import { get } from "mobx";
import { observer } from "mobx-react-lite";
import React from "react";

import { flatOptions } from "../../controls/utils";
import { allOption } from "../LanternStore/FiltersStore";
import { useLanternStore } from "../LanternStoreProvider";
import DistrictFilterDropown from "./DistrictFilterDropown";
import FilterField from "./FilterField";

const DistrictFilter = () => {
  const {
    filters,
    filtersStore,
    userRestrictionsStore,
    districtsStore,
  } = useLanternStore();
  const { allowedSupervisionLocationIds } = userRestrictionsStore;
  const {
    isLoading,
    districtKeys: { filterKey, secondaryFilterKey },
  } = districtsStore;
  const { filterOptions } = filtersStore;

  const { options } = filterOptions[filterKey];

  const onValueChange = (newOptions) => {
    const optionValues = map("value", newOptions);

    filtersStore.setFilters({
      [filterKey]: optionValues,
      ...(secondaryFilterKey
        ? { [secondaryFilterKey]: map("secondaryValue", newOptions) }
        : {}),
    });
  };

  const selectedValues = flatOptions(options).filter((option) =>
    get(filters, filterKey).includes(option.value)
  );

  return (
    <FilterField label="District" className="DistrictFilter">
      <DistrictFilterDropown
        restrictedValues={allowedSupervisionLocationIds}
        options={options}
        selected={selectedValues}
        onValueChange={onValueChange}
        isLoading={isLoading}
        defaultValue={allOption}
      />
    </FilterField>
  );
};

export default observer(DistrictFilter);
