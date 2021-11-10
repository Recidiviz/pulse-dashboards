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
import { US_ND } from "../../RootStore/TenantStore/coreTenants";
import { US_ID, US_TN } from "../../RootStore/TenantStore/pathwaysTenants";
import { Age, Gender } from "../models/types";
import {
  FilterOption,
  PopulationFilterLabels,
  PopulationFilters,
  PopulationFilterValues,
  SetPopulationFilters,
} from "../types/filters";
import { CORE_VIEWS } from "../views";
import { FILTER_TYPES, METRIC_TYPES } from "./constants";

export const metricTypeOptions = [
  { label: "Counts", value: METRIC_TYPES.COUNTS },
  { label: "Rates", value: METRIC_TYPES.RATES },
];
export const defaultMetricType = metricTypeOptions[0].value;

export const metricPeriodOptions = [
  { label: "3 years", value: "36" },
  { label: "1 year", value: "12" },
  { label: "6 months", value: "6" },
  { label: "3 months", value: "3" },
  { label: "1 month", value: "1" },
];

export const defaultMetricPeriodOption = metricPeriodOptions[1];
export const defaultMetricPeriod = defaultMetricPeriodOption.value;

export const supervisionTypeOptions = [
  { label: "All", value: "all" },
  { label: "Probation", value: "probation" },
  { label: "Parole", value: "parole" },
];
export const defaultSupervisionTypeOption = supervisionTypeOptions[0];
export const defaultSupervisionType = defaultSupervisionTypeOption.value;

export const defaultDistrictOption = { label: "All", value: "all" };
export const defaultDistrict = [defaultDistrictOption.value];

export const convertLabelsToValues = (
  filtersLabels: PopulationFilterLabels,
  filterOptions: PopulationFilters
): Record<string, string | string[]> => {
  if (!filterOptions) return {};
  return Object.keys(filtersLabels).reduce((acc, filterType) => {
    const options = filterOptions[
      filterType as keyof PopulationFilterLabels
    ].options.filter((o) =>
      filtersLabels[filterType as keyof PopulationFilterLabels]
        .split(",")
        .includes(o.label)
    );
    const values = options.map((o) => o.value);
    if (options) acc[filterType] = values.length > 1 ? values : values[0];
    return acc;
  }, {} as Record<string, string | string[]>);
};

export const getFilterOption = (
  value: string,
  options: FilterOption[]
): FilterOption =>
  options.find((option) => option.value === value) ?? options[0];

export const getFilterOptions = (
  value: string[],
  options: FilterOption[]
): FilterOption[] => {
  return (
    options.filter((option) => value.includes(option.value)) ?? [options[0]]
  );
};

const setFilters = (
  filterKey: keyof PopulationFilters
): SetPopulationFilters => (filtersStore) => (option) => {
  filtersStore.setFilters({ [filterKey]: option.value });
};

