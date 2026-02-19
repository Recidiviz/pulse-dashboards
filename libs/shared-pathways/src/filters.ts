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

import { FILTER_TYPES } from "./constants";
import { AgeGroup, Gender, MetricId, Sex } from "./types";

export type FilterType = (typeof FILTER_TYPES)[keyof typeof FILTER_TYPES];
export type EnabledFilter = FilterType;
export type EnabledFilters = EnabledFilter[];

export type FilterOption = {
  label: string;
  value: string;
  longLabel?: string;
};

export type Filters = {
  enabledFilters: EnabledFilters;
  enabledMoreFilters?: EnabledFilters;
};

export type PopulationFilterValues = Record<
  Exclude<FilterType, "sex" | "gender" | "ageGroup">,
  string[]
> & { ageGroup: AgeGroup[]; sex: Sex[]; gender: Gender[] };

export type PopulationFilterLabels = Record<FilterType, string>;

export type EnabledFiltersByMetric = {
  [key in MetricId]: Filters;
};

export type DynamicFilterOptionMetadata = Record<
  DynamicFilterOptionMetadataKey,
  string
>;
export type DynamicFilterOptionMetadataKey =
  | "facility_id_name_map"
  | "race_id_name_map"
  | "gender_id_name_map";
export type DynamicFilterOptionKeyToFilterTypeMap = {
  [key in DynamicFilterOptionMetadataKey]: FilterType;
};
export const dynamicFilterOptionMapToFilterType: DynamicFilterOptionKeyToFilterTypeMap =
  {
    facility_id_name_map: "facility",
    race_id_name_map: "race",
    gender_id_name_map: "gender",
  };

export type DynamicFilterOptions = Record<FilterType, FilterOption[]>;
