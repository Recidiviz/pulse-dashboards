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

export const SIMULATION_COMPARTMENTS = {
  SUPERVISION: "SUPERVISION",
  INCARCERATION: "INCARCERATION",
};

export const METRIC_MODES = {
  COUNTS: "counts",
  RATES: "rates",
};

export const FILTER_TYPES = {
  TIME_PERIOD: "timePeriod",
  SEX: "sex",
  GENDER: "gender",
  LEGAL_STATUS: "legalStatus",
  ADMISSION_REASON: "admissionReason",
  SUPERVISION_TYPE: "supervisionType",
  AGE_GROUP: "ageGroup",
  FACILITY: "facility",
  DISTRICT: "district",
  JUDICIAL_DISTRICT: "judicialDistrict",
  MOST_SEVERE_VIOLATION: "mostSevereViolation",
  RACE: "race",
  NUMBER_OF_VIOLATIONS: "numberOfViolations",
  SUPERVISION_LEVEL: "supervisionLevel",
  ETHNICITY: "ethnicity",
  SENTENCE_LENGTH_MIN: "sentenceLengthMin",
  SENTENCE_LENGTH_MAX: "sentenceLengthMax",
  CHARGE_COUNTY_CODE: "chargeCountyCode",
  OFFENSE_TYPE: "offenseType",
  CHARGE_DESCRIPTION: "chargeDescription",
  DATE_IN_POPULATION: "dateInPopulation",
} as const;

export const DIMENSION_TYPES = {
  ...FILTER_TYPES,
  PRIOR_LENGTH_OF_INCARCERATION: "priorLengthOfIncarceration",
  LENGTH_OF_STAY: "lengthOfStay",
  OFFICER_NAME: "officerName",
} as const;

export const filtersOrder = [
  FILTER_TYPES.TIME_PERIOD,
  FILTER_TYPES.FACILITY,
  FILTER_TYPES.DISTRICT,
  FILTER_TYPES.SEX,
  FILTER_TYPES.GENDER,
  FILTER_TYPES.LEGAL_STATUS,
  FILTER_TYPES.ADMISSION_REASON,
  FILTER_TYPES.JUDICIAL_DISTRICT,
  FILTER_TYPES.SUPERVISION_TYPE,
  FILTER_TYPES.SUPERVISION_LEVEL,
  FILTER_TYPES.MOST_SEVERE_VIOLATION,
  FILTER_TYPES.NUMBER_OF_VIOLATIONS,
  FILTER_TYPES.AGE_GROUP,
  FILTER_TYPES.RACE,
  FILTER_TYPES.ETHNICITY,
  FILTER_TYPES.SENTENCE_LENGTH_MIN,
  FILTER_TYPES.SENTENCE_LENGTH_MAX,
  FILTER_TYPES.CHARGE_COUNTY_CODE,
  FILTER_TYPES.OFFENSE_TYPE,
  FILTER_TYPES.CHARGE_DESCRIPTION,
  FILTER_TYPES.DATE_IN_POPULATION,
];
