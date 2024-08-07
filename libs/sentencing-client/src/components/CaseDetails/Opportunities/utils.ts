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

import { Opportunities } from "../../../api";
import { FormValue } from "../types";
import { eligibilityCriteriaToLabelName } from "./constants";

const eligibilityCriteriaKeys = Object.keys(
  eligibilityCriteriaToLabelName,
) as (keyof Opportunities[number])[];

export const getEligibilityCriteria = (opportunity: Opportunities[number]) => {
  return eligibilityCriteriaKeys.reduce(
    (acc, key) => {
      const value = opportunity[key];
      const hasValue = Array.isArray(value) ? value.length > 0 : value;
      if (hasValue) {
        acc[key] = value;
      }
      return acc;
    },
    {} as Record<keyof Opportunities[number], FormValue>,
  );
};
