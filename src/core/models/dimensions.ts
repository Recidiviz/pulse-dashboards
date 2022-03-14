// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2021 Recidiviz, Inc.
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

import { Dimension } from "../types/dimensions";
import { DIMENSION_TYPES } from "../utils/constants";

export const dimensionsByMetricType = {
  // LIBERTY TO PRISON
  liberty_to_prison_count_by_month: [
    DIMENSION_TYPES.GENDER,
    DIMENSION_TYPES.AGE_GROUP,
    DIMENSION_TYPES.JUDICIAL_DISTRICT,
    DIMENSION_TYPES.RACE,
  ],
  liberty_to_prison_population_snapshot_by_dimension: [
    DIMENSION_TYPES.GENDER,
    DIMENSION_TYPES.AGE_GROUP,
    DIMENSION_TYPES.JUDICIAL_DISTRICT,
    DIMENSION_TYPES.RACE,
    DIMENSION_TYPES.PRIOR_LENGTH_OF_INCARCERATION,
  ],
  // PRISON
  prison_population_time_series: [
    DIMENSION_TYPES.GENDER,
    DIMENSION_TYPES.ADMISSION_REASON,
    DIMENSION_TYPES.FACILITY,
    DIMENSION_TYPES.AGE_GROUP,
  ],
  prison_population_projection_time_series: [
    DIMENSION_TYPES.GENDER,
    DIMENSION_TYPES.LEGAL_STATUS,
  ],
  prison_population_snapshot_by_dimension: [
    DIMENSION_TYPES.GENDER,
    DIMENSION_TYPES.ADMISSION_REASON,
    DIMENSION_TYPES.FACILITY,
    DIMENSION_TYPES.AGE_GROUP,
    DIMENSION_TYPES.LENGTH_OF_STAY,
  ],
  prison_population_snapshot_person_level: [
    DIMENSION_TYPES.GENDER,
    DIMENSION_TYPES.ADMISSION_REASON,
    DIMENSION_TYPES.FACILITY,
    DIMENSION_TYPES.AGE_GROUP,
  ],
  // PRISON TO SUPERVISION
  prison_to_supervision_count_by_month: [
    DIMENSION_TYPES.GENDER,
    DIMENSION_TYPES.FACILITY,
    DIMENSION_TYPES.AGE_GROUP,
  ],
  prison_to_supervision_population_snapshot_by_dimension: [
    DIMENSION_TYPES.GENDER,
    DIMENSION_TYPES.FACILITY,
    DIMENSION_TYPES.AGE_GROUP,
  ],
  prison_to_supervision_population_snapshot_person_level: [
    DIMENSION_TYPES.GENDER,
    DIMENSION_TYPES.FACILITY,
    DIMENSION_TYPES.AGE_GROUP,
  ],
  // SUPERVISION
  supervision_population_time_series: [
    DIMENSION_TYPES.DISTRICT,
    DIMENSION_TYPES.SUPERVISION_LEVEL,
  ],
  supervision_population_projection_time_series: [DIMENSION_TYPES.GENDER],
  supervision_population_snapshot_by_dimension: [
    DIMENSION_TYPES.DISTRICT,
    DIMENSION_TYPES.SUPERVISION_LEVEL,
  ],
  // SUPERVISION TO PRISON
  supervision_to_prison_count_by_month: [
    DIMENSION_TYPES.GENDER,
    DIMENSION_TYPES.SUPERVISION_TYPE,
    DIMENSION_TYPES.DISTRICT,
    DIMENSION_TYPES.AGE_GROUP,
    DIMENSION_TYPES.MOST_SEVERE_VIOLATION,
    DIMENSION_TYPES.NUMBER_OF_VIOLATIONS,
    DIMENSION_TYPES.SUPERVISION_LEVEL,
    DIMENSION_TYPES.RACE,
  ],
  supervision_to_prison_population_snapshot_by_dimension: [
    DIMENSION_TYPES.GENDER,
    DIMENSION_TYPES.SUPERVISION_TYPE,
    DIMENSION_TYPES.DISTRICT,
    DIMENSION_TYPES.AGE_GROUP,
    DIMENSION_TYPES.MOST_SEVERE_VIOLATION,
    DIMENSION_TYPES.NUMBER_OF_VIOLATIONS,
    DIMENSION_TYPES.LENGTH_OF_STAY,
    DIMENSION_TYPES.SUPERVISION_LEVEL,
    DIMENSION_TYPES.RACE,
  ],
  supervision_to_prison_population_snapshot_by_officer: [
    DIMENSION_TYPES.GENDER,
    DIMENSION_TYPES.SUPERVISION_TYPE,
    DIMENSION_TYPES.DISTRICT,
    DIMENSION_TYPES.AGE_GROUP,
    DIMENSION_TYPES.SUPERVISION_LEVEL,
    DIMENSION_TYPES.RACE,
    DIMENSION_TYPES.OFFICER_NAME,
  ],
  // SUPERVISION TO LIBERTY
  supervision_to_liberty_count_by_month: [
    DIMENSION_TYPES.GENDER,
    DIMENSION_TYPES.SUPERVISION_TYPE,
    DIMENSION_TYPES.DISTRICT,
    DIMENSION_TYPES.AGE_GROUP,
    DIMENSION_TYPES.RACE,
    DIMENSION_TYPES.SUPERVISION_LEVEL,
  ],
  supervision_to_liberty_population_snapshot_by_dimension: [
    DIMENSION_TYPES.GENDER,
    DIMENSION_TYPES.SUPERVISION_TYPE,
    DIMENSION_TYPES.DISTRICT,
    DIMENSION_TYPES.AGE_GROUP,
    DIMENSION_TYPES.RACE,
    DIMENSION_TYPES.SUPERVISION_LEVEL,
    DIMENSION_TYPES.LENGTH_OF_STAY,
  ],
} as Record<string, Dimension[]>;
