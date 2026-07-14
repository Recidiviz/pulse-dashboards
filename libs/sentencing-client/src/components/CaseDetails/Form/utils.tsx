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

import _ from "lodash";

import { titleCase } from "../../../utils/utils";
import { ReportType } from "../../constants";
import {
  ASAM_CARE_RECOMMENDATION_KEY,
  CLIENT_COUNTY_KEY,
  CLIENT_DISTRICT_KEY,
  CLIENT_GENDER_KEY,
  COUNTY_KEY,
  DISTRICT_KEY,
  GenderToDisplayName,
  MENTAL_HEALTH_DIAGNOSES_KEY,
  NEEDS_TO_BE_ADDRESSED_KEY,
  NeedsToBeAddressed,
  OFFENSE_KEY,
  OTHER_MENTAL_HEALTH_DIAGNOSIS_KEY,
  OTHER_NEED_TO_BE_ADDRESSED_KEY,
  OTHER_PROTECTIVE_FACTORS_KEY,
  PLEA_KEY,
  PROTECTIVE_FACTORS_KEY,
  ProtectiveFactors,
  REPORT_TYPE_KEY,
  SUBSTANCE_USER_DISORDER_DIAGNOSIS_KEY,
} from "../constants";
import { UNKNOWN } from "../Opportunities/constants";
import { FormAttributes, FormUpdates, FormValue } from "../types";
import {
  asamLevelOfCareRecommendation,
  mentalHealthDiagnoses,
  NO_OPTION,
  NONE_OPTION,
  NOT_SURE_YET_OPTION,
  pleas,
  YES_OPTION,
} from "./constants";
import { CountyDistrict, SelectOption } from "./types";

