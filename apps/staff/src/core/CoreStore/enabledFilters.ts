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

import {
  EnabledFilterOptions,
  EnabledFiltersByMetric,
  FILTER_TYPES,
  PathwaysTenantId,
  US_ID,
  US_MO,
  US_ND,
  US_NY,
  US_TN,
} from "~shared-pathways";

export const IdEnabledFilterOptions: Partial<EnabledFiltersByMetric> = {
  ...EnabledFilterOptions,
  // LIBERTY TO PRISON
  libertyToPrisonPopulationOverTime: {
    enabledFilters: [
      FILTER_TYPES.TIME_PERIOD,
      FILTER_TYPES.JUDICIAL_DISTRICT,
      FILTER_TYPES.SEX,
      FILTER_TYPES.RACE,
      FILTER_TYPES.AGE_GROUP,
    ],
  },
  libertyToPrisonPopulationByDistrict: {
    enabledFilters: [
      FILTER_TYPES.JUDICIAL_DISTRICT,
      FILTER_TYPES.SEX,
      FILTER_TYPES.RACE,
      FILTER_TYPES.AGE_GROUP,
    ],
  },
  libertyToPrisonPopulationByPriorLengthOfIncarceration: {
    enabledFilters: [
      FILTER_TYPES.JUDICIAL_DISTRICT,
      FILTER_TYPES.SEX,
      FILTER_TYPES.RACE,
      FILTER_TYPES.AGE_GROUP,
    ],
  },
  libertyToPrisonPopulationBySex: {
    enabledFilters: [
      FILTER_TYPES.JUDICIAL_DISTRICT,
      FILTER_TYPES.SEX,
      FILTER_TYPES.RACE,
      FILTER_TYPES.AGE_GROUP,
    ],
  },
  libertyToPrisonPopulationByAgeGroup: {
    enabledFilters: [
      FILTER_TYPES.JUDICIAL_DISTRICT,
      FILTER_TYPES.SEX,
      FILTER_TYPES.RACE,
      FILTER_TYPES.AGE_GROUP,
    ],
  },
  libertyToPrisonPopulationByRace: {
    enabledFilters: [
      FILTER_TYPES.JUDICIAL_DISTRICT,
      FILTER_TYPES.SEX,
      FILTER_TYPES.RACE,
      FILTER_TYPES.AGE_GROUP,
      FILTER_TYPES.LEGAL_STATUS,
    ],
  },
  // PRISON
  projectedPrisonPopulationOverTime: {
    enabledFilters: [
      FILTER_TYPES.TIME_PERIOD,
      FILTER_TYPES.SEX,
      FILTER_TYPES.LEGAL_STATUS,
    ],
  },
  // SUPERVISION
  projectedSupervisionPopulationOverTime: {
    enabledFilters: [
      FILTER_TYPES.TIME_PERIOD,
      FILTER_TYPES.SUPERVISION_TYPE,
      FILTER_TYPES.SEX,
    ],
  },
  supervisionToPrisonOverTime: {
    enabledFilters: [
      FILTER_TYPES.TIME_PERIOD,
      FILTER_TYPES.DISTRICT,
      FILTER_TYPES.SEX,
      FILTER_TYPES.RACE,
      FILTER_TYPES.SUPERVISION_TYPE,
    ],
  },
};

