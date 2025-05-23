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

import {
  US_IA,
  US_PA,
  US_TX,
} from "../../RootStore/TenantStore/dashboardTenants";
import {
  US_DEMO,
  US_ID,
  US_MO,
  US_ND,
  US_TN,
} from "../../RootStore/TenantStore/pathwaysTenants";
import { PathwaysTenants } from "../../RootStore/types";
import { AgeGroup, Gender } from "../models/types";
import {
  FilterOption,
  PopulationFilterLabels,
  PopulationFilters,
  PopulationFilterValues,
  SetPopulationFilters,
} from "../types/filters";
import { FILTER_TYPES, METRIC_MODES } from "./constants";

export type FilterOptions = Record<
  PathwaysTenants | "US_DEMO" | "US_PA" | "US_TX" | "US_IA",
  PopulationFilters
>;

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
  filterOptions: PopulationFilters,
): Record<string, string | string[]> => {
  if (!filterOptions) return {};
  return Object.keys(filtersLabels).reduce(
    (acc, filterType) => {
      const options = filterOptions[
        filterType as keyof PopulationFilterLabels
      ].options.filter((o) =>
        filtersLabels[filterType as keyof PopulationFilterLabels]
          .split(",")
          .includes(o.label),
      );
      const values = options.map((o) => o.value);
      if (options) acc[filterType] = values;
      return acc;
    },
    {} as Record<string, string | string[]>,
  );
};

export const getFilterOption = (
  value: string,
  options: FilterOption[],
): FilterOption =>
  options.find((option) => option.value === value) ?? options[0];

export const getFilterOptions = (
  value: string[],
  options: FilterOption[],
): FilterOption[] => {
  return (
    options.filter((option) => value.includes(option.value)) ?? [options[0]]
  );
};

const setFilters =
  (filterKey: keyof PopulationFilters): SetPopulationFilters =>
  (filtersStore) =>
  (options) => {
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
      { label: "Bench Warrant", value: "BENCH_WARRANT" },
      { label: "Informal Probation", value: "INFORMAL_PROBATION" },
      { label: "Absconsion", value: "ABSCONSION" },
    ],
    get defaultOption(): FilterOption {
      return this.options[0];
    },
    get defaultValue(): string {
      return this.defaultOption.value;
    },
  },
  [FILTER_TYPES.AGE_GROUP]: {
    type: FILTER_TYPES.AGE_GROUP,
    title: "Age",
    setFilters: setFilters(FILTER_TYPES.AGE_GROUP),
    options: [
      { label: "All", value: "ALL" },
      { label: "<25", longLabel: "<25 years old", value: "<25" },
      { label: "25-29", longLabel: "25-29 years old", value: "25-29" },
      { label: "30-34", longLabel: "30-34 years old", value: "30-34" },
      { label: "35-39", longLabel: "35-39 years old", value: "35-39" },
      { label: "40-44", longLabel: "40-44 years old", value: "40-44" },
      { label: "45-49", longLabel: "45-49 years old", value: "45-49" },
      { label: "50-54", longLabel: "50-54 years old", value: "50-54" },
      { label: "55-59", longLabel: "55-59 years old", value: "55-59" },
      { label: "60+", longLabel: "60+ years old", value: "60+" },
    ],
    get defaultOption(): FilterOption {
      return this.options[0];
    },
    get defaultValue(): string {
      return this.defaultOption.value;
    },
  },
  [FILTER_TYPES.LEGAL_STATUS]: {
    type: FILTER_TYPES.LEGAL_STATUS,
    title: "Legal Status",
    isSingleSelect: true,
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
  },
  [FILTER_TYPES.ADMISSION_REASON]: {
    type: FILTER_TYPES.ADMISSION_REASON,
    title: "Admission Reason",
    setFilters: setFilters(FILTER_TYPES.ADMISSION_REASON),
    options: [
      { label: "All", value: "ALL" },
      { label: "New court commitment", value: "NEW_ADMISSION" },
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
      { label: "Admitted in error", value: "ADMITTED_IN_ERROR" },
      { label: "Status change", value: "STATUS_CHANGE" },
    ],
    get defaultOption(): FilterOption {
      return this.options[0];
    },
    get defaultValue(): string {
      return this.defaultOption.value;
    },
  },
  [FILTER_TYPES.FACILITY]: {
    type: FILTER_TYPES.FACILITY,
    title: "Facility",
    setFilters: setFilters(FILTER_TYPES.FACILITY),
    options: [
      { label: "All", value: "ALL" },
      { label: "FACILITY_1", longLabel: "Facility 1", value: "FACILITY_1" },
      { label: "FACILITY_2", longLabel: "Facility 2", value: "FACILITY_2" },
      { label: "FACILITY_3", longLabel: "Facility 3", value: "FACILITY_3" },
      { label: "FACILITY_4", longLabel: "Facility 4", value: "FACILITY_4" },
      { label: "FACILITY_5", longLabel: "Facility 5", value: "FACILITY_5" },
    ],
    get defaultOption(): FilterOption {
      return this.options[0];
    },
    get defaultValue(): string {
      return this.defaultOption.value;
    },
  },
  [FILTER_TYPES.DISTRICT]: {
    type: FILTER_TYPES.DISTRICT,
    title: "District",
    setFilters: setFilters(FILTER_TYPES.DISTRICT),
    options: [
      { label: "All", value: "ALL" },
      { label: "DISTRICT_1", longLabel: "District 1", value: "DISTRICT_1" },
      { label: "DISTRICT_2", longLabel: "District 2", value: "DISTRICT_2" },
      { label: "DISTRICT_3", longLabel: "District 3", value: "DISTRICT_3" },
      { label: "DISTRICT_4", longLabel: "District 4", value: "DISTRICT_4" },
      { label: "DISTRICT_5", longLabel: "District 5", value: "DISTRICT_5" },
    ],
    get defaultOption(): FilterOption {
      return this.options[0];
    },
    get defaultValue(): string {
      return this.defaultOption.value;
    },
  },
  [FILTER_TYPES.JUDICIAL_DISTRICT]: {
    type: FILTER_TYPES.JUDICIAL_DISTRICT,
    title: "Judicial District",
    setFilters: setFilters(FILTER_TYPES.JUDICIAL_DISTRICT),
    options: [
      { label: "All", value: "ALL" },
      {
        label: "District 1",
        longLabel: "District 1",
        value: "JUDICIAL_DISTRICT_1",
      },
      {
        label: "District 2",
        longLabel: "District 2",
        value: "JUDICIAL_DISTRICT_2",
      },
      {
        label: "District 3",
        longLabel: "District 3",
        value: "JUDICIAL_DISTRICT_3",
      },
      {
        label: "District 4",
        longLabel: "District 4",
        value: "JUDICIAL_DISTRICT_4",
      },
      {
        label: "District 5",
        longLabel: "District 5",
        value: "JUDICIAL_DISTRICT_5",
      },
    ],
    get defaultOption(): FilterOption {
      return this.options[0];
    },
    get defaultValue(): string {
      return this.defaultOption.value;
    },
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
  },
  [FILTER_TYPES.SUPERVISION_LEVEL]: {
    type: FILTER_TYPES.SUPERVISION_LEVEL,
    title: "Supervision Level",
    setFilters: setFilters(FILTER_TYPES.SUPERVISION_LEVEL),
    options: [
      { label: "All", value: "ALL" },
      { label: "Limited", value: "LIMITED" },
      { label: "Minimum", value: "MINIMUM" },
      { label: "Medium", value: "MEDIUM" },
      { label: "Maximum", value: "MAXIMUM" },
      { label: "High", value: "HIGH" },
    ],
    get defaultOption(): FilterOption {
      return this.options[0];
    },
    get defaultValue(): string {
      return this.defaultOption.value;
    },
  },
  [FILTER_TYPES.RACE]: {
    type: FILTER_TYPES.RACE,
    title: "Race",
    setFilters: setFilters(FILTER_TYPES.RACE),
    options: [
      { label: "All", value: "ALL" },
      { label: "Black", value: "BLACK" },
      { label: "White", value: "WHITE" },
      { label: "Hispanic", value: "HISPANIC" },
    ],
    get defaultOption(): FilterOption {
      return this.options[0];
    },
    get defaultValue(): string {
      return this.defaultOption.value;
    },
  },
};