export const getFilteredCountyOptions = (
  countiesOptions: CountyDistrict[],
  caseOrClientCountyDistrict: CountyDistrict,
): SelectOption[] => {
  return countiesOptions
    .filter((selection) => {
      // TODO(#7517) Temporary fix for de-duplicating counties (by filtering out counties without districts)
      if (selection.county && !selection.district) return false;
      if (
        caseOrClientCountyDistrict.district &&
        (!caseOrClientCountyDistrict.county ||
          caseOrClientCountyDistrict.county === UNKNOWN)
      ) {
        return selection.district === caseOrClientCountyDistrict.district;
      }
      return true;
    })
    .map((selection) => ({
      label: titleCase(selection.county),
      value: selection.county,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
};

/**
 * Central registry for enum-backed form fields. Both the display→key lookup maps used in
 * transformUpdates and the parse functions used to populate the form are derived from these
 * registries — adding a new enum-backed field here is the only registration needed.
 */
const ENUM_ARRAY_REGISTRY = {
  [NEEDS_TO_BE_ADDRESSED_KEY]: NeedsToBeAddressed,
  [PROTECTIVE_FACTORS_KEY]: ProtectiveFactors,
  [MENTAL_HEALTH_DIAGNOSES_KEY]: mentalHealthDiagnoses,
} as const;

const ENUM_SCALAR_REGISTRY = {
  [PLEA_KEY]: pleas,
  [ASAM_CARE_RECOMMENDATION_KEY]: asamLevelOfCareRecommendation,
  [REPORT_TYPE_KEY]: ReportType,
  [CLIENT_GENDER_KEY]: GenderToDisplayName,
} as const;

type ArrayEnumKey = keyof typeof ENUM_ARRAY_REGISTRY;
type ScalarEnumKey = keyof typeof ENUM_SCALAR_REGISTRY;

const isArrayEnumKey = (key: string): key is ArrayEnumKey =>
  key in ENUM_ARRAY_REGISTRY;
const isScalarEnumKey = (key: string): key is ScalarEnumKey =>
  key in ENUM_SCALAR_REGISTRY;

const ENUM_ARRAY_LOOKUPS = (
  Object.entries(ENUM_ARRAY_REGISTRY) as [
    ArrayEnumKey,
    Record<string, string>,
  ][]
).reduce(
  (acc, [key, enumObj]) => ({ ...acc, [key]: _.invert(enumObj) }),
  {} as Record<ArrayEnumKey, Record<string, string>>,
);

const ENUM_SCALAR_LOOKUPS = (
  Object.entries(ENUM_SCALAR_REGISTRY) as [
    ScalarEnumKey,
    Record<string, string>,
  ][]
).reduce(
  (acc, [key, enumObj]) => ({ ...acc, [key]: _.invert(enumObj) }),
  {} as Record<ScalarEnumKey, Record<string, string>>,
);

/** Helper functions to parse backend values into frontend-compatible formats */
export const parseBooleanValue = (value?: boolean | null) => {
  if (value === false) return NO_OPTION;
  if (value === true) return YES_OPTION;
  return NOT_SURE_YET_OPTION;
};

const parseEnumArray = (key: ArrayEnumKey, value?: string[] | null) => {
  if (!value) return null;
  const enumObj = ENUM_ARRAY_REGISTRY[key] as Record<string, string>;
  return value.map((val) => enumObj[val]);
};

const parseEnumScalar = (key: ScalarEnumKey, value?: string | null) => {
  if (!value) return null;
  const enumObj = ENUM_SCALAR_REGISTRY[key] as Record<string, string>;
  return enumObj[value];
};

export const parseNeedsToBeAddressedValue = (value?: string[] | null) =>
  parseEnumArray(NEEDS_TO_BE_ADDRESSED_KEY, value);

export const parseProtectiveFactorsValue = (value?: string[] | null) =>
  parseEnumArray(PROTECTIVE_FACTORS_KEY, value);

export const parseMentalHealthDiagnosesValue = (value?: string[] | null) =>
  parseEnumArray(MENTAL_HEALTH_DIAGNOSES_KEY, value);

export const parseAsamCareRecommendationValue = (value?: string | null) =>
  parseEnumScalar(ASAM_CARE_RECOMMENDATION_KEY, value);

export const parsePleaValue = (value?: string | null) =>
  parseEnumScalar(PLEA_KEY, value);

export const parseClientGenderValue = (value?: string | null) =>
  parseEnumScalar(CLIENT_GENDER_KEY, value);

export const parseReportTypeValue = (value?: string | null) =>
  parseEnumScalar(REPORT_TYPE_KEY, value);

/** Converts form update inputs into enums or other backend-compatible data types. */
export const transformUpdates = (
  updates: Partial<FormUpdates>,
): FormAttributes => {
  const transformedUpdates = {} as { [key: string]: FormValue };

  Object.entries(updates).forEach(([key, value]) => {
    if (key === SUBSTANCE_USER_DISORDER_DIAGNOSIS_KEY) {
      if (value === NONE_OPTION || value === NOT_SURE_YET_OPTION) {
        transformedUpdates[key] = value === NONE_OPTION ? NONE_OPTION : null;
        transformedUpdates[ASAM_CARE_RECOMMENDATION_KEY] = null;
      } else {
        transformedUpdates[key] = value; // "Mild" | "Moderate" | "Severe" are already valid enum keys
      }
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
      if (isArrayEnumKey(key)) {
        const lookup = ENUM_ARRAY_LOOKUPS[key];
        transformedUpdates[key] = value.map((val) => lookup[val]);
      } else {
        transformedUpdates[key] = value;
      }
      return;
    }

    const isNumber = typeof value === "number";
    const isBoolean = typeof value === "boolean";
    const isNull = value === null;
    if (
      isNull ||
      isBoolean ||
      isNumber ||
      [
        OTHER_NEED_TO_BE_ADDRESSED_KEY,
        OTHER_PROTECTIVE_FACTORS_KEY,
        OTHER_MENTAL_HEALTH_DIAGNOSIS_KEY,
        OFFENSE_KEY,
        COUNTY_KEY,
        DISTRICT_KEY,
        CLIENT_COUNTY_KEY,
        CLIENT_DISTRICT_KEY,
      ].includes(key)
    ) {
      transformedUpdates[key] = value;
      return;
    }

    const isDate = value instanceof Date;
    if (isDate) {
      transformedUpdates[key] = value;
      return;
    }

    const isUndefined = value === undefined;
    if (isUndefined) return;

    if (typeof value === "string" && isScalarEnumKey(key)) {
      const lookup = ENUM_SCALAR_LOOKUPS[key];
      transformedUpdates[key] = lookup[value];
      return;
    }

    transformedUpdates[key] = value;
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

  if (value === "" || isNaN(numberValue) || !isNumberWithinRange) {
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

/** A function that highlights matched search terms in a given label by wrapping them in styled <span> elements.  */
export const highlightMatchedText = (
  searchInput: string | null,
  label?: string | null,
) => {
  if (!searchInput || !label) return label;

  // Split the input into words by splitting at the white space and filter out empty spaces
  const searchWords = searchInput.toLowerCase().split(/\s+/).filter(Boolean);

  // Escape special regex characters
  const regexString = searchWords
    .map((word) => word.replace(/[.*+?^=!:()|[\]\\]/g, "\\$&"))
    .join("|");

  // Create a regex of each word separated by a regex logical OR symbol `|`
  const regex = new RegExp(`(${regexString})`, "gi");
  /**
   * Split the label into parts based on matches in the regex above.
   * E.g. if the label is "POSSESSION OF A CONTROLLED SUBSTANCE" and the `regex` is `/possession|of/gi`,
   *      the label will be split into the following array: ["CONTROLLED SUBSTANCE-", "POSSESSION", " ", "OF"]
   *      so that we can isolate our fuzzy matched terms efficiently without breaking the entire label into individual words.
   */
  const labelParts = label.split(regex).filter(Boolean);

  // Map through each label part and wrap our matched terms around a styled span
  return labelParts.map((part, index) =>
    searchWords.includes(part.toLowerCase()) ? (
      // TODO(#8709): Add color to design system or change to design system color
      // eslint-disable-next-line react/no-array-index-key
      <span key={index} style={{ backgroundColor: "rgba(160, 255, 202, 1)" }}>
        {part}
      </span>
    ) : (
      part
    ),
  );
};

/**
 * Returns a boolean based on whether or not an added option would make the list of selections
 * exceed the given limit. Used in multi-select radio input components.
 *
 * If the option is already included in the selections, it returns false, because it would be
 * deselected from the list. If the option is "Not Sure Yet", it also returns false, because that
 * particular option deselects all other options.
 */
export const isSelectionOverLimit = (
  selections: string[] | null,
  option: string | null,
  limit: number,
): boolean | undefined => {
  if (!option || !selections) return;

  return (
    !selections.includes(option) &&
    selections.length >= limit &&
    option !== NOT_SURE_YET_OPTION
  );
};
