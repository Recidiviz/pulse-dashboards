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
  US_NY,
} from "~shared-pathways";

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
    ],
  },
  prisonFacilityPopulation: {
    enabledFilters: [
      FILTER_TYPES.DATE_IN_POPULATION,
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
    ],
  },
  prisonPopulationByAgeGroup: {
    enabledFilters: [
      FILTER_TYPES.DATE_IN_POPULATION,
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
    ],
  },
  prisonPopulationByGender: {
    enabledFilters: [
      FILTER_TYPES.DATE_IN_POPULATION,
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
    ],
  },
  prisonPopulationBySex: {
    enabledFilters: [
      FILTER_TYPES.DATE_IN_POPULATION,
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
    ],
  },
  prisonPopulationByRace: {
    enabledFilters: [
      FILTER_TYPES.DATE_IN_POPULATION,
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
    ],
  },
  prisonPopulationByEthnicity: {
    enabledFilters: [
      FILTER_TYPES.DATE_IN_POPULATION,
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
    ],
  },
  prisonPopulationBySentenceLengthMin: {
    enabledFilters: [
      FILTER_TYPES.DATE_IN_POPULATION,
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
    ],
  },
  prisonPopulationBySentenceLengthMax: {
    enabledFilters: [
      FILTER_TYPES.DATE_IN_POPULATION,
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
    ],
  },
  prisonPopulationByChargeCountyCode: {
    enabledFilters: [
      FILTER_TYPES.DATE_IN_POPULATION,
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
    ],
  },
  prisonPopulationByOffenseType: {
    enabledFilters: [
      FILTER_TYPES.DATE_IN_POPULATION,
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
    ],
  },
};

export const enabledFilterOptionsByTenant: Partial<
  Record<PathwaysTenantId, Partial<EnabledFiltersByMetric>>
> = {
  [US_NY]: NyEnabledFilterOptions,
} as const;
