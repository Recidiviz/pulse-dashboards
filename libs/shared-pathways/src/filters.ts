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

/**
 * Separates the parts of a compound filter value.
 *
 * Most filter values name one thing. A few name a value that only means
 * something alongside another dimension: an admission type of "Other" exists
 * under both custody statuses and means something different in each, so its
 * value carries the custody status too — `Incarcerated Individual|Other`.
 * The backend splits on this delimiter and matches both parts.
 */
export const COMPOUND_FILTER_VALUE_DELIMITER = "|";

/** Splits a compound filter value into its parts, in the order they appear. */
export function splitCompoundFilterValue(value: string): string[] {
  return value.split(COMPOUND_FILTER_VALUE_DELIMITER);
}

export type FilterOption = {
  label: string;
  value: string;
  longLabel?: string;
  group?: string;
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
  | "gender_id_name_map"
  | "sentence_length_min_id_name_map"
  | "sentence_length_max_id_name_map"
  | "ethnicity_id_name_map"
  | "offense_type_id_name_map"
  | "charge_county_id_name_map"
  | "date_in_population_id_name_map"
  | "charge_description_id_name_map"
  | "admission_reason_id_name_map"
  | "religion_id_name_map"
  | "marital_status_id_name_map"
  | "months_at_facility_id_name_map"
  | "custody_status_id_name_map"
  | "calendar_year_id_name_map"
  | "admission_type_id_name_map"
  | "release_type_id_name_map"
  | "community_supervision_id_name_map";
export type DynamicFilterOptionKeyToFilterTypeMap = {
  [key in DynamicFilterOptionMetadataKey]: FilterType;
};
export const dynamicFilterOptionMapToFilterType: DynamicFilterOptionKeyToFilterTypeMap =
  {
    facility_id_name_map: "facility",
    race_id_name_map: "race",
    gender_id_name_map: "gender",
    sentence_length_min_id_name_map: "sentenceLengthMin",
    sentence_length_max_id_name_map: "sentenceLengthMax",
    ethnicity_id_name_map: "ethnicity",
    offense_type_id_name_map: "offenseType",
    charge_county_id_name_map: "chargeCountyCode",
    date_in_population_id_name_map: "dateInPopulation",
    charge_description_id_name_map: "chargeDescription",
    admission_reason_id_name_map: "admissionReason",
    religion_id_name_map: "religion",
    marital_status_id_name_map: "maritalStatus",
    months_at_facility_id_name_map: "monthsAtFacility",
    custody_status_id_name_map: "custodyStatus",
    calendar_year_id_name_map: "calendarYear",
    admission_type_id_name_map: "admissionType",
    release_type_id_name_map: "releaseType",
    community_supervision_id_name_map: "communitySupervision",
  };

export type DynamicFilterOptions = Record<FilterType, FilterOption[]>;

export type SetPopulationFilters = (filtersStore: {
  setFilters(updatedFilters: Partial<PopulationFilterValues>): void;
}) => (option: FilterOption[] | FilterOption) => void;

export type PopulationFilter = {
  type: FilterType;
  title: string;
  description?: string;
  isSingleSelect?: boolean;
  setFilters: SetPopulationFilters;
  options: FilterOption[];
  defaultOption: FilterOption;
  defaultValue: string;
  locationNameMap?: Record<string, string>;
  useDynamicOptions?: boolean;
};

export type PopulationFilters = Record<FilterType, PopulationFilter>;
