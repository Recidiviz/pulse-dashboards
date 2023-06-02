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

import {
  US_CO,
  US_ID,
  US_ME,
  US_MI,
  US_MO,
  US_NC,
  US_ND,
  US_TN,
} from "../../RootStore/TenantStore/pathwaysTenants";
import { PathwaysTenants } from "../../RootStore/types";
import { EnabledFiltersByMetric } from "../types/filters";
import { FILTER_TYPES } from "./constants";

export const EnabledFilterOptions: Partial<EnabledFiltersByMetric> = {
  // LIBERTY TO PRISON
  libertyToPrisonPopulationOverTime: {
    enabledFilters: [
      FILTER_TYPES.TIME_PERIOD,
      FILTER_TYPES.JUDICIAL_DISTRICT,
      FILTER_TYPES.GENDER,
      FILTER_TYPES.RACE,
      FILTER_TYPES.AGE_GROUP,
    ],
  },
  libertyToPrisonPopulationByDistrict: {
    enabledFilters: [
      FILTER_TYPES.TIME_PERIOD,
      FILTER_TYPES.JUDICIAL_DISTRICT,
      FILTER_TYPES.GENDER,
      FILTER_TYPES.RACE,
      FILTER_TYPES.AGE_GROUP,
    ],
  },
  libertyToPrisonPopulationByPriorLengthOfIncarceration: {
    enabledFilters: [
      FILTER_TYPES.TIME_PERIOD,
      FILTER_TYPES.JUDICIAL_DISTRICT,
      FILTER_TYPES.GENDER,
      FILTER_TYPES.RACE,
      FILTER_TYPES.AGE_GROUP,
    ],
  },
  libertyToPrisonPopulationByGender: {
    enabledFilters: [
      FILTER_TYPES.TIME_PERIOD,
      FILTER_TYPES.JUDICIAL_DISTRICT,
      FILTER_TYPES.GENDER,
      FILTER_TYPES.RACE,
      FILTER_TYPES.AGE_GROUP,
    ],
  },
  libertyToPrisonPopulationByAgeGroup: {
    enabledFilters: [
      FILTER_TYPES.TIME_PERIOD,
      FILTER_TYPES.JUDICIAL_DISTRICT,
      FILTER_TYPES.GENDER,
      FILTER_TYPES.RACE,
      FILTER_TYPES.AGE_GROUP,
    ],
  },
  libertyToPrisonPopulationByRace: {
    enabledFilters: [
      FILTER_TYPES.TIME_PERIOD,
      FILTER_TYPES.JUDICIAL_DISTRICT,
      FILTER_TYPES.GENDER,
      FILTER_TYPES.RACE,
      FILTER_TYPES.AGE_GROUP,
    ],
  },
  // PRISON
  prisonPopulationOverTime: {
    enabledFilters: [
      FILTER_TYPES.TIME_PERIOD,
      FILTER_TYPES.FACILITY,
      FILTER_TYPES.GENDER,
      FILTER_TYPES.RACE,
      FILTER_TYPES.AGE_GROUP,
      FILTER_TYPES.ADMISSION_REASON,
    ],
  },
  prisonFacilityPopulation: {
    enabledFilters: [
      FILTER_TYPES.FACILITY,
      FILTER_TYPES.GENDER,
      FILTER_TYPES.RACE,
      FILTER_TYPES.AGE_GROUP,
      FILTER_TYPES.ADMISSION_REASON,
    ],
  },
  prisonPopulationByRace: {
    enabledFilters: [
      FILTER_TYPES.FACILITY,
      FILTER_TYPES.GENDER,
      FILTER_TYPES.RACE,
      FILTER_TYPES.AGE_GROUP,
      FILTER_TYPES.ADMISSION_REASON,
    ],
  },
  prisonPopulationPersonLevel: {
    enabledFilters: [
      FILTER_TYPES.FACILITY,
      FILTER_TYPES.GENDER,
      FILTER_TYPES.RACE,
      FILTER_TYPES.AGE_GROUP,
      FILTER_TYPES.ADMISSION_REASON,
    ],
  },
  // PRISON TO SUPERVISION
  prisonToSupervisionPopulationOverTime: {
    enabledFilters: [
      FILTER_TYPES.TIME_PERIOD,
      FILTER_TYPES.FACILITY,
      FILTER_TYPES.GENDER,
      FILTER_TYPES.RACE,
      FILTER_TYPES.AGE_GROUP,
    ],
  },
  prisonToSupervisionPopulationByAge: {
    enabledFilters: [
      FILTER_TYPES.TIME_PERIOD,
      FILTER_TYPES.FACILITY,
      FILTER_TYPES.GENDER,
      FILTER_TYPES.RACE,
      FILTER_TYPES.AGE_GROUP,
    ],
  },
  prisonToSupervisionPopulationByFacility: {
    enabledFilters: [
      FILTER_TYPES.TIME_PERIOD,
      FILTER_TYPES.FACILITY,
      FILTER_TYPES.GENDER,
      FILTER_TYPES.RACE,
      FILTER_TYPES.AGE_GROUP,
    ],
  },
  prisonToSupervisionPopulationByRace: {
    enabledFilters: [
      FILTER_TYPES.TIME_PERIOD,
      FILTER_TYPES.FACILITY,
      FILTER_TYPES.GENDER,
      FILTER_TYPES.RACE,
      FILTER_TYPES.AGE_GROUP,
    ],
  },
  prisonToSupervisionPopulationPersonLevel: {
    enabledFilters: [
      FILTER_TYPES.TIME_PERIOD,
      FILTER_TYPES.FACILITY,
      FILTER_TYPES.GENDER,
      FILTER_TYPES.RACE,
      FILTER_TYPES.AGE_GROUP,
    ],
  },
  // SUPERVISION
  supervisionPopulationOverTime: {
    enabledFilters: [
      FILTER_TYPES.TIME_PERIOD,
      FILTER_TYPES.DISTRICT,
      FILTER_TYPES.RACE,
      FILTER_TYPES.SUPERVISION_LEVEL,
    ],
  },
  supervisionPopulationByDistrict: {
    enabledFilters: [
      FILTER_TYPES.DISTRICT,
      FILTER_TYPES.RACE,
      FILTER_TYPES.SUPERVISION_LEVEL,
    ],
  },
  supervisionPopulationBySupervisionLevel: {
    enabledFilters: [
      FILTER_TYPES.DISTRICT,
      FILTER_TYPES.RACE,
      FILTER_TYPES.SUPERVISION_LEVEL,
    ],
  },
  supervisionPopulationByRace: {
    enabledFilters: [
      FILTER_TYPES.DISTRICT,
      FILTER_TYPES.RACE,
      FILTER_TYPES.SUPERVISION_LEVEL,
    ],
  },
  // SUPERVISION TO PRISON
  supervisionToPrisonOverTime: {
    enabledFilters: [
      FILTER_TYPES.TIME_PERIOD,
      FILTER_TYPES.DISTRICT,
      FILTER_TYPES.GENDER,
      FILTER_TYPES.RACE,
      FILTER_TYPES.SUPERVISION_LEVEL,
      FILTER_TYPES.SUPERVISION_TYPE,
    ],
  },
  supervisionToPrisonPopulationByLengthOfStay: {
    enabledFilters: [
      FILTER_TYPES.TIME_PERIOD,
      FILTER_TYPES.DISTRICT,
      FILTER_TYPES.GENDER,
      FILTER_TYPES.RACE,
      FILTER_TYPES.SUPERVISION_LEVEL,
      FILTER_TYPES.SUPERVISION_TYPE,
    ],
  },
  supervisionToPrisonPopulationByDistrict: {
    enabledFilters: [
      FILTER_TYPES.TIME_PERIOD,
      FILTER_TYPES.DISTRICT,
      FILTER_TYPES.GENDER,
      FILTER_TYPES.RACE,
      FILTER_TYPES.SUPERVISION_LEVEL,
      FILTER_TYPES.SUPERVISION_TYPE,
    ],
  },
  supervisionToPrisonPopulationBySupervisionLevel: {
    enabledFilters: [
      FILTER_TYPES.TIME_PERIOD,
      FILTER_TYPES.DISTRICT,
      FILTER_TYPES.GENDER,
      FILTER_TYPES.RACE,
      FILTER_TYPES.SUPERVISION_LEVEL,
      FILTER_TYPES.SUPERVISION_TYPE,
    ],
  },
  supervisionToPrisonPopulationByGender: {
    enabledFilters: [
      FILTER_TYPES.TIME_PERIOD,
      FILTER_TYPES.DISTRICT,
      FILTER_TYPES.GENDER,
      FILTER_TYPES.RACE,
      FILTER_TYPES.SUPERVISION_LEVEL,
      FILTER_TYPES.SUPERVISION_TYPE,
    ],
  },
  supervisionToPrisonPopulationByRace: {
    enabledFilters: [
      FILTER_TYPES.TIME_PERIOD,
      FILTER_TYPES.DISTRICT,
      FILTER_TYPES.GENDER,
      FILTER_TYPES.RACE,
      FILTER_TYPES.SUPERVISION_LEVEL,
      FILTER_TYPES.SUPERVISION_TYPE,
    ],
  },
  supervisionToPrisonPopulationByOfficer: {
    enabledFilters: [
      FILTER_TYPES.TIME_PERIOD,
      FILTER_TYPES.DISTRICT,
      FILTER_TYPES.GENDER,
      FILTER_TYPES.RACE,
      FILTER_TYPES.AGE_GROUP,
      FILTER_TYPES.SUPERVISION_LEVEL,
      FILTER_TYPES.SUPERVISION_TYPE,
    ],
  },
  supervisionToPrisonPopulationByMostSevereViolation: {
    enabledFilters: [
      FILTER_TYPES.TIME_PERIOD,
      FILTER_TYPES.DISTRICT,
      FILTER_TYPES.GENDER,
      FILTER_TYPES.RACE,
      FILTER_TYPES.SUPERVISION_LEVEL,
      FILTER_TYPES.SUPERVISION_TYPE,
    ],
  },
  supervisionToPrisonPopulationByNumberOfViolations: {
    enabledFilters: [
      FILTER_TYPES.TIME_PERIOD,
      FILTER_TYPES.DISTRICT,
      FILTER_TYPES.GENDER,
      FILTER_TYPES.RACE,
      FILTER_TYPES.SUPERVISION_LEVEL,
      FILTER_TYPES.SUPERVISION_TYPE,
    ],
  },
  // SUPERVISION TO LIBERTY
  supervisionToLibertyOverTime: {
    enabledFilters: [
      FILTER_TYPES.TIME_PERIOD,
      FILTER_TYPES.DISTRICT,
      FILTER_TYPES.GENDER,
      FILTER_TYPES.RACE,
      FILTER_TYPES.SUPERVISION_TYPE,
      FILTER_TYPES.AGE_GROUP,
    ],
  },
  supervisionToLibertyPopulationByLengthOfStay: {
    enabledFilters: [
      FILTER_TYPES.TIME_PERIOD,
      FILTER_TYPES.DISTRICT,
      FILTER_TYPES.GENDER,
      FILTER_TYPES.RACE,
      FILTER_TYPES.SUPERVISION_TYPE,
    ],
  },
  supervisionToLibertyPopulationByLocation: {
    enabledFilters: [
      FILTER_TYPES.TIME_PERIOD,
      FILTER_TYPES.DISTRICT,
      FILTER_TYPES.GENDER,
      FILTER_TYPES.RACE,
      FILTER_TYPES.SUPERVISION_TYPE,
      FILTER_TYPES.AGE_GROUP,
    ],
  },
  supervisionToLibertyPopulationByGender: {
    enabledFilters: [
      FILTER_TYPES.TIME_PERIOD,
      FILTER_TYPES.DISTRICT,
      FILTER_TYPES.GENDER,
      FILTER_TYPES.RACE,
      FILTER_TYPES.SUPERVISION_TYPE,
      FILTER_TYPES.AGE_GROUP,
    ],
  },
  supervisionToLibertyPopulationByAgeGroup: {
    enabledFilters: [
      FILTER_TYPES.TIME_PERIOD,
      FILTER_TYPES.DISTRICT,
      FILTER_TYPES.GENDER,
      FILTER_TYPES.RACE,
      FILTER_TYPES.SUPERVISION_TYPE,
      FILTER_TYPES.AGE_GROUP,
    ],
  },
  supervisionToLibertyPopulationByRace: {
    enabledFilters: [
      FILTER_TYPES.TIME_PERIOD,
      FILTER_TYPES.DISTRICT,
      FILTER_TYPES.GENDER,
      FILTER_TYPES.RACE,
      FILTER_TYPES.SUPERVISION_TYPE,
      FILTER_TYPES.AGE_GROUP,
    ],
  },
};