export const IdPopulationFilterOptions: PopulationFilters = {
  ...DefaultPopulationFilterOptions,
  [FILTER_TYPES.AGE_GROUP]: {
    type: FILTER_TYPES.AGE_GROUP,
    title: "Age",
    setFilters: setFilters(FILTER_TYPES.AGE_GROUP),
    options: [
      { label: "All", value: "ALL" },
      { label: "<25", longLabel: "<25 years old", value: "<25" },
      { label: "25-29", longLabel: "25-29 years old", value: "25-29" },
      { label: "30-34", longLabel: "30-34 years old", value: "30-34" },
      { label: "35-39", longLabel: "35-39 years old", value: "35-39" },
      { label: "40-44", longLabel: "40-44 years old", value: "40-44" },
      { label: "45-49", longLabel: "45-49 years old", value: "45-49" },
      { label: "50-54", longLabel: "50-54 years old", value: "50-54" },
      { label: "55-59", longLabel: "55-59 years old", value: "55-59" },
      { label: "60+", longLabel: "60+ years old", value: "60+" },
      { label: "Unknown", value: "UNKNOWN" },
    ],
    get defaultOption(): FilterOption {
      return this.options[0];
    },
    get defaultValue(): string {
      return this.defaultOption.value;
    },
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
      { label: "Trans Female", value: "TRANS_FEMALE" },
      { label: "Unknown", value: "UNKNOWN" },
    ],
    get defaultOption(): FilterOption {
      return this.options[0];
    },
    get defaultValue(): string {
      return this.defaultOption.value;
    },
  },
  [FILTER_TYPES.FACILITY]: {
    type: FILTER_TYPES.FACILITY,
    title: "Facility",
    setFilters: setFilters(FILTER_TYPES.FACILITY),
    options: [
      { label: "All", value: "ALL" },
      {
        label: "CAPP",
        longLabel: "Correctional Alternative Placement Program",
        value: "CAPP",
      },
      {
        label: "IMSI",
        longLabel: "Idaho Maximum Security Institution",
        value: "IMSI",
      },
      {
        label: "ISCC",
        longLabel: "Idaho State Correctional Center",
        value: "ISCC",
      },
      {
        label: "ISCI",
        longLabel: "Idaho State Correctional Institution",
        value: "ISCI",
      },
      {
        label: "SBWCC",
        longLabel: "South Boise Women's Correctional Center",
        value: "SBWCC",
      },
      {
        label: "SICI",
        longLabel: "South Idaho Correctional Institution",
        value: "SICI",
      },
      {
        label: "NICI",
        longLabel: "North Idaho Correctional Institution",
        value: "NICI",
      },
      {
        label: "ICIO",
        longLabel: "Idaho Correctional Institution-Orofino",
        value: "ICIO",
      },
      {
        label: "PWCC",
        longLabel: "Pocatello Women's Correctional Center",
        value: "PWCC",
      },
      {
        label: "SAWC",
        longLabel: "St. Anthony Work Center",
        value: "SAWC",
      },
      { label: "CJ", longLabel: "County Jail", value: "CJ" },
      { label: "OOS", longLabel: "Out of state", value: "OOS" },
      { label: "WC", longLabel: "Work centers", value: "WC" },
      { label: "OTHER", longLabel: "Other", value: "OTHER" },
      { label: "CRC", longLabel: "Community Reentry Centers", value: "CRC" },
      { label: "SCC", longLabel: "Saguaro Correctional Center", value: "SCC" },
    ],
    get defaultOption(): FilterOption {
      return this.options[0];
    },
    get defaultValue(): string {
      return this.defaultOption.value;
    },
  },
  [FILTER_TYPES.JUDICIAL_DISTRICT]: {
    type: FILTER_TYPES.JUDICIAL_DISTRICT,
    title: "Judicial District",
    setFilters: setFilters(FILTER_TYPES.JUDICIAL_DISTRICT),
    options: [
      { label: "All", value: "ALL" },
      {
        label: "District 1",
        longLabel: "First Judicial District",
        value: "FIRST JUDICIAL DISTRICT",
      },
      {
        label: "District 2",
        longLabel: "Second Judicial District",
        value: "SECOND JUDICIAL DISTRICT",
      },
      {
        label: "District 3",
        longLabel: "Third Judicial District",
        value: "THIRD JUDICIAL DISTRICT",
      },
      {
        label: "District 4",
        longLabel: "Fourth Judicial District",
        value: "FOURTH JUDICIAL DISTRICT",
      },
      {
        label: "District 5",
        longLabel: "Fifth Judicial District",
        value: "FIFTH JUDICIAL DISTRICT",
      },
      {
        label: "District 6",
        longLabel: "Sixth Judicial District",
        value: "SIXTH JUDICIAL DISTRICT",
      },
      {
        label: "District 7",
        longLabel: "Seventh Judicial District",
        value: "SEVENTH JUDICIAL DISTRICT",
      },
      {
        label: "Unknown",
        value: "UNKNOWN",
      },
    ],
    get defaultOption(): FilterOption {
      return this.options[0];
    },
    get defaultValue(): string {
      return this.defaultOption.value;
    },
  },
  [FILTER_TYPES.DISTRICT]: {
    type: FILTER_TYPES.DISTRICT,
    title: "District",
    setFilters: setFilters(FILTER_TYPES.DISTRICT),
    options: [
      { label: "All", longLabel: "All", value: "ALL" },
      {
        label: "District 0",
        longLabel: "District Office 0",
        value: "DISTRICT 0",
      },
      {
        label: "District 1",
        longLabel: "District Office 1, Coeur d'Alene",
        value: "DISTRICT 1",
      },
      {
        label: "District 2",
        longLabel: "District Office 2, Lewiston",
        value: "DISTRICT 2",
      },
      {
        label: "District 3",
        longLabel: "District Office 3, Caldwell",
        value: "DISTRICT 3",
      },
      {
        label: "District 4",
        longLabel: "District Office 4, Boise",
        value: "DISTRICT 4",
      },
      {
        label: "District 5",
        longLabel: "District Office 5, Twin Falls",
        value: "DISTRICT 5",
      },
      {
        label: "District 6",
        longLabel: "District Office 6, Pocatello",
        value: "DISTRICT 6",
      },
      {
        label: "District 7",
        longLabel: "District Office 7, Idaho Falls",
        value: "DISTRICT 7",
      },
      { label: "Federal", longLabel: "Federal", value: "FEDERAL" },
      {
        label: "PCO",
        longLabel: "Parole Commission Office",
        value: "PCO",
      },
      { label: "Unknown", value: "UNKNOWN" },
    ],
    get defaultOption(): FilterOption {
      return this.options[0];
    },
    get defaultValue(): string {
      return this.defaultOption.value;
    },
  },
  [FILTER_TYPES.RACE]: {
    type: FILTER_TYPES.RACE,
    title: "Race",
    setFilters: setFilters(FILTER_TYPES.RACE),
    options: [
      { label: "All", value: "ALL" },
      { label: "Black", value: "BLACK" },
      { label: "White", value: "WHITE" },
      { label: "Hispanic", value: "HISPANIC" },
      { label: "Asian", value: "ASIAN" },
      {
        label: "American Indian/ Alaskan Native",
        value: "AMERICAN_INDIAN_ALASKAN_NATIVE",
      },
      {
        label: "Native Hawaiian/ Pacific Islander",
        value: "NATIVE_HAWAIIAN_PACIFIC_ISLANDER",
      },
      { label: "Other", value: "OTHER" },
      { label: "Unknown", value: "UNKNOWN" },
    ],
    get defaultOption(): FilterOption {
      return this.options[0];
    },
    get defaultValue(): string {
      return this.defaultOption.value;
    },
  },
  [FILTER_TYPES.SUPERVISION_LEVEL]: {
    type: FILTER_TYPES.SUPERVISION_LEVEL,
    title: "Supervision Level",
    setFilters: setFilters(FILTER_TYPES.SUPERVISION_LEVEL),
    options: [
      { label: "All", value: "ALL" },
      { label: "Low", value: "MINIMUM" },
      { label: "Moderate", value: "MEDIUM" },
      { label: "High", value: "HIGH" },
      { label: "Diversion", value: "DIVERSION" },
      { label: "Interstate", value: "INTERSTATE_COMPACT" },
      { label: "In custody", value: "IN_CUSTODY" },
      { label: "Unassigned", value: "UNASSIGNED" },
      { label: "Unsupervised", value: "UNSUPERVISED" },
      { label: "Limited supervision", value: "LIMITED" },
      { label: "Other", value: "OTHER" },
      { label: "Drug Court", value: "DRUG COURT" },
      { label: "Mental Health Court", value: "MENTAL HEALTH COURT" },
      { label: "Absconsion", value: "ABSCONSION" },
      { label: "Maximum", value: "MAXIMUM" },
      { label: "Bench Warrant", value: "BENCH WARRANT" },
      { label: "Veterans Court", value: "VETERANS COURT" },
      { label: "Family Court", value: "FAMILY COURT" },
      { label: "Administrative", value: "ADMINISTRATIVE" },
      { label: "Probation Violator", value: "PROBATION VIOLATOR" },
      { label: "Dosage", value: "DOSAGE" },
      { label: "DUI Court", value: "DUI COURT" },
      { label: "Drug Court Div.", value: "DRUG COURT DIV" },
      { label: "Unknown", value: "INTERNAL_UNKNOWN" },
    ],
    get defaultOption(): FilterOption {
      return this.options[0];
    },
    get defaultValue(): string {
      return this.defaultOption.value;
    },
  },
};

