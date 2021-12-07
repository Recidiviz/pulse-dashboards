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
import type FiltersStore from "../CoreStore/FiltersStore";
import { AgeGroup, Gender, MetricId } from "../models/types";
import { FILTER_TYPES } from "../utils/constants";

type ValueOf<T> = T[keyof T];
export type EnabledFilters = ValueOf<typeof FILTER_TYPES>[];

export type PopulationFilterValues = {
  timePeriod: string[];
  gender: Gender[];
  supervisionType: string[];
  legalStatus: string[];
  facility: string[];
  ageGroup: AgeGroup[];
  district: string[];
  mostSevereViolation: string[];
  numberOfViolations: string[];
};

export type PopulationFilterLabels = {
  timePeriod: string;
  gender: string;
  supervisionType: string;
  legalStatus: string;
  facility: string;
  ageGroup: string;
  district: string;
  mostSevereViolation: string;
  numberOfViolations: string;
};

export type SetPopulationFilters = (
  filtersStore: FiltersStore
) => (option: FilterOption[] | FilterOption) => void;

export type FilterOption = {
  label: string;
  value: string;
};

export interface PopulationFilters {
  [FILTER_TYPES.TIME_PERIOD]: PopulationFilter;
  [FILTER_TYPES.GENDER]: PopulationFilter;
  [FILTER_TYPES.LEGAL_STATUS]: PopulationFilter;
  [FILTER_TYPES.SUPERVISION_TYPE]: PopulationFilter;
  [FILTER_TYPES.AGE_GROUP]: PopulationFilter;
  [FILTER_TYPES.FACILITY]: PopulationFilter;
  [FILTER_TYPES.DISTRICT]: PopulationFilter;
  [FILTER_TYPES.MOST_SEVERE_VIOLATION]: PopulationFilter;
  [FILTER_TYPES.NUMBER_OF_VIOLATIONS]: PopulationFilter;
}

export type PopulationFilter = {
  type: keyof PopulationFilters;
  title: string;
  isSingleSelect?: boolean;
  setFilters: SetPopulationFilters;
  options: FilterOption[];
  defaultOption: FilterOption;
  defaultValue: string;
  enabledViews: string[];
};

export type Filters = {
  enabledFilters: EnabledFilters;
  enabledMoreFilters?: EnabledFilters;
};

export type EnabledFiltersByMetric = {
  [key in MetricId]: Filters;
};