export const CoEnabledFilterOptions: Partial<EnabledFiltersByMetric> = {
  ...EnabledFilterOptions,
  prisonPopulationOverTime: {
    enabledFilters: [
      FILTER_TYPES.TIME_PERIOD,
      FILTER_TYPES.FACILITY,
      FILTER_TYPES.GENDER,
      FILTER_TYPES.RACE,
      FILTER_TYPES.ADMISSION_REASON,
    ],
  },
};

export const IdEnabledFilterOptions: Partial<EnabledFiltersByMetric> = {
  ...EnabledFilterOptions,
  // LIBERTY TO PRISON
  libertyToPrisonPopulationOverTime: {
    enabledFilters: [
      FILTER_TYPES.TIME_PERIOD,
      FILTER_TYPES.JUDICIAL_DISTRICT,
      FILTER_TYPES.GENDER,
      FILTER_TYPES.RACE,
      FILTER_TYPES.AGE_GROUP,
    ],
  },
  libertyToPrisonPopulationByDistrict: {
    enabledFilters: [
      FILTER_TYPES.TIME_PERIOD,
      FILTER_TYPES.JUDICIAL_DISTRICT,
      FILTER_TYPES.GENDER,
      FILTER_TYPES.RACE,
      FILTER_TYPES.AGE_GROUP,
    ],
  },
  libertyToPrisonPopulationByPriorLengthOfIncarceration: {
    enabledFilters: [
      FILTER_TYPES.TIME_PERIOD,
      FILTER_TYPES.JUDICIAL_DISTRICT,
      FILTER_TYPES.GENDER,
      FILTER_TYPES.RACE,
      FILTER_TYPES.AGE_GROUP,
    ],
  },
  libertyToPrisonPopulationByGender: {
    enabledFilters: [
      FILTER_TYPES.TIME_PERIOD,
      FILTER_TYPES.JUDICIAL_DISTRICT,
      FILTER_TYPES.GENDER,
      FILTER_TYPES.RACE,
      FILTER_TYPES.AGE_GROUP,
    ],
  },
  libertyToPrisonPopulationByAgeGroup: {
    enabledFilters: [
      FILTER_TYPES.TIME_PERIOD,
      FILTER_TYPES.JUDICIAL_DISTRICT,
      FILTER_TYPES.GENDER,
      FILTER_TYPES.RACE,
      FILTER_TYPES.AGE_GROUP,
    ],
  },
  libertyToPrisonPopulationByRace: {
    enabledFilters: [
      FILTER_TYPES.TIME_PERIOD,
      FILTER_TYPES.JUDICIAL_DISTRICT,
      FILTER_TYPES.GENDER,
      FILTER_TYPES.RACE,
      FILTER_TYPES.AGE_GROUP,
      FILTER_TYPES.LEGAL_STATUS,
    ],
  },
  // PRISON
  projectedPrisonPopulationOverTime: {
    enabledFilters: [
      FILTER_TYPES.TIME_PERIOD,
      FILTER_TYPES.GENDER,
      FILTER_TYPES.LEGAL_STATUS,
    ],
  },
  // SUPERVISION
  projectedSupervisionPopulationOverTime: {
    enabledFilters: [
      FILTER_TYPES.TIME_PERIOD,
      FILTER_TYPES.SUPERVISION_TYPE,
      FILTER_TYPES.GENDER,
    ],
  },
  supervisionToPrisonOverTime: {
    enabledFilters: [
      FILTER_TYPES.TIME_PERIOD,
      FILTER_TYPES.DISTRICT,
      FILTER_TYPES.GENDER,
      FILTER_TYPES.RACE,
      FILTER_TYPES.SUPERVISION_TYPE,
    ],
  },
};