// TODO(#940): Move width styling for filter to CSS
export const PopulationFilterOptions: PopulationFilters = {
  [FILTER_TYPES.TIME_PERIOD]: {
    type: FILTER_TYPES.TIME_PERIOD,
    title: "Time Period",
    width: "8rem",
    setFilters: setFilters(FILTER_TYPES.TIME_PERIOD),
    options: [
      { label: "5 years", value: "60" },
      { label: "2 years", value: "24" },
      { label: "1 year", value: "12" },
      { label: "6 months", value: "6" },
    ],
    get defaultOption(): FilterOption {
      return this.options[3];
    },
    get defaultValue(): string {
      return this.defaultOption.value;
    },
    enabledViews: [CORE_VIEWS.community, CORE_VIEWS.facilities],
  },
  [FILTER_TYPES.GENDER]: {
    type: FILTER_TYPES.GENDER,
    title: "Gender",
    width: "7rem",
    setFilters: setFilters(FILTER_TYPES.GENDER),
    options: [
      { label: "All", value: "ALL" },
      { label: "Female", value: "FEMALE" },
      { label: "Male", value: "MALE" },
    ],
    get defaultOption(): FilterOption {
      return this.options[0];
    },
    get defaultValue(): string {
      return this.defaultOption.value;
    },
    enabledViews: [CORE_VIEWS.community, CORE_VIEWS.facilities],
  },
  [FILTER_TYPES.LEGAL_STATUS]: {
    type: FILTER_TYPES.LEGAL_STATUS,
    title: "Legal Status",
    width: "9.5rem",
    setFilters: setFilters(FILTER_TYPES.LEGAL_STATUS),
    options: [
      { label: "All", value: "ALL" },
      { label: "Rider", value: "TREATMENT_IN_PRISON" },
      { label: "Termer", value: "GENERAL" },
      { label: "Parole Violator", value: "PAROLE_BOARD_HOLD" },
    ],
    get defaultOption(): FilterOption {
      return this.options[0];
    },
    get defaultValue(): string {
      return this.defaultOption.value;
    },
    enabledViews: [CORE_VIEWS.facilities],
  },
  [FILTER_TYPES.SUPERVISION_TYPE]: {
    type: FILTER_TYPES.SUPERVISION_TYPE,
    title: "Supervision Type",
    width: "8.5rem",
    setFilters: setFilters(FILTER_TYPES.SUPERVISION_TYPE),
    options: [
      { label: "All", value: "ALL" },
      { label: "Probation", value: "PROBATION" },
      { label: "Parole/Dual", value: "PAROLE" },
    ],
    get defaultOption(): FilterOption {
      return this.options[0];
    },
    get defaultValue(): string {
      return this.defaultOption.value;
    },
    enabledViews: [CORE_VIEWS.community],
  },
  [FILTER_TYPES.AGE]: {
    type: FILTER_TYPES.AGE,
    title: "Age",
    width: "10rem",
    setFilters: setFilters(FILTER_TYPES.AGE),
    options: [
      { label: "All", value: "ALL" },
      { label: "<25 years old", value: "<25" },
      { label: "25-29 years old", value: "25-29" },
      { label: "30-34 years old", value: "30-34" },
      { label: "35-39 years old", value: "35-39" },
      { label: "40-44 years old", value: "40-44" },
      { label: "45-49 years old", value: "45-49" },
      { label: "50-54 years old", value: "50-54" },
      { label: "55+ years old", value: "55+" },
    ],
    get defaultOption(): FilterOption {
      return this.options[0];
    },
    get defaultValue(): string {
      return this.defaultOption.value;
    },
    enabledViews: [CORE_VIEWS.facilities],
  },
  [FILTER_TYPES.FACILITY]: {
    type: FILTER_TYPES.FACILITY,
    title: "Facility",
    width: "7rem",
    setFilters: setFilters(FILTER_TYPES.FACILITY),
    options: [
      { label: "All", value: "ALL" },
      { label: "MCCX", value: "MCCX" },
      { label: "BCCX", value: "BCCX" },
      { label: "TTCC", value: "TTCC" },
      { label: "NWXS", value: "NWXS" },
      { label: "TCIX2", value: "TCIX2" },
      { label: "TCA", value: "TCA" },
      { label: "TCIX1", value: "TCIX1" },
      { label: "SCCF", value: "SCCF" },
      { label: "TPFW", value: "TPFW" },
      { label: "CRC", value: "CRC" },
      { label: "MLTC", value: "MLTC" },
      { label: "WTRC", value: "WTRC" },
      { label: "DSNF", value: "DSNF" },
      { label: "WCFA", value: "WCFA" },
      { label: "RMSI", value: "RMSI" },
      { label: "NECX2", value: "NECX2" },
      { label: "NCCF", value: "NCCF" },
      { label: "WTSP", value: "WTSP" },
      { label: "NECX1", value: "NECX1" },
    ],
    get defaultOption(): FilterOption {
      return this.options[0];
    },
    get defaultValue(): string {
      return this.defaultOption.value;
    },
    enabledViews: [CORE_VIEWS.facilities],
  },
};

export const defaultPopulationFilterValues: PopulationFilterValues = {
  [FILTER_TYPES.TIME_PERIOD]:
    PopulationFilterOptions[FILTER_TYPES.TIME_PERIOD].defaultValue,
  [FILTER_TYPES.GENDER]: PopulationFilterOptions[FILTER_TYPES.GENDER]
    .defaultValue as Gender,
  [FILTER_TYPES.LEGAL_STATUS]: [
    PopulationFilterOptions[FILTER_TYPES.LEGAL_STATUS].defaultValue,
  ],
  [FILTER_TYPES.SUPERVISION_TYPE]:
    PopulationFilterOptions[FILTER_TYPES.SUPERVISION_TYPE].defaultValue,
  [FILTER_TYPES.AGE]: [
    PopulationFilterOptions[FILTER_TYPES.AGE].defaultValue,
  ] as Age[],
  [FILTER_TYPES.FACILITY]: [
    PopulationFilterOptions[FILTER_TYPES.FACILITY].defaultValue,
  ],
};

export const IdPopulationFilterOptions: PopulationFilters = {
  ...PopulationFilterOptions,
  [FILTER_TYPES.LEGAL_STATUS]: {
    type: FILTER_TYPES.LEGAL_STATUS,
    title: "Legal Status",
    width: "9.5rem",
    setFilters: setFilters(FILTER_TYPES.LEGAL_STATUS),
    options: [
      { label: "All", value: "ALL" },
      { label: "Rider", value: "TREATMENT_IN_PRISON" },
      { label: "Termer", value: "GENERAL" },
      { label: "Parole Violator", value: "PAROLE_BOARD_HOLD" },
    ],
    get defaultOption(): FilterOption {
      return this.options[0];
    },
    get defaultValue(): string {
      return this.defaultOption.value;
    },
    enabledViews: [CORE_VIEWS.facilities],
  },
};

export const TnPopulationFilterOptions: PopulationFilters = {
  ...PopulationFilterOptions,
  [FILTER_TYPES.LEGAL_STATUS]: {
    type: FILTER_TYPES.LEGAL_STATUS,
    title: "Legal Status",
    width: "9.5rem",
    setFilters: setFilters(FILTER_TYPES.LEGAL_STATUS),
    options: [
      { label: "All", value: "ALL" },
      { label: "General", value: "GENERAL" },
      { label: "Legal", value: "LEGAL" },
    ],
    get defaultOption(): FilterOption {
      return this.options[0];
    },
    get defaultValue(): string {
      return this.defaultOption.value;
    },
    enabledViews: [CORE_VIEWS.facilities],
  },
};

export default {
  [US_ID]: IdPopulationFilterOptions,
  [US_TN]: TnPopulationFilterOptions,
  [US_ND]: undefined,
} as const;
