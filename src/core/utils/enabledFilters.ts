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
  US_ID,
  US_ME,
  US_TN,
} from "../../RootStore/TenantStore/pathwaysTenants";
import { EnabledFiltersByMetric } from "../types/filters";
import { FILTER_TYPES } from "./constants";

export const EnabledFilterOptions: Partial<EnabledFiltersByMetric> = {
  // PRISON
  prisonPopulationOverTime: {
    enabledFilters: [
      FILTER_TYPES.TIME_PERIOD,
      FILTER_TYPES.FACILITY,
      FILTER_TYPES.GENDER,
    ],
    enabledMoreFilters: [FILTER_TYPES.AGE_GROUP, FILTER_TYPES.LEGAL_STATUS],
  },
  prisonFacilityPopulation: {
    enabledFilters: [
      FILTER_TYPES.FACILITY,
      FILTER_TYPES.GENDER,
      FILTER_TYPES.AGE_GROUP,
    ],
    enabledMoreFilters: [FILTER_TYPES.LEGAL_STATUS],
  },
  prisonPopulationPersonLevel: {
    enabledFilters: [
      FILTER_TYPES.FACILITY,
      FILTER_TYPES.GENDER,
      FILTER_TYPES.AGE_GROUP,
    ],
    enabledMoreFilters: [FILTER_TYPES.LEGAL_STATUS],
  },
  // PRISON TO SUPERVISION
  prisonToSupervisionPopulationOverTime: {
    enabledFilters: [
      FILTER_TYPES.TIME_PERIOD,
      FILTER_TYPES.FACILITY,
      FILTER_TYPES.GENDER,
    ],
    enabledMoreFilters: [FILTER_TYPES.AGE_GROUP],
  },
  prisonToSupervisionPopulationByAge: {
    enabledFilters: [
      FILTER_TYPES.FACILITY,
      FILTER_TYPES.GENDER,
      FILTER_TYPES.AGE_GROUP,
    ],
  },
  prisonToSupervisionPopulationByFacility: {
    enabledFilters: [
      FILTER_TYPES.FACILITY,
      FILTER_TYPES.GENDER,
      FILTER_TYPES.AGE_GROUP,
    ],
  },
  prisonToSupervisionPopulationPersonLevel: {
    enabledFilters: [
      FILTER_TYPES.FACILITY,
      FILTER_TYPES.GENDER,
      FILTER_TYPES.AGE_GROUP,
    ],
  },
  // SUPERVISION TO PRISON
  supervisionToPrisonOverTime: {
    enabledFilters: [
      FILTER_TYPES.TIME_PERIOD,
      FILTER_TYPES.DISTRICT,
      FILTER_TYPES.MOST_SEVERE_VIOLATION,
    ],
    enabledMoreFilters: [
      FILTER_TYPES.NUMBER_OF_VIOLATIONS,
      FILTER_TYPES.SUPERVISION_TYPE,
      FILTER_TYPES.GENDER,
      FILTER_TYPES.AGE_GROUP,
      FILTER_TYPES.SUPERVISION_LEVEL,
    ],
  },
  supervisionToPrisonPopulationByLengthOfStay: {
    enabledFilters: [
      FILTER_TYPES.DISTRICT,
      FILTER_TYPES.MOST_SEVERE_VIOLATION,
      FILTER_TYPES.NUMBER_OF_VIOLATIONS,
    ],
    enabledMoreFilters: [
      FILTER_TYPES.SUPERVISION_TYPE,
      FILTER_TYPES.GENDER,
      FILTER_TYPES.AGE_GROUP,
      FILTER_TYPES.SUPERVISION_LEVEL,
    ],
  },
  supervisionToPrisonPopulationByNumberOfViolations: {
    enabledFilters: [
      FILTER_TYPES.DISTRICT,
      FILTER_TYPES.MOST_SEVERE_VIOLATION,
      FILTER_TYPES.NUMBER_OF_VIOLATIONS,
    ],
    enabledMoreFilters: [
      FILTER_TYPES.SUPERVISION_TYPE,
      FILTER_TYPES.GENDER,
      FILTER_TYPES.AGE_GROUP,
      FILTER_TYPES.SUPERVISION_LEVEL,
    ],
  },
  supervisionToPrisonPopulationByMostSevereViolation: {
    enabledFilters: [
      FILTER_TYPES.DISTRICT,
      FILTER_TYPES.MOST_SEVERE_VIOLATION,
      FILTER_TYPES.NUMBER_OF_VIOLATIONS,
    ],
    enabledMoreFilters: [
      FILTER_TYPES.SUPERVISION_TYPE,
      FILTER_TYPES.GENDER,
      FILTER_TYPES.AGE_GROUP,
      FILTER_TYPES.SUPERVISION_LEVEL,
    ],
  },
  supervisionToPrisonPopulationByDistrict: {
    enabledFilters: [
      FILTER_TYPES.DISTRICT,
      FILTER_TYPES.MOST_SEVERE_VIOLATION,
      FILTER_TYPES.NUMBER_OF_VIOLATIONS,
    ],
    enabledMoreFilters: [
      FILTER_TYPES.SUPERVISION_TYPE,
      FILTER_TYPES.GENDER,
      FILTER_TYPES.AGE_GROUP,
      FILTER_TYPES.SUPERVISION_LEVEL,
    ],
  },
  supervisionToPrisonPopulationBySupervisionLevel: {
    enabledFilters: [
      FILTER_TYPES.DISTRICT,
      FILTER_TYPES.MOST_SEVERE_VIOLATION,
      FILTER_TYPES.NUMBER_OF_VIOLATIONS,
    ],
    enabledMoreFilters: [
      FILTER_TYPES.SUPERVISION_TYPE,
      FILTER_TYPES.GENDER,
      FILTER_TYPES.AGE_GROUP,
      FILTER_TYPES.SUPERVISION_LEVEL,
    ],
  },
  // SUPERVISION TO LIBERTY
  supervisionToLibertyOverTime: {
    enabledFilters: [
      FILTER_TYPES.TIME_PERIOD,
      FILTER_TYPES.SUPERVISION_TYPE,
      FILTER_TYPES.GENDER,
    ],
  },
};

export const IdEnabledFilterOptions: Partial<EnabledFiltersByMetric> = {
  ...EnabledFilterOptions,
  // PRISON
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
      FILTER_TYPES.SUPERVISION_TYPE,
      FILTER_TYPES.GENDER,
    ],
  },
  // SUPERVISION TO PRISON
  supervisionToPrisonOverTime: {
    enabledFilters: [
      FILTER_TYPES.TIME_PERIOD,
      FILTER_TYPES.SUPERVISION_TYPE,
      FILTER_TYPES.GENDER,
    ],
  },
};

export const TnEnabledFilterOptions: Partial<EnabledFiltersByMetric> = {
  ...EnabledFilterOptions,
};

export const MeEnabledFilterOptions: Partial<EnabledFiltersByMetric> = {
  ...EnabledFilterOptions,
};

export default {
  [US_ID]: IdEnabledFilterOptions,
  [US_TN]: TnEnabledFilterOptions,
  [US_ME]: MeEnabledFilterOptions,
  [US_ND]: undefined,
} as const;