export const TnEnabledFilterOptions: Partial<EnabledFiltersByMetric> = {
  ...EnabledFilterOptions,
  supervisionToPrisonOverTime: {
    enabledFilters: [
      FILTER_TYPES.TIME_PERIOD,
      FILTER_TYPES.DISTRICT,
      FILTER_TYPES.GENDER,
      FILTER_TYPES.RACE,
      FILTER_TYPES.SUPERVISION_TYPE,
    ],
  },
};

export const MeEnabledFilterOptions: Partial<EnabledFiltersByMetric> = {
  ...EnabledFilterOptions,
  libertyToPrisonPopulationOverTime: {
    enabledFilters: [
      FILTER_TYPES.TIME_PERIOD,
      FILTER_TYPES.GENDER,
      FILTER_TYPES.RACE,
      FILTER_TYPES.AGE_GROUP,
    ],
  },
  libertyToPrisonPopulationByDistrict: {
    enabledFilters: [
      FILTER_TYPES.TIME_PERIOD,
      FILTER_TYPES.GENDER,
      FILTER_TYPES.RACE,
      FILTER_TYPES.AGE_GROUP,
    ],
  },
  libertyToPrisonPopulationByPriorLengthOfIncarceration: {
    enabledFilters: [
      FILTER_TYPES.TIME_PERIOD,
      FILTER_TYPES.GENDER,
      FILTER_TYPES.RACE,
      FILTER_TYPES.AGE_GROUP,
    ],
  },
  libertyToPrisonPopulationByGender: {
    enabledFilters: [
      FILTER_TYPES.TIME_PERIOD,
      FILTER_TYPES.GENDER,
      FILTER_TYPES.RACE,
      FILTER_TYPES.AGE_GROUP,
    ],
  },
  libertyToPrisonPopulationByAgeGroup: {
    enabledFilters: [
      FILTER_TYPES.TIME_PERIOD,
      FILTER_TYPES.GENDER,
      FILTER_TYPES.RACE,
      FILTER_TYPES.AGE_GROUP,
    ],
  },
  libertyToPrisonPopulationByRace: {
    enabledFilters: [
      FILTER_TYPES.TIME_PERIOD,
      FILTER_TYPES.GENDER,
      FILTER_TYPES.RACE,
      FILTER_TYPES.AGE_GROUP,
    ],
  },
  supervisionToPrisonOverTime: {
    enabledFilters: [
      FILTER_TYPES.TIME_PERIOD,
      FILTER_TYPES.DISTRICT,
      FILTER_TYPES.GENDER,
      FILTER_TYPES.RACE,
      FILTER_TYPES.SUPERVISION_TYPE,
    ],
  },
};

