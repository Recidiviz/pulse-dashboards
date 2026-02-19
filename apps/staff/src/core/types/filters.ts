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

import { FilterOption, FilterType } from "~shared-pathways";

import type FiltersStore from "../CoreStore/FiltersStore";

export type SetPopulationFilters = (
  filtersStore: FiltersStore,
) => (option: FilterOption[] | FilterOption) => void;

export type PopulationFilter = {
  type: FilterType;
  title: string;
  isSingleSelect?: boolean;
  setFilters: SetPopulationFilters;
  options: FilterOption[];
  defaultOption: FilterOption;
  defaultValue: string;
  locationNameMap?: Record<string, string>;
  useDynamicOptions?: boolean;
};

export type PopulationFilters = Record<FilterType, PopulationFilter>;
