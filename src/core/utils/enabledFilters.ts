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
import { EnabledFiltersByMetric } from "../types/filters";
import { FILTER_TYPES } from "./constants";

export const EnabledFilterOptions: Partial<EnabledFiltersByMetric> = {
  projectedPrisonPopulationOverTime: {
    enabledFilters: [
      FILTER_TYPES.TIME_PERIOD,
      FILTER_TYPES.GENDER,
      FILTER_TYPES.LEGAL_STATUS,
    ],
  },
  projectedSupervisionPopulationOverTime: {
    enabledFilters: [
      FILTER_TYPES.TIME_PERIOD,
      FILTER_TYPES.GENDER,
      FILTER_TYPES.SUPERVISION_TYPE,
    ],
  },
  supervisionToLibertyOverTime: {
    enabledFilters: [
      FILTER_TYPES.TIME_PERIOD,
      FILTER_TYPES.GENDER,
      FILTER_TYPES.SUPERVISION_TYPE,
    ],
  },
};

export const IdEnabledFilterOptions: Partial<EnabledFiltersByMetric> = {
  ...EnabledFilterOptions,
  supervisionToPrisonOverTime: {
    enabledFilters: [
      FILTER_TYPES.TIME_PERIOD,
      FILTER_TYPES.GENDER,
      FILTER_TYPES.SUPERVISION_TYPE,
    ],
  },
};

export const TnEnabledFilterOptions: Partial<EnabledFiltersByMetric> = {
  ...EnabledFilterOptions,
  prisonPopulationOverTime: {
    enabledFilters: [
      FILTER_TYPES.TIME_PERIOD,
      FILTER_TYPES.FACILITY,
      FILTER_TYPES.GENDER,
    ],
    enabledMoreFilters: [FILTER_TYPES.AGE_GROUP, FILTER_TYPES.LEGAL_STATUS],
  },
  prisonPopulationPersonLevel: {
    enabledFilters: [
      FILTER_TYPES.FACILITY,
      FILTER_TYPES.GENDER,
      FILTER_TYPES.AGE_GROUP,
    ],
    enabledMoreFilters: [FILTER_TYPES.LEGAL_STATUS],
  },
  prisonFacilityPopulation: {
    enabledFilters: [
      FILTER_TYPES.FACILITY,
      FILTER_TYPES.GENDER,
      FILTER_TYPES.AGE_GROUP,
    ],
    enabledMoreFilters: [FILTER_TYPES.LEGAL_STATUS],
  },
  supervisionToPrisonOverTime: {
    enabledFilters: [
      FILTER_TYPES.TIME_PERIOD,
      FILTER_TYPES.GENDER,
      FILTER_TYPES.SUPERVISION_TYPE,
    ],
    enabledMoreFilters: [
      FILTER_TYPES.DISTRICT,
      FILTER_TYPES.MOST_SEVERE_VIOLATION,
      FILTER_TYPES.NUMBER_OF_VIOLATIONS,
    ],
  },
  supervisionToPrisonPopulationByDistrict: {
    enabledFilters: [
      FILTER_TYPES.GENDER,
      FILTER_TYPES.DISTRICT,
      FILTER_TYPES.AGE_GROUP,
    ],
    enabledMoreFilters: [
      FILTER_TYPES.SUPERVISION_TYPE,
      FILTER_TYPES.MOST_SEVERE_VIOLATION,
      FILTER_TYPES.NUMBER_OF_VIOLATIONS,
    ],
  },
};

export default {
  [US_ID]: IdEnabledFilterOptions,
  [US_TN]: TnEnabledFilterOptions,
  [US_ND]: undefined,
} as const;
