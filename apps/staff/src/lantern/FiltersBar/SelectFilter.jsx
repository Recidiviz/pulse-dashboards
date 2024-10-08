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

import { get } from "mobx";
import { observer } from "mobx-react-lite";
import PropTypes from "prop-types";
import React from "react";

import Select from "../../controls/Select";
import { useLanternStore } from "../LanternStoreProvider";
import FilterField from "./FilterField";

function SelectFilter({ label, dimension }) {
  const { filtersStore } = useLanternStore();
  const { filters, filterOptions } = filtersStore;
  const value = get(filters, dimension);
  const { options, defaultOption } = filterOptions[dimension];

  const onValueChange = (option) => {
    filtersStore.setFilters({ [dimension]: option.value });
  };

  const selectedOption = options.find((option) => option.value === value);

  return (
    <FilterField label={label}>
      <Select
        value={selectedOption}
        options={options}
        onChange={onValueChange}
        defaultValue={defaultOption}
      />
    </FilterField>
  );
}

SelectFilter.propTypes = {
  label: PropTypes.string.isRequired,
  dimension: PropTypes.string.isRequired,
};

export default observer(SelectFilter);