export const MiEnabledFilterOptions: Partial<EnabledFiltersByMetric> = {
  ...EnabledFilterOptions,
  prisonPopulationOverTime: {
    enabledFilters: [
      FILTER_TYPES.TIME_PERIOD,
      FILTER_TYPES.FACILITY,
      FILTER_TYPES.GENDER,
      FILTER_TYPES.RACE,
      FILTER_TYPES.ADMISSION_REASON,
    ],
  },
};

export const MoEnabledFilterOptions: Partial<EnabledFiltersByMetric> = {
  ...EnabledFilterOptions,
};

export const NcEnabledFilterOptions: Partial<EnabledFiltersByMetric> = {
  ...EnabledFilterOptions,
};

export const NdEnabledFilterOptions: Partial<EnabledFiltersByMetric> = {
  ...EnabledFilterOptions,
  supervisionToPrisonOverTime: {
    enabledFilters: [
      FILTER_TYPES.TIME_PERIOD,
      FILTER_TYPES.DISTRICT,
      FILTER_TYPES.GENDER,
      FILTER_TYPES.RACE,
      FILTER_TYPES.SUPERVISION_TYPE,
    ],
  },
  supervisionPopulationOverTime: {
    enabledFilters: [
      FILTER_TYPES.TIME_PERIOD,
      FILTER_TYPES.RACE,
      FILTER_TYPES.DISTRICT,
    ],
  },
};

const AllEnabledFilterOptions: Record<
  PathwaysTenants,
  Partial<EnabledFiltersByMetric>
> = {
  [US_CO]: CoEnabledFilterOptions,
  [US_ID]: IdEnabledFilterOptions,
  [US_TN]: TnEnabledFilterOptions,
  [US_ME]: MeEnabledFilterOptions,
  [US_MI]: MiEnabledFilterOptions,
  [US_MO]: MoEnabledFilterOptions,
  [US_NC]: NcEnabledFilterOptions,
  [US_ND]: NdEnabledFilterOptions,
} as const;

export default AllEnabledFilterOptions;
