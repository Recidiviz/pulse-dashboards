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
  NeedsToBeAddressed,
  OFFENSE_KEY,
  OTHER_MENTAL_HEALTH_DIAGNOSIS_KEY,
  OTHER_NEED_TO_BE_ADDRESSED_KEY,
  OTHER_PROTECTIVE_FACTORS_KEY,
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

/** Helper functions to parse backend values into frontend-compatible formats */
export const parseBooleanValue = (value?: boolean | null) => {
  if (value === false) return NO_OPTION;
  if (value === true) return YES_OPTION;
  return NOT_SURE_YET_OPTION;
};

export const parseNeedsToBeAddressedValue = (
  value?: (keyof typeof NeedsToBeAddressed)[] | null,
) => {
  if (!value) return null;
  return value.map((val) => NeedsToBeAddressed[val]);
};

export const parseProtectiveFactorsValue = (
  value?: (keyof typeof ProtectiveFactors)[] | null,
) => {
  if (!value) return null;
  return value.map((val) => ProtectiveFactors[val]);
};

export const parseMentalHealthDiagnosesValue = (
  value?: (keyof typeof mentalHealthDiagnoses)[] | null,
) => {
  if (!value) return null;
  return value.map((val) => mentalHealthDiagnoses[val]);
};

export const parseAsamCareRecommendationValue = (
  value?: keyof typeof asamLevelOfCareRecommendation | null,
) => {
  if (!value) return null;
  return asamLevelOfCareRecommendation[value];
};

export const parsePleaValue = (value?: keyof typeof pleas | null) => {
  if (!value) return null;
  return pleas[value];
};

export const parseClientGenderValue = (
  value?: keyof typeof GenderToDisplayName | null,
) => {
  if (!value) return null;
  return GenderToDisplayName[value];
};

export const parseReportTypeValue = (
  value?: keyof typeof ReportType | null,
) => {
  if (!value) return null;
  return ReportType[value];
};

/** Converts form update inputs into enums or other backend-compatible data types. */
export const transformUpdates = (
  updates: Partial<FormUpdates>,
): FormAttributes => {
  const transformedUpdates = {} as { [key: string]: FormValue };

  Object.entries(updates).forEach(([key, value]) => {
    if (
      key === SUBSTANCE_USER_DISORDER_DIAGNOSIS_KEY &&
      (value === NONE_OPTION || value === NOT_SURE_YET_OPTION)
    ) {
      transformedUpdates[key] = value === NONE_OPTION ? NONE_OPTION : null;
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
      // eslint-disable-next-line react/no-array-index-key
      <span key={index} style={{ backgroundColor: "rgba(160, 255, 202, 1)" }}>
        {part}
      </span>
    ) : (
      part
    ),
  );
};