export const TnPopulationFilterOptions: PopulationFilters = {
  ...DefaultPopulationFilterOptions,
  [FILTER_TYPES.AGE_GROUP]: {
    type: FILTER_TYPES.AGE_GROUP,
    title: "Age",
    setFilters: setFilters(FILTER_TYPES.AGE_GROUP),
    options: [
      { label: "All", value: "ALL" },
      { label: "<25", longLabel: "<25 years old", value: "<25" },
      { label: "25-29", longLabel: "25-29 years old", value: "25-29" },
      { label: "30-34", longLabel: "30-34 years old", value: "30-34" },
      { label: "35-39", longLabel: "35-39 years old", value: "35-39" },
      { label: "40-44", longLabel: "40-44 years old", value: "40-44" },
      { label: "45-49", longLabel: "45-49 years old", value: "45-49" },
      { label: "50-54", longLabel: "50-54 years old", value: "50-54" },
      { label: "55-59", longLabel: "55-59 years old", value: "55-59" },
      { label: "60+", longLabel: "60+ years old", value: "60+" },
    ],
    get defaultOption(): FilterOption {
      return this.options[0];
    },
    get defaultValue(): string {
      return this.defaultOption.value;
    },
  },
  [FILTER_TYPES.SUPERVISION_LEVEL]: {
    type: FILTER_TYPES.SUPERVISION_LEVEL,
    title: "Supervision Level",
    setFilters: setFilters(FILTER_TYPES.SUPERVISION_LEVEL),
    options: [
      { label: "All", value: "ALL" },
      { label: "Absconded", value: "ABSCONSION" },
      { label: "Furlough", value: "FURLOUGH" },
      { label: "Minimum", value: "MINIMUM" },
      { label: "Medium", value: "MEDIUM" },
      { label: "Maximum", value: "HIGH" },
      { label: "Enhanced", value: "MAXIMUM" },
      { label: "In Custody", value: "IN_CUSTODY" },
      { label: "Compliant Reporting", value: "LIMITED" },
      { label: "Inactive", value: "UNSUPERVISED" },
      { label: "Intake", value: "UNASSIGNED" },
      { label: "Warrant", value: "WARRANT" },
      { label: "ICOTS", value: "INTERSTATE_COMPACT" },
      { label: "Other", value: "OTHER" },
      { label: "Primary", value: "6P1" },
      { label: "Secondary", value: "6P2" },
      { label: "Intermediate", value: "6P3" },
      { label: "Transitional", value: "6P4" },
      { label: "Low", value: "8LO" },
      { label: "Moderate", value: "8MO" },
      { label: "Unknown", value: "UNKNOWN" },
    ],
    get defaultOption(): FilterOption {
      return this.options[0];
    },
    get defaultValue(): string {
      return this.defaultOption.value;
    },
  },
  [FILTER_TYPES.ADMISSION_REASON]: {
    type: FILTER_TYPES.ADMISSION_REASON,
    title: "Admission Reason",
    setFilters: setFilters(FILTER_TYPES.ADMISSION_REASON),
    options: [
      { label: "All", value: "ALL" },
      { label: "New court commitment", value: "NEW_ADMISSION" },
      {
        label: "Transfer from other jurisdiction",
        value: "TRANSFER_FROM_OTHER_JURISDICTION",
      },
      { label: "Transfer", value: "TRANSFER" },
      { label: "Revocation", value: "REVOCATION" },
      { label: "Status change", value: "STATUS_CHANGE" },
    ],
    get defaultOption(): FilterOption {
      return this.options[0];
    },
    get defaultValue(): string {
      return this.defaultOption.value;
    },
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
      { label: "MLRC", value: "MLTC" },
      { label: "TCIX", value: "TCIX" },
      { label: "DJRC", value: "DJRC" },
      { label: "Inactive", value: "INACTIVE" },
    ],
    get defaultOption(): FilterOption {
      return this.options[0];
    },
    get defaultValue(): string {
      return this.defaultOption.value;
    },
  },
  [FILTER_TYPES.DISTRICT]: {
    type: FILTER_TYPES.DISTRICT,
    title: "District",
    setFilters: setFilters(FILTER_TYPES.DISTRICT),
    options: [
      { label: "All", value: "ALL" },
      { label: "Absconded", value: "DISTRICT 0" },
      { label: "District 10", value: "DISTRICT 10" },
      { label: "District 20", value: "DISTRICT 20" },
      { label: "District 21", value: "DISTRICT 21" },
      { label: "District 30", value: "DISTRICT 30" },
      { label: "District 31", value: "DISTRICT 31" },
      { label: "District 40", value: "DISTRICT 40" },
      { label: "District 41", value: "DISTRICT 41" },
      { label: "District 50", value: "DISTRICT 50" },
      { label: "District 51", value: "DISTRICT 51" },
      { label: "District 60", value: "DISTRICT 60" },
      { label: "District 61", value: "DISTRICT 61" },
      { label: "District 70", value: "DISTRICT 70" },
      { label: "District 71", value: "DISTRICT 71" },
      { label: "District 80", value: "DISTRICT 80" },
      { label: "District 81", value: "DISTRICT 81" },
      { label: "Other", value: "OTHER" },
      { label: "Unknown", value: "UNKNOWN" },
    ],
    get defaultOption(): FilterOption {
      return this.options[0];
    },
    get defaultValue(): string {
      return this.defaultOption.value;
    },
  },
  [FILTER_TYPES.JUDICIAL_DISTRICT]: {
    type: FILTER_TYPES.JUDICIAL_DISTRICT,
    title: "Judicial District",
    setFilters: setFilters(FILTER_TYPES.JUDICIAL_DISTRICT),
    options: [
      { label: "All", longLabel: "All", value: "ALL" },
      { label: "Unknown", longLabel: "Unknown", value: "UNKNOWN" },
      { label: "1", longLabel: "District 1", value: "01" },
      { label: "2", longLabel: "District 2", value: "02" },
      { label: "3", longLabel: "District 3", value: "03" },
      { label: "4", longLabel: "District 4", value: "04" },
      { label: "5", longLabel: "District 5", value: "05" },
      { label: "6", longLabel: "District 6", value: "06" },
      { label: "7", longLabel: "District 7", value: "07" },
      { label: "8", longLabel: "District 8", value: "08" },
      { label: "9", longLabel: "District 9", value: "09" },
      { label: "10", longLabel: "District 10", value: "10" },
      { label: "11", longLabel: "District 11", value: "11" },
      { label: "12", longLabel: "District 12", value: "12" },
      { label: "13", longLabel: "District 13", value: "13" },
      { label: "14", longLabel: "District 14", value: "14" },
      { label: "15", longLabel: "District 15", value: "15" },
      { label: "16", longLabel: "District 16", value: "16" },
      { label: "17", longLabel: "District 17", value: "17" },
      { label: "18", longLabel: "District 18", value: "18" },
      { label: "19", longLabel: "District 19", value: "19" },
      { label: "20", longLabel: "District 20", value: "20" },
      { label: "21", longLabel: "District 21", value: "21" },
      { label: "22", longLabel: "District 22", value: "22" },
      { label: "23", longLabel: "District 23", value: "23" },
      { label: "24", longLabel: "District 24", value: "24" },
      { label: "25", longLabel: "District 25", value: "25" },
      { label: "26", longLabel: "District 26", value: "26" },
      { label: "27", longLabel: "District 27", value: "27" },
      { label: "28", longLabel: "District 28", value: "28" },
      { label: "29", longLabel: "District 29", value: "29" },
      { label: "30", longLabel: "District 30", value: "30" },
      { label: "31", longLabel: "District 31", value: "31" },
    ],
    get defaultOption(): FilterOption {
      return this.options[0];
    },
    get defaultValue(): string {
      return this.defaultOption.value;
    },
  },
  [FILTER_TYPES.RACE]: {
    type: FILTER_TYPES.RACE,
    title: "Race",
    setFilters: setFilters(FILTER_TYPES.RACE),
    options: [
      { label: "All", value: "ALL" },
      { label: "Black", value: "BLACK" },
      { label: "White", value: "WHITE" },
      { label: "Hispanic", value: "HISPANIC" },
      { label: "Asian", value: "ASIAN" },
      {
        label: "American Indian/ Alaskan Native",
        value: "AMERICAN_INDIAN_ALASKAN_NATIVE",
      },
      { label: "Other", value: "OTHER" },
    ],
    get defaultOption(): FilterOption {
      return this.options[0];
    },
    get defaultValue(): string {
      return this.defaultOption.value;
    },
  },
  [FILTER_TYPES.SUPERVISION_TYPE]: {
    type: FILTER_TYPES.SUPERVISION_TYPE,
    title: "Supervision Type",
    setFilters: setFilters(FILTER_TYPES.SUPERVISION_TYPE),
    options: [
      { label: "All", value: "ALL" },
      { label: "Probation", value: "PROBATION" },
      { label: "Parole", value: "PAROLE" },
      { label: "Community corrections", value: "COMMUNITY_CONFINEMENT" },
    ],
    get defaultOption(): FilterOption {
      return this.options[0];
    },
    get defaultValue(): string {
      return this.defaultOption.value;
    },
  },
};