export const TnEnabledFilterOptions: Partial<EnabledFiltersByMetric> = {
  ...EnabledFilterOptions,
  // LIBERTY TO PRISON
  libertyToPrisonPopulationOverTime: {
    enabledFilters: [
      FILTER_TYPES.TIME_PERIOD,
      FILTER_TYPES.SEX,
      FILTER_TYPES.RACE,
      FILTER_TYPES.AGE_GROUP,
    ],
  },
  libertyToPrisonPopulationByDistrict: {
    enabledFilters: [
      FILTER_TYPES.SEX,
      FILTER_TYPES.RACE,
      FILTER_TYPES.AGE_GROUP,
    ],
  },
  libertyToPrisonPopulationByPriorLengthOfIncarceration: {
    enabledFilters: [
      FILTER_TYPES.SEX,
      FILTER_TYPES.RACE,
      FILTER_TYPES.AGE_GROUP,
    ],
  },
  libertyToPrisonPopulationBySex: {
    enabledFilters: [
      FILTER_TYPES.SEX,
      FILTER_TYPES.RACE,
      FILTER_TYPES.AGE_GROUP,
    ],
  },
  libertyToPrisonPopulationByAgeGroup: {
    enabledFilters: [
      FILTER_TYPES.SEX,
      FILTER_TYPES.RACE,
      FILTER_TYPES.AGE_GROUP,
    ],
  },
  libertyToPrisonPopulationByRace: {
    enabledFilters: [
      FILTER_TYPES.SEX,
      FILTER_TYPES.RACE,
      FILTER_TYPES.AGE_GROUP,
    ],
  },
  // PRISON
  prisonPopulationOverTime: {
    enabledFilters: [
      FILTER_TYPES.TIME_PERIOD,
      FILTER_TYPES.FACILITY,
      FILTER_TYPES.SEX,
      FILTER_TYPES.RACE,
      FILTER_TYPES.AGE_GROUP,
    ],
  },
  prisonFacilityPopulation: {
    enabledFilters: [
      FILTER_TYPES.FACILITY,
      FILTER_TYPES.SEX,
      FILTER_TYPES.RACE,
      FILTER_TYPES.AGE_GROUP,
    ],
  },
  prisonPopulationByRace: {
    enabledFilters: [
      FILTER_TYPES.FACILITY,
      FILTER_TYPES.SEX,
      FILTER_TYPES.RACE,
      FILTER_TYPES.AGE_GROUP,
    ],
  },
  prisonPopulationPersonLevel: {
    enabledFilters: [
      FILTER_TYPES.FACILITY,
      FILTER_TYPES.SEX,
      FILTER_TYPES.RACE,
      FILTER_TYPES.AGE_GROUP,
    ],
  },
  // SUPERVISION TO PRISON
  supervisionToPrisonOverTime: {
    enabledFilters: [
      FILTER_TYPES.TIME_PERIOD,
      FILTER_TYPES.DISTRICT,
      FILTER_TYPES.SEX,
      FILTER_TYPES.RACE,
      FILTER_TYPES.SUPERVISION_TYPE,
    ],
  },
};

export const MoEnabledFilterOptions: Partial<EnabledFiltersByMetric> = {
  ...EnabledFilterOptions,
};

