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

import _, { capitalize } from "lodash";

import { Case, Client } from "../../../api";
import { ReportType } from "../../Dashboard/types";
import {
  ASAM_CARE_RECOMMENDATION_KEY,
  AsamCareRecommendationKey,
  CLIENT_GENDER_KEY,
  GenderToDisplayName,
  MENTAL_HEALTH_DIAGNOSES_KEY,
  MentalHealthDiagnosesKey,
  NEEDS_TO_BE_ADDRESSED_KEY,
  needsToBeAddressed,
  NeedsToBeAddressedKey,
  NO_OPTION,
  NOT_SURE_YET_OPTION,
  OFFENSE_KEY,
  OTHER_MENTAL_HEALTH_DIAGNOSIS_KEY,
  OTHER_NEED_TO_BE_ADDRESSED_KEY,
  PLEA_KEY,
  PleaKey,
  REPORT_TYPE_KEY,
  SUBSTANCE_USER_DISORDER_DIAGNOSIS_KEY,
  YES_OPTION,
} from "../constants";
import {
  ASAM_CARE_RECOMMENDATION_CRITERIA_KEY,
  MENTAL_HEALTH_DIAGNOSES_CRITERIA_KEY,
  NEEDS_ADDRESSED_CRITERIA_KEY,
} from "../Opportunities/constants";
import { FormAttributes, FormUpdates, FormValue } from "../types";
import {
  asamLevelOfCareRecommendation,
  mentalHealthDiagnoses,
  pleas,
} from "./CaseDetailsFormTemplate";
import { SelectOption } from "./types";

const convertGenderDisplayNameToEnum = (gender: string) => {
  const genderDisplayNameToEnum = _.invert(GenderToDisplayName);
  return genderDisplayNameToEnum[gender];
};

const convertReportTypeDisplayNameToEnum = (reportType: string) => {
  const reportTypeDisplayNameToEnum = _.invert(ReportType);
  return reportTypeDisplayNameToEnum[reportType];
};

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
  value?: boolean | number | string | string[] | null,
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
    if (
      key === NEEDS_TO_BE_ADDRESSED_KEY ||
      key === NEEDS_ADDRESSED_CRITERIA_KEY
    ) {
      return (value as Case[NeedsToBeAddressedKey]).map(
        (val) => needsToBeAddressed[val],
      );
    }
    if (
      key === MENTAL_HEALTH_DIAGNOSES_KEY ||
      key === MENTAL_HEALTH_DIAGNOSES_CRITERIA_KEY
    ) {
      return (value as Case[MentalHealthDiagnosesKey]).map(
        (val) => mentalHealthDiagnoses[val],
      );
    }
  }

  if (
    key === ASAM_CARE_RECOMMENDATION_KEY ||
    key === ASAM_CARE_RECOMMENDATION_CRITERIA_KEY
  ) {
    return (
      asamLevelOfCareRecommendation[
        value as NonNullable<Case[AsamCareRecommendationKey]>
      ] ?? null
    );
  }

  if (key === PLEA_KEY) {
    return pleas[value as NonNullable<Case[PleaKey]>] ?? null;
  }

  if (key === CLIENT_GENDER_KEY) {
    return GenderToDisplayName[value as NonNullable<Client["gender"]>] ?? null;
  }

  if (key === REPORT_TYPE_KEY) {
    return ReportType[value as NonNullable<Case["reportType"]>] ?? null;
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
    if (
      key === SUBSTANCE_USER_DISORDER_DIAGNOSIS_KEY &&
      (value === "None" || value === NOT_SURE_YET_OPTION)
    ) {
      transformedUpdates[key] = null;
      transformedUpdates[ASAM_CARE_RECOMMENDATION_KEY] = null;
      return;
    }

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
      key === OTHER_MENTAL_HEALTH_DIAGNOSIS_KEY ||
      key === OFFENSE_KEY
    ) {
      transformedUpdates[key] = value;
      return;
    }

    const isUndefined = value === undefined;
    if (isUndefined) return;

    if (key === REPORT_TYPE_KEY) {
      transformedUpdates[key] = convertReportTypeDisplayNameToEnum(value);
      return;
    }

    if (key === CLIENT_GENDER_KEY) {
      transformedUpdates[key] = convertGenderDisplayNameToEnum(value);
      return;
    }

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

/** A simple fuzzy matching function that will return a boolean based on whether every word in the input is included in the option label */
export const fuzzyMatch = (input: string, option: SelectOption) => {
  const searchWords = input.toLowerCase().split(/\s+/).filter(Boolean);
  const label = option.label?.toLowerCase();
  return searchWords.every((word) => label?.includes(word));
};
