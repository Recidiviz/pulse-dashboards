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

import { DIMENSION_TYPES } from "../utils/constants";

type Dimensions = {
  [DIMENSION_TYPES.TIME_PERIOD]: string;
  [DIMENSION_TYPES.GENDER]: string;
  [DIMENSION_TYPES.LEGAL_STATUS]: string;
  [DIMENSION_TYPES.SUPERVISION_TYPE]: string;
  [DIMENSION_TYPES.AGE_GROUP]: string;
  [DIMENSION_TYPES.FACILITY]: string;
  [DIMENSION_TYPES.DISTRICT]: string;
  [DIMENSION_TYPES.JUDICIAL_DISTRICT]: string;
  [DIMENSION_TYPES.MOST_SEVERE_VIOLATION]: string;
  [DIMENSION_TYPES.NUMBER_OF_VIOLATIONS]: string;
  [DIMENSION_TYPES.SUPERVISION_LEVEL]: string;
  [DIMENSION_TYPES.RACE]: string;
  [DIMENSION_TYPES.PRIOR_LENGTH_OF_INCARCERATION]: string;
  [DIMENSION_TYPES.LENGTH_OF_STAY]: string;
  [DIMENSION_TYPES.OFFICER_NAME]: string;
};

export type Dimension = keyof Dimensions;
