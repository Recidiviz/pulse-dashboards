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

import { capitalize } from "lodash";

import { Case } from "../../../api";
import {
  ASAM_CARE_RECOMMENDATION_KEY,
  AsamCareRecommendationKey,
  MENTAL_HEALTH_DIAGNOSES_KEY,
  MentalHealthDiagnosesKey,
  NEEDS_TO_BE_ADDRESSED_KEY,
  NeedsToBeAddressedKey,
  NO_OPTION,
  NOT_SURE_YET_OPTION,
  OTHER_MENTAL_HEALTH_DIAGNOSIS_KEY,
  OTHER_NEED_TO_BE_ADDRESSED_KEY,
  PLEA_KEY,
  PleaKey,
  YES_OPTION,
} from "../constants";
import { FormAttributes, FormUpdates, FormValue } from "../types";
import {
  asamLevelOfCareRecommendation,
  mentalHealthDiagnoses,
  needsToBeAddressed,
  pleas,
} from "./CaseDetailsFormTemplate";

/** Formats form value to enum */
export const formatFormEnumValue = (value: string) => {
  return value
    .replaceAll(/\d+\.\d+/g, "") // removes number strings such as "1.5"
    .replaceAll(/\s*\(.*?\)/g, "") // removes parentheses and strings within parentheses
    .replaceAll("-", " ") // removes all dashes
    .split(" ")
    .map((splitVal) => capitalize(splitVal)) // capitalizes the first letter in each word
    .join("");
};

/** Parses stored values and enums into form/attribute values */
export const parseAttributeValue = (
  key: string,
  value?: boolean | number | string | string[] | Date | null,
) => {
  if (value === undefined) return;

  const isBoolean = typeof value === "boolean";
  if (isBoolean) {
    if (value === false) {
      return NO_OPTION;
    }
    if (value === true) {
      return YES_OPTION;
    }
    if (value === null) {
      return NOT_SURE_YET_OPTION;
    }
  }

  const isArray = Array.isArray(value);
  if (isArray) {
    if (key === NEEDS_TO_BE_ADDRESSED_KEY) {
      return (value as Case[NeedsToBeAddressedKey]).map(
        (val) => needsToBeAddressed[val],
      );
    }
    if (key === MENTAL_HEALTH_DIAGNOSES_KEY) {
      return (value as Case[MentalHealthDiagnosesKey]).map(
        (val) => mentalHealthDiagnoses[val],
      );
    }
  }

  if (key === ASAM_CARE_RECOMMENDATION_KEY) {
    return (
      asamLevelOfCareRecommendation[
        value as NonNullable<Case[AsamCareRecommendationKey]>
      ] ?? null
    );
  }

  if (key === PLEA_KEY) {
    return pleas[value as NonNullable<Case[PleaKey]>] ?? null;
  }

  const isString = typeof value === "string";
  const isNumber = typeof value === "number";
  const isNull = value === null;
  if (isNumber || isNull || isString) {
    return value;
  }

  return value;
};

/** Converts form update inputs into enums or other backend-compatible data types. */
export const transformUpdates = (updates: FormUpdates): FormAttributes => {
  const transformedUpdates = {} as { [key: string]: FormValue };

  Object.entries(updates).forEach(([key, value]) => {
    if (value === NOT_SURE_YET_OPTION) {
      transformedUpdates[key] = null;
      return;
    }
    if (value === YES_OPTION) {
      transformedUpdates[key] = true;
      return;
    }
    if (value === NO_OPTION) {
      transformedUpdates[key] = false;
      return;
    }

    const isArray = Array.isArray(value);
    if (isArray) {
      transformedUpdates[key] = value.map((val) => formatFormEnumValue(val));
      return;
    }

    const isNumber = typeof value === "number";
    const isBoolean = typeof value === "boolean";
    const isNull = value === null;
    if (
      isNull ||
      isBoolean ||
      isNumber ||
      key === OTHER_NEED_TO_BE_ADDRESSED_KEY ||
      key === OTHER_MENTAL_HEALTH_DIAGNOSIS_KEY
    ) {
      transformedUpdates[key] = value;
      return;
    }

    const isUndefined = value === undefined;
    if (isUndefined) return;

    transformedUpdates[key] = formatFormEnumValue(value);
    return;
  });

  return transformedUpdates;
};

/**
 * Provided an LSI-R score, returns a boolean indicating whether or not the LSI-R score is valid (within 0 - 54 range, inclusive)
 */
export const isValidLsirScore = (value: string): boolean => {
  const min = 0;
  const max = 54;
  const numberValue = Number(value);
  const isNumberWithinRange = numberValue >= min && numberValue <= max;

  if (isNaN(numberValue) || !isNumberWithinRange) {
    return false;
  }

  return true;
};