export const MoPopulationFilterOptions: PopulationFilters = {
  ...DefaultPopulationFilterOptions,
  [FILTER_TYPES.SUPERVISION_LEVEL]: {
    type: FILTER_TYPES.SUPERVISION_LEVEL,
    title: "Supervision Level",
    setFilters: setFilters(FILTER_TYPES.SUPERVISION_LEVEL),
    options: [
      { label: "All", value: "ALL" },
      { label: "Incarcerated", value: "INCARCERATED" },
      { label: "Low", value: "MINIMUM" },
      { label: "Moderate", value: "MEDIUM" },
      { label: "High", value: "HIGH" },
      { label: "Maximum", value: "MAXIMUM" },
      { label: "Electronic Monitoring", value: "ELECTRONIC_MONITORING_ONLY" },
      { label: "Unknown", value: "UNKNOWN" },
      { label: "Unassigned", value: "UNASSIGNED" },
      { label: "Other", value: "OTHER" },
    ],
    get defaultOption(): FilterOption {
      return this.options[0];
    },
    get defaultValue(): string {
      return this.defaultOption.value;
    },
  },
  [FILTER_TYPES.RACE]: {
    type: FILTER_TYPES.RACE,
    title: "Race",
    setFilters: setFilters(FILTER_TYPES.RACE),
    options: [
      { label: "All", value: "ALL" },
      { label: "Black", value: "BLACK" },
      { label: "White", value: "WHITE" },
      { label: "Hispanic", value: "HISPANIC" },
      { label: "Asian", value: "ASIAN" },
      {
        label: "American Indian/ Alaskan Native",
        value: "AMERICAN_INDIAN_ALASKAN_NATIVE",
      },
      { label: "Other", value: "OTHER" },
    ],
    get defaultOption(): FilterOption {
      return this.options[0];
    },
    get defaultValue(): string {
      return this.defaultOption.value;
    },
  },
  [FILTER_TYPES.DISTRICT]: {
    type: FILTER_TYPES.DISTRICT,
    title: "Sub-office",
    setFilters: setFilters(FILTER_TYPES.DISTRICT),
    options: [
      { label: "All", value: "ALL" },
      { label: "Northeast", value: "NORTHEAST" },
      { label: "TCSTL", value: "TCSTL" },
      { label: "Southwest", value: "SOUTHWEST" },
      { label: "Central Office", value: "CENTRAL OFFICE" },
      { label: "Eastern", value: "EASTERN" },
      { label: "Southeast", value: "SOUTHEAST" },
      { label: "Unclassified", value: "UNCLASSIFIED_REGION" },
      { label: "Western", value: "WESTERN" },
      { label: "North Central", value: "NORTH CENTRAL" },
    ],
    get defaultOption(): FilterOption {
      return this.options[0];
    },
    get defaultValue(): string {
      return this.defaultOption.value;
    },
  },
};

