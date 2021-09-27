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

import React from "react";

import { ReactComponent as NoDataLogo } from "../../assets/static/images/no_data_logo.svg";
import { useCoreStore } from "../../core/CoreStoreProvider";
import { defaultPopulationFilterValues } from "../../core/utils/filterOptions";
import HydrationStatus from "./HydrationStatus";

const Error: React.FC = () => {
  const { filtersStore } = useCoreStore();

  const onResetFilters = () => {
    filtersStore.setFilters(defaultPopulationFilterValues);
  };

  return (
    <HydrationStatus
      icon={<NoDataLogo />}
      title="No data available"
      subtitle={
        <>
          The critera you selected may be too narrow.
          <br />
          Try choosing a different set of filters.
        </>
      }
    >
      <button type="button" onClick={onResetFilters}>
        Reset filters
      </button>
    </HydrationStatus>
  );
};

export default Error;