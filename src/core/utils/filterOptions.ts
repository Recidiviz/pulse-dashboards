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
import {
  US_DEMO,
  US_ID,
  US_ME,
  US_TN,
} from "../../RootStore/TenantStore/pathwaysTenants";
import { AgeGroup, Gender } from "../models/types";
import {
  FilterOption,
  PopulationFilterLabels,
  PopulationFilters,
  PopulationFilterValues,
  SetPopulationFilters,
} from "../types/filters";
import { CORE_VIEWS } from "../views";
import { FILTER_TYPES, METRIC_MODES } from "./constants";

export const metricModeOptions = [
  { label: "Counts", value: METRIC_MODES.COUNTS },
  { label: "Rates", value: METRIC_MODES.RATES },
];
export const defaultMetricMode = metricModeOptions[0].value;

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
    if (options) acc[filterType] = values;
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
): SetPopulationFilters => (filtersStore) => (options) => {
  // Filters are set by both multi-select and single-select components
  // so the options can be either an array or a string,
  // but we always want to the filter values to be arrays in the filtersStore
  const values = Array.isArray(options)
    ? options.map((o) => o.value)
    : [options.value];
  filtersStore.setFilters({ [filterKey]: values });
};

export const DefaultPopulationFilterOptions: PopulationFilters = {
  [FILTER_TYPES.TIME_PERIOD]: {
    type: FILTER_TYPES.TIME_PERIOD,
    title: "Time Period",
    isSingleSelect: true,
    setFilters: setFilters(FILTER_TYPES.TIME_PERIOD),
    options: [
      { label: "6 months", value: "6" },
      { label: "1 year", value: "12" },
      { label: "2 years", value: "24" },
      { label: "5 years", value: "60" },
    ],
    get defaultOption(): FilterOption {
      return this.options[0];
    },
    get defaultValue(): string {
      return this.defaultOption.value;
    },
    enabledViews: [CORE_VIEWS.community, CORE_VIEWS.facilities],
  },
  [FILTER_TYPES.GENDER]: {
    type: FILTER_TYPES.GENDER,
    title: "Gender",
    isSingleSelect: true,
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
  [FILTER_TYPES.SUPERVISION_TYPE]: {
    type: FILTER_TYPES.SUPERVISION_TYPE,
    title: "Supervision Type",
    isSingleSelect: true,
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
  [FILTER_TYPES.AGE_GROUP]: {
    type: FILTER_TYPES.AGE_GROUP,
    title: "Age",
    setFilters: setFilters(FILTER_TYPES.AGE_GROUP),
    options: [
      { label: "All", value: "ALL" },
      { label: "<25 years old", value: "<25" },
      { label: "25-29 years old", value: "25-29" },
      { label: "30-34 years old", value: "30-34" },
      { label: "35-39 years old", value: "35-39" },
      { label: "40-44 years old", value: "40-44" },
      { label: "45-49 years old", value: "45-49" },
      { label: "50-54 years old", value: "50-54" },
      { label: "55-59 years old", value: "55-59" },
      { label: "60+ years old", value: "60+" },
    ],
    get defaultOption(): FilterOption {
      return this.options[0];
    },
    get defaultValue(): string {
      return this.defaultOption.value;
    },
    enabledViews: [CORE_VIEWS.facilities],
  },
  [FILTER_TYPES.LEGAL_STATUS]: {
    type: FILTER_TYPES.LEGAL_STATUS,
    title: "Legal Status",
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
  [FILTER_TYPES.FACILITY]: {
    type: FILTER_TYPES.FACILITY,
    title: "Facility",
    setFilters: setFilters(FILTER_TYPES.FACILITY),
    options: [
      { label: "All", value: "ALL" },
      { label: "Facility 1", value: "FACILITY_1" },
      { label: "Facility 2", value: "FACILITY_2" },
      { label: "Facility 3", value: "FACILITY_3" },
      { label: "Facility 4", value: "FACILITY_4" },
      { label: "Facility 5", value: "FACILITY_5" },
    ],
    get defaultOption(): FilterOption {
      return this.options[0];
    },
    get defaultValue(): string {
      return this.defaultOption.value;
    },
    enabledViews: [CORE_VIEWS.facilities],
  },
  [FILTER_TYPES.DISTRICT]: {
    type: FILTER_TYPES.DISTRICT,
    title: "District",
    setFilters: setFilters(FILTER_TYPES.DISTRICT),
    options: [
      { label: "All", value: "ALL" },
      { label: "District 1", value: "DISTRICT_1" },
      { label: "District 2", value: "DISTRICT_2" },
      { label: "District 3", value: "DISTRICT_3" },
      { label: "District 4", value: "DISTRICT_4" },
      { label: "District 5", value: "DISTRICT_5" },
    ],
    get defaultOption(): FilterOption {
      return this.options[0];
    },
    get defaultValue(): string {
      return this.defaultOption.value;
    },
    enabledViews: [CORE_VIEWS.facilities],
  },
  [FILTER_TYPES.MOST_SEVERE_VIOLATION]: {
    type: FILTER_TYPES.MOST_SEVERE_VIOLATION,
    title: "Most Severe Violation",
    setFilters: setFilters(FILTER_TYPES.MOST_SEVERE_VIOLATION),
    options: [
      { label: "All", value: "ALL" },
      { label: "Felony", value: "FELONY" },
      { label: "Misdemeanor", value: "MISDEMEANOR" },
      { label: "Technical", value: "TECHNICAL" },
      { label: "Subs. Use", value: "SUBSTANCE_ABUSE" },
      { label: "Absconsion", value: "ABSCONDED" },
      { label: "Municipal", value: "MUNICIPAL" },
    ],
    get defaultOption(): FilterOption {
      return this.options[0];
    },
    get defaultValue(): string {
      return this.defaultOption.value;
    },
    enabledViews: [CORE_VIEWS.facilities],
  },
  [FILTER_TYPES.NUMBER_OF_VIOLATIONS]: {
    type: FILTER_TYPES.NUMBER_OF_VIOLATIONS,
    title: "Number Of Violations",
    setFilters: setFilters(FILTER_TYPES.NUMBER_OF_VIOLATIONS),
    options: [
      { label: "All", value: "ALL" },
      { label: "1", value: "1" },
      { label: "2", value: "2" },
      { label: "3", value: "3" },
      { label: "4", value: "4" },
      { label: "5", value: "5" },
      { label: "6+", value: "6+" },
    ],
    get defaultOption(): FilterOption {
      return this.options[0];
    },
    get defaultValue(): string {
      return this.defaultOption.value;
    },
    enabledViews: [CORE_VIEWS.facilities],
  },
  [FILTER_TYPES.SUPERVISION_LEVEL]: {
    type: FILTER_TYPES.SUPERVISION_LEVEL,
    title: "Supervision Level",
    setFilters: setFilters(FILTER_TYPES.SUPERVISION_LEVEL),
    options: [
      { label: "All", value: "ALL" },
      { label: "Minimum", value: "MINIMUM" },
      { label: "Medium", value: "MEDIUM" },
      { label: "Maximum", value: "MAXIMUM" },
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

export const IdPopulationFilterOptions: PopulationFilters = {
  ...DefaultPopulationFilterOptions,
};

export const TnPopulationFilterOptions: PopulationFilters = {
  ...DefaultPopulationFilterOptions,
  [FILTER_TYPES.LEGAL_STATUS]: {
    type: FILTER_TYPES.LEGAL_STATUS,
    title: "Admission Reason",
    setFilters: setFilters(FILTER_TYPES.LEGAL_STATUS),
    options: [
      { label: "All", value: "ALL" },
      { label: "New admission", value: "NEW_ADMISSION" },
      {
        label: "Transfer from other jurisdiction",
        value: "TRANSFER_FROM_OTHER_JURISDICTION",
      },
      { label: "Transfer", value: "TRANSFER" },
      { label: "Revocation", value: "REVOCATION" },
      {
        label: "Return from temporary release",
        value: "RETURN_FROM_TEMPORARY_RELEASE",
      },
      { label: "Sanction", value: "SANCTION_ADMISSION" },
      { label: "Return from escape", value: "RETURN_FROM_ESCAPE" },
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
    setFilters: setFilters(FILTER_TYPES.FACILITY),
    options: [
      { label: "All", value: "ALL" },
      { label: "MCCX", value: "MCCX" },
      { label: "BCCX", value: "BCCX" },
      { label: "TTCC", value: "TTCC" },
      { label: "SCCF", value: "SCCF" },
      { label: "WCFA", value: "WCFA" },
      { label: "NECX", value: "NECX" },
      { label: "WTSP", value: "WTSP" },
      { label: "NWCX", value: "NWCX" },
      { label: "HCCF", value: "HCCF" },
      { label: "RMSI", value: "RMSI" },
      { label: "SPND", value: "SPND" },
      { label: "MLRC", value: "MLRC" },
      { label: "TCIX", value: "TCIX" },
      { label: "DJRC", value: "DJRC" },
    ],
    get defaultOption(): FilterOption {
      return this.options[0];
    },
    get defaultValue(): string {
      return this.defaultOption.value;
    },
    enabledViews: [CORE_VIEWS.facilities],
  },
  [FILTER_TYPES.DISTRICT]: {
    type: FILTER_TYPES.DISTRICT,
    title: "District",
    setFilters: setFilters(FILTER_TYPES.DISTRICT),
    options: [
      { label: "All", value: "ALL" },
      { label: "District 1", value: "DISTRICT_1" },
      { label: "District 2", value: "DISTRICT_2" },
      { label: "District 3", value: "DISTRICT_3" },
      { label: "District 4", value: "DISTRICT_4" },
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

export const MePopulationFilterOptions: PopulationFilters = {
  ...DefaultPopulationFilterOptions,
};

export const DemoPopulationFilterOptions: PopulationFilters = {
  ...DefaultPopulationFilterOptions,
  [FILTER_TYPES.AGE_GROUP]: {
    type: FILTER_TYPES.AGE_GROUP,
    title: "Age",
    setFilters: setFilters(FILTER_TYPES.AGE_GROUP),
    options: [
      { label: "All", value: "ALL" },
      { label: "<25 years old", value: "<25" },
      { label: "25-29 years old", value: "25-29" },
      { label: "30-34 years old", value: "30-34" },
      { label: "60+ years old", value: "60+" },
    ],
    get defaultOption(): FilterOption {
      return this.options[0];
    },
    get defaultValue(): string {
      return this.defaultOption.value;
    },
    enabledViews: [CORE_VIEWS.facilities],
  },
  [FILTER_TYPES.LEGAL_STATUS]: {
    type: FILTER_TYPES.LEGAL_STATUS,
    title: "Admission Reason",
    setFilters: setFilters(FILTER_TYPES.LEGAL_STATUS),
    options: [
      { label: "All", value: "ALL" },
      { label: "New admission", value: "NEW_ADMISSION" },
      { label: "Revocation", value: "REVOCATION" },
      { label: "Transfer", value: "TRANSFER" },
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
    setFilters: setFilters(FILTER_TYPES.FACILITY),
    options: [
      { label: "All", value: "ALL" },
      { label: "Facility 1", value: "FACILITY_1" },
      { label: "Facility 2", value: "FACILITY_2" },
      { label: "Facility 3", value: "FACILITY_3" },
      { label: "Facility 4", value: "FACILITY_4" },
      { label: "Facility 5", value: "FACILITY_5" },
    ],
    get defaultOption(): FilterOption {
      return this.options[0];
    },
    get defaultValue(): string {
      return this.defaultOption.value;
    },
    enabledViews: [CORE_VIEWS.facilities],
  },
  [FILTER_TYPES.DISTRICT]: {
    type: FILTER_TYPES.DISTRICT,
    title: "District",
    setFilters: setFilters(FILTER_TYPES.DISTRICT),
    options: [
      { label: "All", value: "ALL" },
      { label: "District 1", value: "DISTRICT_1" },
      { label: "District 2", value: "DISTRICT_2" },
      { label: "District 3", value: "DISTRICT_3" },
      { label: "District 4", value: "DISTRICT_4" },
      { label: "District 5", value: "DISTRICT_5" },
    ],
    get defaultOption(): FilterOption {
      return this.options[0];
    },
    get defaultValue(): string {
      return this.defaultOption.value;
    },
    enabledViews: [CORE_VIEWS.facilities],
  },
  [FILTER_TYPES.MOST_SEVERE_VIOLATION]: {
    type: FILTER_TYPES.MOST_SEVERE_VIOLATION,
    title: "Most Severe Violation",
    setFilters: setFilters(FILTER_TYPES.MOST_SEVERE_VIOLATION),
    options: [
      { label: "All", value: "ALL" },
      { label: "Felony", value: "FELONY" },
      { label: "Technical", value: "TECHNICAL" },
      { label: "Absconsion", value: "ABSCONDED" },
    ],
    get defaultOption(): FilterOption {
      return this.options[0];
    },
    get defaultValue(): string {
      return this.defaultOption.value;
    },
    enabledViews: [CORE_VIEWS.facilities],
  },
  [FILTER_TYPES.NUMBER_OF_VIOLATIONS]: {
    type: FILTER_TYPES.NUMBER_OF_VIOLATIONS,
    title: "Number Of Violations",
    setFilters: setFilters(FILTER_TYPES.NUMBER_OF_VIOLATIONS),
    options: [
      { label: "All", value: "ALL" },
      { label: "1", value: "1" },
      { label: "2", value: "2" },
      { label: "6+", value: "6+" },
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
  [FILTER_TYPES.TIME_PERIOD]: [
    DefaultPopulationFilterOptions[FILTER_TYPES.TIME_PERIOD].defaultValue,
  ],
  [FILTER_TYPES.GENDER]: [
    DefaultPopulationFilterOptions[FILTER_TYPES.GENDER].defaultValue,
  ] as Gender[],
  [FILTER_TYPES.LEGAL_STATUS]: [
    DefaultPopulationFilterOptions[FILTER_TYPES.LEGAL_STATUS].defaultValue,
  ],
  [FILTER_TYPES.SUPERVISION_TYPE]: [
    DefaultPopulationFilterOptions[FILTER_TYPES.SUPERVISION_TYPE].defaultValue,
  ],
  [FILTER_TYPES.AGE_GROUP]: [
    DefaultPopulationFilterOptions[FILTER_TYPES.AGE_GROUP].defaultValue,
  ] as AgeGroup[],
  [FILTER_TYPES.FACILITY]: [
    DefaultPopulationFilterOptions[FILTER_TYPES.FACILITY].defaultValue,
  ],
  [FILTER_TYPES.DISTRICT]: [
    DefaultPopulationFilterOptions[FILTER_TYPES.DISTRICT].defaultValue,
  ],
  [FILTER_TYPES.MOST_SEVERE_VIOLATION]: [
    DefaultPopulationFilterOptions[FILTER_TYPES.MOST_SEVERE_VIOLATION]
      .defaultValue,
  ],
  [FILTER_TYPES.NUMBER_OF_VIOLATIONS]: [
    DefaultPopulationFilterOptions[FILTER_TYPES.NUMBER_OF_VIOLATIONS]
      .defaultValue,
  ],
  [FILTER_TYPES.SUPERVISION_LEVEL]: [
    DefaultPopulationFilterOptions[FILTER_TYPES.SUPERVISION_LEVEL].defaultValue,
  ],
};

export default {
  [US_ID]: IdPopulationFilterOptions,
  [US_TN]: TnPopulationFilterOptions,
  [US_ME]: MePopulationFilterOptions,
  [US_ND]: DefaultPopulationFilterOptions,
  [US_DEMO]: DemoPopulationFilterOptions,
} as const;