export const NdPopulationFilterOptions: PopulationFilters = {
  ...DefaultPopulationFilterOptions,
  [FILTER_TYPES.FACILITY]: {
    type: FILTER_TYPES.FACILITY,
    title: "Facility",
    setFilters: setFilters(FILTER_TYPES.FACILITY),
    options: [
      { label: "All", value: "ALL" },
      {
        label: "NDSP",
        longLabel: "North Dakota State Penitentiary",
        value: "NDSP",
      },
      {
        label: "JRCC",
        longLabel: "James River Correctional Center",
        value: "JRCC",
      },
      {
        label: "MRCC",
        longLabel: "Missouri River Correctional Center",
        value: "MRCC",
      },
      {
        label: "HRCC",
        longLabel: "Heart River Correctional Center",
        value: "HRCC",
      },
      {
        label: "DWCRC",
        longLabel: "Dakota Women's Correctional and Rehabilitation Center",
        value: "DWCRC",
      },
      { label: "BTC", longLabel: "Bismarck Transition Center", value: "BTC" },
      { label: "CPP", longLabel: "Community Placement Program", value: "CPP" },
      {
        label: "GFC",
        longLabel: "Grand Forks County Correctional",
        value: "GFC",
      },
      { label: "OOS", longLabel: "Out of state", value: "OOS" },
      {
        label: "TRC",
        longLabel: "Tompkins Rehabilitation and Correctional Center",
        value: "TRC",
      },
      {
        label: "FTPFAR",
        longLabel: "Fargo - Female Transfer Program",
        value: "FTPFAR",
      },
      {
        label: "FTPMND",
        longLabel: "Mandan - Female Transfer Program",
        value: "FTPMND",
      },
      {
        label: "MTPFAR",
        longLabel: "Fargo - Male Transfer Program",
        value: "MTPFAR",
      },
      {
        label: "MTPMND",
        longLabel: "Mandan - Male Transfer Program",
        value: "MTPMND",
      },
      {
        label: "LRRP",
        longLabel: "Lake Region Residential Reentry Center",
        value: "LRRP",
      },
      {
        label: "CJ",
        longLabel: "County Jail",
        value: "CJ",
      },
      {
        label: "NTAD",
        value: "NTAD",
      },
    ],
    get defaultOption(): FilterOption {
      return this.options[0];
    },
    get defaultValue(): string {
      return this.defaultOption.value;
    },
  },
  [FILTER_TYPES.LEGAL_STATUS]: {
    type: FILTER_TYPES.LEGAL_STATUS,
    title: "Admission Reason",
    setFilters: setFilters(FILTER_TYPES.LEGAL_STATUS),
    options: [
      { label: "All", value: "ALL" },
      { label: "New court commitment", value: "NEW_ADMISSION" },
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
      { label: "Admitted in error", value: "ADMITTED_IN_ERROR" },
      { label: "Status change", value: "STATUS_CHANGE" },
    ],
    get defaultOption(): FilterOption {
      return this.options[0];
    },
    get defaultValue(): string {
      return this.defaultOption.value;
    },
  },
  [FILTER_TYPES.DISTRICT]: {
    type: FILTER_TYPES.DISTRICT,
    title: "District",
    setFilters: setFilters(FILTER_TYPES.DISTRICT),
    options: [
      { label: "All", longLabel: "All", value: "ALL" },
      { label: "Beulah", longLabel: "Beulah Office", value: "BEULAH" },
      { label: "Minot", longLabel: "Minot Office", value: "MINOT" },
      { label: "Washburn", longLabel: "Washburn Office", value: "WASHBURN" },
      {
        label: "Watford City",
        longLabel: "Watford City Office",
        value: "WATFORD CITY",
      },
      { label: "Mandan", longLabel: "Mandan Office", value: "MANDAN" },
      { label: "Oakes", longLabel: "Oakes Office", value: "OAKES" },
      { label: "Grafton", longLabel: "Grafton Office", value: "GRAFTON" },
      {
        label: "Grand Forks",
        longLabel: "Grand Forks Office",
        value: "GRAND FORKS",
      },
      { label: "Wahpeton", longLabel: "Wahpeton Office", value: "WAHPETON" },
      { label: "Williston", longLabel: "Williston Office", value: "WILLISTON" },
      { label: "Rolla", longLabel: "Rolla Office", value: "ROLLA" },
      { label: "Jamestown", longLabel: "Jamestown Office", value: "JAMESTOWN" },
      { label: "Bismarck", longLabel: "Bismarck Office", value: "BISMARCK" },
      { label: "Fargo", longLabel: "Fargo Office", value: "FARGO" },
      {
        label: "Central Office",
        longLabel: "Central Office",
        value: "CENTRAL OFFICE",
      },
      { label: "Dickinson", longLabel: "Dickinson Office", value: "DICKINSON" },
      { label: "Bottineau", longLabel: "Bottineau Office", value: "BOTTINEAU" },
      {
        label: "Devils Lake",
        longLabel: "Devils Lake Office",
        value: "DEVILS LAKE",
      },
      { label: "Unknown", value: "UNKNOWN" },
    ],
    get defaultOption(): FilterOption {
      return this.options[0];
    },
    get defaultValue(): string {
      return this.defaultOption.value;
    },
  },
  [FILTER_TYPES.JUDICIAL_DISTRICT]: {
    type: FILTER_TYPES.JUDICIAL_DISTRICT,
    title: "Judicial District",
    setFilters: setFilters(FILTER_TYPES.JUDICIAL_DISTRICT),
    options: [
      { label: "All", value: "ALL" },
      { label: "South Central", value: "SOUTH_CENTRAL" },
      { label: "Northwest", value: "NORTHWEST" },
      { label: "Northeast", value: "NORTHEAST" },
      { label: "Southwest", value: "SOUTHWEST" },
      { label: "Northeast Central", value: "NORTHEAST_CENTRAL" },
      { label: "East Central", value: "EAST_CENTRAL" },
      { label: "Southeast", value: "SOUTHEAST" },
      { label: "North Central", value: "NORTH_CENTRAL" },
      { label: "Unknown", value: "UNKNOWN" },
    ],
    get defaultOption(): FilterOption {
      return this.options[0];
    },
    get defaultValue(): string {
      return this.defaultOption.value;
    },
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
      { label: "Diversion", value: "DIVERSION" },
      { label: "Interstate compact", value: "INTERSTATE_COMPACT" },
      { label: "Unassigned", value: "UNASSIGNED" },
      { label: "Unknown", value: "UNKNOWN" },
    ],
    get defaultOption(): FilterOption {
      return this.options[0];
    },
    get defaultValue(): string {
      return this.defaultOption.value;
    },
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
      { label: "Absconsion", value: "ABSCONSION" },
    ],
    get defaultOption(): FilterOption {
      return this.options[0];
    },
    get defaultValue(): string {
      return this.defaultOption.value;
    },
  },
  [FILTER_TYPES.RACE]: {
    type: FILTER_TYPES.RACE,
    title: "Race",
    setFilters: setFilters(FILTER_TYPES.RACE),
    options: [
      { label: "All", value: "ALL" },
      { label: "Black", value: "BLACK" },
      { label: "White", value: "WHITE" },
      { label: "Hispanic", value: "HISPANIC" },
      { label: "Asian", value: "ASIAN" },
      {
        label: "American Indian/ Alaskan Native",
        value: "AMERICAN_INDIAN_ALASKAN_NATIVE",
      },
      {
        label: "Native Hawaiian/ Pacific Islander",
        value: "NATIVE_HAWAIIAN_PACIFIC_ISLANDER",
      },
      { label: "Other", value: "OTHER" },
      { label: "Unknown", value: "UNKNOWN" },
    ],
    get defaultOption(): FilterOption {
      return this.options[0];
    },
    get defaultValue(): string {
      return this.defaultOption.value;
    },
  },
  [FILTER_TYPES.ADMISSION_REASON]: {
    type: FILTER_TYPES.ADMISSION_REASON,
    title: "Admission Reason",
    setFilters: setFilters(FILTER_TYPES.ADMISSION_REASON),
    options: [
      { label: "All", value: "ALL" },
      { label: "New court commitment", value: "NEW_ADMISSION" },
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
      { label: "Admitted in error", value: "ADMITTED_IN_ERROR" },
      { label: "Status change", value: "STATUS_CHANGE" },
      { label: "Temporary Custody", value: "TEMPORARY_CUSTODY" },
    ],
    get defaultOption(): FilterOption {
      return this.options[0];
    },
    get defaultValue(): string {
      return this.defaultOption.value;
    },
  },
};

