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

import type FiltersStore from "../CoreStore/FiltersStore";
import { AgeGroup, Gender, MetricId } from "../models/types";
import { FILTER_TYPES } from "../utils/constants";

export type EnabledFilter = keyof PopulationFilters;
export type EnabledFilters = EnabledFilter[];
export type FilterType = (typeof FILTER_TYPES)[keyof typeof FILTER_TYPES];
export type PopulationFilterValues = Record<
  Exclude<FilterType, "gender" | "ageGroup">,
  string[]
> & { ageGroup: AgeGroup[]; gender: Gender[] };
export type PopulationFilterLabels = Record<FilterType, string>;

export type SetPopulationFilters = (
  filtersStore: FiltersStore,
) => (option: FilterOption[] | FilterOption) => void;

export type FilterOption = {
  label: string;
  value: string;
  longLabel?: string;
};

export type PopulationFilters = Record<FilterType, PopulationFilter>;

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

export type Filters = {
  enabledFilters: EnabledFilters;
  enabledMoreFilters?: EnabledFilters;
};

export type EnabledFiltersByMetric = {
  [key in MetricId]: Filters;
};

export const dynamicFilterOptionMapToFilterType: DynamicFilterOptionMetadata = {
  facilityIdNameMap: "facility",
  raceIdNameMap: "race",
  genderIdNameMap: "gender",
};

export type DynamicFilterOptionIdNameMap = 
  | "facilityIdNameMap"
  | "raceIdNameMap"
  | "genderIdNameMap"
;
export type DynamicFilterOptionMetadata = {
  [key in DynamicFilterOptionIdNameMap]: FilterType;
};
