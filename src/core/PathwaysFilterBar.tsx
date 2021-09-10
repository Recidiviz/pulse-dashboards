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
import React from "react";

import { CoreSelect } from "./controls/CoreSelect";
import Filter from "./controls/Filter";
import FilterBar from "./controls/FilterBar";
import { useCoreStore } from "./CoreStoreProvider";
import DetailsGroup from "./DetailsGroup";
import DownloadDataButton from "./DownloadDataButton";
import MethodologyLink from "./MethodologyLink";
import { EnabledFilters, PopulationFilters } from "./types/filters";
import { getFilterOption } from "./utils/filterOptions";
import { CORE_PATHS } from "./views";

const PopulationFilterBar: React.FC<{
  filterOptions: PopulationFilters;
  handleDownload: () => Promise<void>;
  enabledFilters?: EnabledFilters;
}> = ({ filterOptions, handleDownload, enabledFilters = [] }) => {
  const { filtersStore } = useCoreStore();
  const { filters } = filtersStore;

  return (
    <FilterBar
      details={
        <DetailsGroup>
          <DownloadDataButton handleOnClick={handleDownload} />
          <MethodologyLink path={CORE_PATHS.methodologyProjections} />
        </DetailsGroup>
      }
    >
      {enabledFilters.map((filterType) => {
        const filter = filterOptions[filterType];
        return (
          <Filter
            key={`${filterType}`}
            title={filter.title}
            width={filter.width}
          >
            <CoreSelect
              value={getFilterOption(get(filters, filter.type), filter.options)}
              options={filter.options}
              onChange={filter.setFilters(filtersStore)}
              defaultValue={filter.defaultValue}
            />
          </Filter>
        );
      })}
    </FilterBar>
  );
};

export default observer(PopulationFilterBar);