export const PaPopulationFilterOptions: PopulationFilters = {
  ...DefaultPopulationFilterOptions,
  [FILTER_TYPES.SUPERVISION_LEVEL]: {
    type: FILTER_TYPES.SUPERVISION_LEVEL,
    title: "Supervision Level",
    setFilters: setFilters(FILTER_TYPES.SUPERVISION_LEVEL),
    options: [
      { label: "All", value: "ALL" },
      { label: "Minimum", value: "MINIMUM" },
      { label: "Medium", value: "MEDIUM" },
      { label: "Maximum", value: "MAXIMUM" },
      { label: "Administrative", value: "ADM" },
      { label: "Special Circumstances", value: "SPC" },
      { label: "Unknown", value: "UNKNOWN" },
    ],
    get defaultOption(): FilterOption {
      return this.options[0];
    },
    get defaultValue(): string {
      return this.defaultOption.value;
    },
  },
};

export const TxPopulationFilterOptions: PopulationFilters = {
  ...DefaultPopulationFilterOptions,
  [FILTER_TYPES.SUPERVISION_LEVEL]: {
    ...DefaultPopulationFilterOptions[FILTER_TYPES.SUPERVISION_LEVEL],
    options: [
      { label: "All", value: "ALL" },
      { label: "High", value: "MAXIMUM" },
      { label: "Moderate", value: "HIGH" },
      { label: "Low-Moderate", value: "MEDIUM" },
      { label: "Low", value: "MINIMUM" },
      { label: "Annual", value: "LIMITED" },
      { label: "In-custody", value: "IN_CUSTODY" },
    ],
  },
};