export const NdEnabledFilterOptions: Partial<EnabledFiltersByMetric> = {
  ...EnabledFilterOptions,
  supervisionToPrisonOverTime: {
    enabledFilters: [
      FILTER_TYPES.TIME_PERIOD,
      FILTER_TYPES.DISTRICT,
      FILTER_TYPES.SEX,
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

export const NyEnabledFilterOptions: Partial<EnabledFiltersByMetric> = {
  ...EnabledFilterOptions,
  // PRISON
  prisonPopulationOverTime: {
    enabledFilters: [
      FILTER_TYPES.TIME_PERIOD,
      FILTER_TYPES.FACILITY,
      FILTER_TYPES.GENDER,
      FILTER_TYPES.SEX,
      FILTER_TYPES.AGE_GROUP,
      FILTER_TYPES.RACE,
      FILTER_TYPES.ETHNICITY,
      FILTER_TYPES.SENTENCE_LENGTH_MIN,
      FILTER_TYPES.SENTENCE_LENGTH_MAX,
      FILTER_TYPES.CHARGE_COUNTY_CODE,
      FILTER_TYPES.OFFENSE_TYPE,
      FILTER_TYPES.CHARGE_DESCRIPTION,
    ],
  },
  prisonFacilityPopulation: {
    enabledFilters: [
      FILTER_TYPES.FACILITY,
      FILTER_TYPES.GENDER,
      FILTER_TYPES.SEX,
      FILTER_TYPES.AGE_GROUP,
      FILTER_TYPES.RACE,
      FILTER_TYPES.ETHNICITY,
      FILTER_TYPES.SENTENCE_LENGTH_MIN,
      FILTER_TYPES.SENTENCE_LENGTH_MAX,
      FILTER_TYPES.CHARGE_COUNTY_CODE,
      FILTER_TYPES.OFFENSE_TYPE,
      FILTER_TYPES.CHARGE_DESCRIPTION,
    ],
  },
  prisonPopulationByAgeGroup: {
    enabledFilters: [
      FILTER_TYPES.FACILITY,
      FILTER_TYPES.GENDER,
      FILTER_TYPES.SEX,
      FILTER_TYPES.AGE_GROUP,
      FILTER_TYPES.RACE,
      FILTER_TYPES.ETHNICITY,
      FILTER_TYPES.SENTENCE_LENGTH_MIN,
      FILTER_TYPES.SENTENCE_LENGTH_MAX,
      FILTER_TYPES.CHARGE_COUNTY_CODE,
      FILTER_TYPES.OFFENSE_TYPE,
      FILTER_TYPES.CHARGE_DESCRIPTION,
    ],
  },
  prisonPopulationByGender: {
    enabledFilters: [
      FILTER_TYPES.FACILITY,
      FILTER_TYPES.GENDER,
      FILTER_TYPES.SEX,
      FILTER_TYPES.AGE_GROUP,
      FILTER_TYPES.RACE,
      FILTER_TYPES.ETHNICITY,
      FILTER_TYPES.SENTENCE_LENGTH_MIN,
      FILTER_TYPES.SENTENCE_LENGTH_MAX,
      FILTER_TYPES.CHARGE_COUNTY_CODE,
      FILTER_TYPES.OFFENSE_TYPE,
      FILTER_TYPES.CHARGE_DESCRIPTION,
    ],
  },
  prisonPopulationBySex: {
    enabledFilters: [
      FILTER_TYPES.FACILITY,
      FILTER_TYPES.GENDER,
      FILTER_TYPES.SEX,
      FILTER_TYPES.AGE_GROUP,
      FILTER_TYPES.RACE,
      FILTER_TYPES.ETHNICITY,
      FILTER_TYPES.SENTENCE_LENGTH_MIN,
      FILTER_TYPES.SENTENCE_LENGTH_MAX,
      FILTER_TYPES.CHARGE_COUNTY_CODE,
      FILTER_TYPES.OFFENSE_TYPE,
      FILTER_TYPES.CHARGE_DESCRIPTION,
    ],
  },
  prisonPopulationByRace: {
    enabledFilters: [
      FILTER_TYPES.FACILITY,
      FILTER_TYPES.GENDER,
      FILTER_TYPES.SEX,
      FILTER_TYPES.AGE_GROUP,
      FILTER_TYPES.RACE,
      FILTER_TYPES.ETHNICITY,
      FILTER_TYPES.SENTENCE_LENGTH_MIN,
      FILTER_TYPES.SENTENCE_LENGTH_MAX,
      FILTER_TYPES.CHARGE_COUNTY_CODE,
      FILTER_TYPES.OFFENSE_TYPE,
      FILTER_TYPES.CHARGE_DESCRIPTION,
    ],
  },
  prisonPopulationByEthnicity: {
    enabledFilters: [
      FILTER_TYPES.FACILITY,
      FILTER_TYPES.GENDER,
      FILTER_TYPES.SEX,
      FILTER_TYPES.AGE_GROUP,
      FILTER_TYPES.RACE,
      FILTER_TYPES.ETHNICITY,
      FILTER_TYPES.SENTENCE_LENGTH_MIN,
      FILTER_TYPES.SENTENCE_LENGTH_MAX,
      FILTER_TYPES.CHARGE_COUNTY_CODE,
      FILTER_TYPES.OFFENSE_TYPE,
      FILTER_TYPES.CHARGE_DESCRIPTION,
    ],
  },
  prisonPopulationBySentenceLengthMin: {
    enabledFilters: [
      FILTER_TYPES.FACILITY,
      FILTER_TYPES.GENDER,
      FILTER_TYPES.SEX,
      FILTER_TYPES.AGE_GROUP,
      FILTER_TYPES.RACE,
      FILTER_TYPES.ETHNICITY,
      FILTER_TYPES.SENTENCE_LENGTH_MIN,
      FILTER_TYPES.SENTENCE_LENGTH_MAX,
      FILTER_TYPES.CHARGE_COUNTY_CODE,
      FILTER_TYPES.OFFENSE_TYPE,
      FILTER_TYPES.CHARGE_DESCRIPTION,
    ],
  },
  prisonPopulationBySentenceLengthMax: {
    enabledFilters: [
      FILTER_TYPES.FACILITY,
      FILTER_TYPES.GENDER,
      FILTER_TYPES.SEX,
      FILTER_TYPES.AGE_GROUP,
      FILTER_TYPES.RACE,
      FILTER_TYPES.ETHNICITY,
      FILTER_TYPES.SENTENCE_LENGTH_MIN,
      FILTER_TYPES.SENTENCE_LENGTH_MAX,
      FILTER_TYPES.CHARGE_COUNTY_CODE,
      FILTER_TYPES.OFFENSE_TYPE,
      FILTER_TYPES.CHARGE_DESCRIPTION,
    ],
  },
  prisonPopulationByChargeCountyCode: {
    enabledFilters: [
      FILTER_TYPES.FACILITY,
      FILTER_TYPES.GENDER,
      FILTER_TYPES.SEX,
      FILTER_TYPES.AGE_GROUP,
      FILTER_TYPES.RACE,
      FILTER_TYPES.ETHNICITY,
      FILTER_TYPES.SENTENCE_LENGTH_MIN,
      FILTER_TYPES.SENTENCE_LENGTH_MAX,
      FILTER_TYPES.CHARGE_COUNTY_CODE,
      FILTER_TYPES.OFFENSE_TYPE,
      FILTER_TYPES.CHARGE_DESCRIPTION,
    ],
  },
  prisonPopulationByOffenseType: {
    enabledFilters: [
      FILTER_TYPES.FACILITY,
      FILTER_TYPES.GENDER,
      FILTER_TYPES.SEX,
      FILTER_TYPES.AGE_GROUP,
      FILTER_TYPES.RACE,
      FILTER_TYPES.ETHNICITY,
      FILTER_TYPES.SENTENCE_LENGTH_MIN,
      FILTER_TYPES.SENTENCE_LENGTH_MAX,
      FILTER_TYPES.CHARGE_COUNTY_CODE,
      FILTER_TYPES.OFFENSE_TYPE,
      FILTER_TYPES.CHARGE_DESCRIPTION,
    ],
  },
  prisonPopulationByChargeDescription: {
    enabledFilters: [
      FILTER_TYPES.FACILITY,
      FILTER_TYPES.GENDER,
      FILTER_TYPES.SEX,
      FILTER_TYPES.AGE_GROUP,
      FILTER_TYPES.RACE,
      FILTER_TYPES.ETHNICITY,
      FILTER_TYPES.SENTENCE_LENGTH_MIN,
      FILTER_TYPES.SENTENCE_LENGTH_MAX,
      FILTER_TYPES.CHARGE_COUNTY_CODE,
      FILTER_TYPES.OFFENSE_TYPE,
      FILTER_TYPES.CHARGE_DESCRIPTION,
    ],
  },
};

export const enabledFilterOptionsByTenant: Record<
  PathwaysTenantId,
  Partial<EnabledFiltersByMetric>
> = {
  [US_ID]: IdEnabledFilterOptions,
  [US_TN]: TnEnabledFilterOptions,
  [US_MO]: MoEnabledFilterOptions,
  [US_ND]: NdEnabledFilterOptions,
  [US_NY]: NyEnabledFilterOptions,
} as const;