export const IaPopulationFilterOptions: PopulationFilters = {
  ...DefaultPopulationFilterOptions,
  [FILTER_TYPES.SUPERVISION_LEVEL]: {
    ...DefaultPopulationFilterOptions[FILTER_TYPES.SUPERVISION_LEVEL],
    options: [
      { label: "Level 0", value: "LEVEL 0" },
      { label: "Level 1", value: "LEVEL 1" },
      { label: "Level 2", value: "LEVEL 2" },
      { label: "Level 3", value: "LEVEL 3" },
      { label: "Level 4", value: "LEVEL 4" },
      { label: "Level 5", value: "LEVEL 5" },
      { label: "Low Risk Probation", value: "LOW RISK PROBATION" },
      { label: "Global Positioning", value: "GLOBAL POSITIONING" },
      { label: "Absconded", value: "ABSCONDED" },
      { label: "Minimum Risk Program", value: "MINIMUM RISK PROGRAM" },
      {
        label: "Detained by non-Iowa Jurisdiction",
        value: "DETAINED BY NON-IOWA JURISDICTION",
      },
      { label: "In Jail", value: "IN JAIL" },
      { label: "Escaped", value: "ESCAPED" },
      { label: "Paroled to Detainer", value: "PAROLED TO DETAINER" },
      { label: "In Prison", value: "IN PRISON" },
      { label: "Day Reporting", value: "DAY REPORTING" },
      { label: "Jail (Designated Site)", value: "JAIL (DESIGNATED SITE)" },
      { label: "Intensive Supervision", value: "INTENSIVE SUPERVISION" },
      {
        label: "Detained by Another State",
        value: "DETAINED BY ANOTHER STATE",
      },
      { label: "Electronic Monitoring", value: "ELECTRONIC MONITORING" },
      { label: "Radio Frequency", value: "RADIO FREQUENCY" },
      {
        label: "Global Positioning Satellite",
        value: "GLOBAL POSITIONING SATELLITE",
      },
      {
        label: "Day Reporting Supervision",
        value: "DAY REPORTING SUPERVISION",
      },
      {
        label: "Concurrent Prison Sentence",
        value: "CONCURRENT PRISON SENTENCE",
      },
      { label: "Warrant", value: "WARRANT" },
      { label: "Diversion Program", value: "DIVERSION PROGRAM" },
    ],
  },
};

export const DemoPopulationFilterOptions: PopulationFilters = {
  ...DefaultPopulationFilterOptions,
  [FILTER_TYPES.AGE_GROUP]: {
    type: FILTER_TYPES.AGE_GROUP,
    title: "Age",
    setFilters: setFilters(FILTER_TYPES.AGE_GROUP),
    options: [
      { label: "All", value: "ALL" },
      { label: "<25", longLabel: "<25 years old", value: "<25" },
      { label: "25-29", longLabel: "25-29 years old", value: "25-29" },
      { label: "30-34", longLabel: "30-34 years old", value: "30-34" },
      { label: "60+", longLabel: "60+ years old", value: "60+" },
    ],
    get defaultOption(): FilterOption {
      return this.options[0];
    },
    get defaultValue(): string {
      return this.defaultOption.value;
    },
  },
  [FILTER_TYPES.LEGAL_STATUS]: {
    type: FILTER_TYPES.LEGAL_STATUS,
    title: "Admission Reason",
    setFilters: setFilters(FILTER_TYPES.LEGAL_STATUS),
    options: [
      { label: "All", value: "ALL" },
      { label: "New court commitment", value: "NEW_ADMISSION" },
      { label: "Revocation", value: "REVOCATION" },
      { label: "Transfer", value: "TRANSFER" },
    ],
    get defaultOption(): FilterOption {
      return this.options[0];
    },
    get defaultValue(): string {
      return this.defaultOption.value;
    },
  },
  [FILTER_TYPES.FACILITY]: {
    type: FILTER_TYPES.FACILITY,
    title: "Facility",
    setFilters: setFilters(FILTER_TYPES.FACILITY),
    options: [
      { label: "All", value: "ALL" },
      { label: "FACILITY_1", longLabel: "Facility 1", value: "FACILITY_1" },
      { label: "FACILITY_2", longLabel: "Facility 2", value: "FACILITY_2" },
      { label: "FACILITY_3", longLabel: "Facility 3", value: "FACILITY_3" },
      { label: "FACILITY_4", longLabel: "Facility 4", value: "FACILITY_4" },
      { label: "FACILITY_5", longLabel: "Facility 5", value: "FACILITY_5" },
    ],
    get defaultOption(): FilterOption {
      return this.options[0];
    },
    get defaultValue(): string {
      return this.defaultOption.value;
    },
  },
  [FILTER_TYPES.DISTRICT]: {
    type: FILTER_TYPES.DISTRICT,
    title: "District",
    setFilters: setFilters(FILTER_TYPES.DISTRICT),
    options: [
      { label: "All", value: "ALL" },
      { label: "DISTRICT_1", longLabel: "District 1", value: "DISTRICT_1" },
      { label: "DISTRICT_2", longLabel: "District 2", value: "DISTRICT_2" },
      { label: "DISTRICT_3", longLabel: "District 3", value: "DISTRICT_3" },
      { label: "DISTRICT_4", longLabel: "District 4", value: "DISTRICT_4" },
      { label: "DISTRICT_5", longLabel: "District 5", value: "DISTRICT_5" },
    ],
    get defaultOption(): FilterOption {
      return this.options[0];
    },
    get defaultValue(): string {
      return this.defaultOption.value;
    },
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
  },
  [FILTER_TYPES.RACE]: {
    type: FILTER_TYPES.RACE,
    title: "Race",
    setFilters: setFilters(FILTER_TYPES.RACE),
    options: [
      { label: "All", value: "ALL" },
      { label: "Black", value: "BLACK" },
      { label: "White", value: "WHITE" },
      { label: "Hispanic", value: "HISPANIC" },
    ],
    get defaultOption(): FilterOption {
      return this.options[0];
    },
    get defaultValue(): string {
      return this.defaultOption.value;
    },
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
  [FILTER_TYPES.ADMISSION_REASON]: [
    DefaultPopulationFilterOptions[FILTER_TYPES.ADMISSION_REASON].defaultValue,
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
  [FILTER_TYPES.JUDICIAL_DISTRICT]: [
    DefaultPopulationFilterOptions[FILTER_TYPES.JUDICIAL_DISTRICT].defaultValue,
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
  [FILTER_TYPES.RACE]: [
    DefaultPopulationFilterOptions[FILTER_TYPES.RACE].defaultValue,
  ],
};

const filterOptions: FilterOptions = {
  [US_IA]: IaPopulationFilterOptions,
  [US_ID]: IdPopulationFilterOptions,
  [US_MO]: MoPopulationFilterOptions,
  [US_ND]: NdPopulationFilterOptions,
  [US_PA]: PaPopulationFilterOptions,
  [US_TN]: TnPopulationFilterOptions,
  [US_TX]: TxPopulationFilterOptions,
  [US_DEMO]: DemoPopulationFilterOptions,
} as const;

export default filterOptions;
