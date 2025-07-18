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

import CryptoJS from "crypto-js";
import Base64 from "crypto-js/enc-base64";
import SHA256 from "crypto-js/sha256";
import {
  addDays,
  format,
  formatDuration,
  intervalToDuration,
  isToday,
  parseISO,
} from "date-fns";
import ceil from "lodash/ceil";
import lowerCase from "lodash/fp/lowerCase";
import pipe from "lodash/fp/pipe";
import startCase from "lodash/fp/startCase";
import moment from "moment";
import numeral from "numeral";
import Pluralize from "pluralize";

import { FullName } from "~datatypes";

import { Dimension } from "../core/types/dimensions";
import { translate } from "./i18nSettings";

const CRYPTO_PASSPHRASE = import.meta.env.VITE_CRYPTO_PASSPHRASE || "";

function getStatePopulations(): string[] {
  return Object.keys(translate("populationChartAttributes"));
}

function getStatePopulationsLabels(): string[] {
  return Object.values(translate("populationChartAttributes"));
}

const genderValueToLabel: Record<string, string> = {
  MALE: "Male",
  FEMALE: "Female",
} as const;

const raceValueToLabel: Record<string, string> = {
  AMERICAN_INDIAN_ALASKAN_NATIVE: "American Indian Alaskan Native",
  ASIAN: "Asian",
  BLACK: "Black",
  HISPANIC: "Hispanic",
  NATIVE_HAWAIIAN_PACIFIC_ISLANDER: "Native Hawaiian Pacific Islander",
  WHITE: "White",
  OTHER: "Other",
  EXTERNAL_UNKNOWN: "Unknown",
} as const;

const matrixViolationTypeToLabel: Record<string, string> = {
  TECHNICAL: "Technical",
  SUBSTANCE_ABUSE: "Subs. use",
  MUNICIPAL: "Municipal",
  ABSCONDED: "Absconsion",
  MISDEMEANOR: "Misdemeanor",
  FELONY: "Felony",
  LOW_TECH: "Low tech.",
  MED_TECH: "Med tech.",
  ELEC_MONITORING: "Elec. monitoring",
  SUBS_USE: "Subs. use",
  ABSCONDING: "Absconding",
  HIGH_TECH: "High tech.",
  SUMMARY_OFFENSE: "Summary offense",
  LAW: "Law",
} as const;

const nameOverrides: Record<string, string> = {
  "DISTRICT OFFICE 1, COEUR D'ALENE": "District Office 1, Coeur d'Alene",
};

function genderValueToHumanReadable(genderValue: string): string {
  return genderValueToLabel[genderValue];
}

function raceValueToHumanReadable(raceValue: string): string {
  return raceValueToLabel[raceValue];
}

function toHtmlFriendly(string: string): string {
  return string.replace(/\W+/g, "-");
}

function toHumanReadable(string: string): string {
  return string.replace(/[-_]/g, " ");
}

function safeToInt(nonInt: string): number | string {
  return !Number.isNaN(Number(nonInt)) ? parseInt(nonInt) : nonInt;
}

function toInt(nonInt: string): number {
  return parseInt(nonInt);
}

function toTitleCase(str: string): string {
  if (nameOverrides[str]) {
    return nameOverrides[str];
  }

  return (
    str &&
    str.replace(
      /\w[^\s-/]*/g,
      (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase(),
    )
  );
}

function formatCurrentAddress(address: string, stateCode: string): string {
  const titleCaseAddress = toTitleCase(address);
  const titleStateCode = toTitleCase(stateCode.replace("US_", ""));
  return titleCaseAddress.replace(
    ` ${titleStateCode} `,
    ` ${titleStateCode.toUpperCase()} `,
  );
}

const humanReadableTitleCase = pipe(lowerCase, startCase);

/*
 * Returns the officer id from the canonical id format, '123: Firstname Lastname'.
 */
function numberFromOfficerId(officerId: string): number {
  // This works even for the described format, correctly parsing out 123
  return toInt(officerId);
}

const violationCountLabel = (count: string): string =>
  count === "8" ? "8+" : count;

/**
 * @returns appropriately singular or plural form of `term` including irregular terms
 */
const pluralizeWord = ({
  term,
  count,
  justAppendS = false,
}: {
  term: string;
  count?: number;
  justAppendS?: boolean;
}): string => {
  if (count) return Pluralize(term, count);

  if (justAppendS) {
    return `${term}s`;
  }

  return Pluralize(term);
};

/**
 * @returns `count` with appropriately singular or plural form of `term`
 */
const pluralize = (count: number, term: string): string => {
  return `${count} ${pluralizeWord({ term: term, count: count })}`;
};

function getPeriodLabelFromMetricPeriodMonthsFilter(
  toggledValue: string,
): string | null {
  const months = toNumber(toggledValue);

  if (!months) return "Invalid date to present";

  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - (months - 1));
  startDate.setDate(1);

  return `${moment(startDate).format("M/D/YYYY")} to present`;
}

function getTrailingLabelFromMetricPeriodMonthsFilter(
  toggledValue: string,
): string {
  if (toggledValue === "1") {
    return "Current month";
  }
  if (toggledValue === "3" || toggledValue === "6" || toggledValue === "12") {
    return `Last ${toggledValue} months`;
  }
  return `Last ${parseInt(toggledValue) / 12} years`;
}

const formatOfficerLabel = (label: string): string => {
  if (!label) return "";
  const groups = label.split(" - ");
  return `${groups[0]} - ${toTitleCase(groups[1])}`;
};

const formatDistrictLabel = (label: string): string => {
  if (!label) return "";
  const groups = label.match(/(.*)(?=DO)(.*)/) || label.match(/(.*)(?=-)(.*)/);
  return groups ? `${toTitleCase(groups[1])}${groups[2]}` : label;
};

const formatLargeNumber = (number: number): string => {
  const ONE_MILLION = 1000000;
  if (Math.abs(number) >= ONE_MILLION) {
    return `${(number / ONE_MILLION).toFixed(1)}M`;
  }
  return numeral(number).format("0,0");
};

function toNumber(stringValue: string): null | number {
  return !Number.isNaN(Number(stringValue)) ? Number(stringValue) : null;
}

function formatPercent(
  percentage: number,
  preserveNegativeValues = false,
): string {
  const percent = preserveNegativeValues ? percentage : Math.abs(percentage);
  return `${numeral(percent).format("0")}%`;
}

function formatISODateString(date: string): string {
  return format(parseISO(date), "M/d/yy");
}

function formatDate(date?: Date, pattern = "M/d/yy"): string {
  if (!date) return "Unknown";

  return format(date, pattern);
}

function formatDateToISO(date: Date, pattern = "yyyy-MM-dd"): string {
  return format(date, pattern);
}

function formatWorkflowsDate(date?: Date): string {
  return formatDate(date, "MMM d, yyyy");
}

function formatWorkflowsDateWithTime(date?: Date): string {
  return formatDate(date, "MMM d, yyyy h:mm a");
}

function formatWorkflowsDateString(
  date?: string | null,
  fallback = "Unknown",
): string {
  if (!date) return fallback;
  return formatWorkflowsDate(new Date(date));
}

function formatDurationFromDays(days: number): string {
  return moment.duration(days, "days").humanize();
}

function formatDurationFromOptionalDays(days?: number, fallback = "—"): string {
  // moment.duration(0).humanize gives "a few seconds", which is not always applicable
  if (days === 0) return "less than 1 day";
  return days ? formatDurationFromDays(days) : fallback;
}

/*
  Given a date, returns the duration from now in the form "X years, Y months"
  If either value is zero, that unit is omitted
 */
function formatYearsMonthsFromNow(date: Date): string {
  return formatDuration(
    intervalToDuration({
      start: date,
      end: new Date(),
    }),
    { format: ["years", "months"], delimiter: ", " },
  );
}

/*
  Given a number of days (assumed to originate in the past), returns duration in the 
  form "X years, Y months".
 */
function formatDaysToYearsMonthsPast(days: number): string {
  const startDate = addDays(new Date(), -days);
  return formatYearsMonthsFromNow(startDate);
}

function getFirstName(fullName: string): string {
  return fullName.split(" ")[0];
}

function toPossessive(name: string): string {
  return `${name}'s`;
}

function generateEmailAddress(id: string, domain?: string): string | undefined {
  return id && domain && `${id}@${domain}`.toLowerCase();
}

function hashEmailAddress(email: string | undefined): string {
  return email ? Base64.stringify(SHA256(email)) : "";
}

function encrypt(plainText: string): string {
  const b64 = CryptoJS.AES.encrypt(plainText, CRYPTO_PASSPHRASE).toString();
  const e64 = CryptoJS.enc.Base64.parse(b64);
  const eHex = e64.toString(CryptoJS.enc.Hex);
  return eHex;
}

function decrypt(hexString: string): string {
  const reb64 = CryptoJS.enc.Hex.parse(hexString);
  const bytes = reb64.toString(CryptoJS.enc.Base64);
  const decrypted = CryptoJS.AES.decrypt(bytes, CRYPTO_PASSPHRASE);
  const plainText = decrypted.toString(CryptoJS.enc.Utf8);
  return plainText;
}

const getTicks = (
  value: number,
): { maxTickValue: number; tickValues: number[]; ticksMargin: number } => {
  const precision = Math.floor(Math.log10(value));
  const max = ceil(value, precision >= 2 ? -precision + 1 : -precision);
  let ticksCount = 0;
  if (max % 5 === 0) {
    ticksCount = 5;
  } else if (max % 4 === 0) {
    ticksCount = 4;
  } else if (max % 3 === 0) {
    ticksCount = 3;
  } else {
    ticksCount = 2;
  }

  const ticks = Array.from({ length: ticksCount + 1 }, (_, i) =>
    Math.round((max / ticksCount) * i),
  );

  const getMarginFactor = (n: number, isFloat: boolean) => {
    if (n <= 2) {
      return isFloat ? 4 : 2.2;
    }
    return 1;
  };

  let tickValues: number[];
  switch (true) {
    case value === -Infinity:
      tickValues = [];
      break;
    case value < 1:
      tickValues = [0.2, 0.4, 0.6, 0.8];
      break;
    default:
      tickValues = ticks;
  }

  return {
    maxTickValue: max,
    tickValues,

    // This value used to determine chart left margin based on tick value length
    ticksMargin:
      (max.toString().length +
        getMarginFactor(max.toString().length, ticks[1] % 1 !== 0)) *
      10,
  };
};

function convertCurlyQuotesToStraight(text: string): string {
  return text.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"');
}

function formatName(fullName: string): string {
  const LAST_NAME_CHARACTER_LIMIT = 10;
  const names = fullName.split(" ");
  const firstInitial = names[0][0];
  const lastName = names[names.length - 1];

  return `${firstInitial}. ${
    lastName.length > LAST_NAME_CHARACTER_LIMIT
      ? `${lastName.slice(0, LAST_NAME_CHARACTER_LIMIT)}...`
      : lastName
  }`;
}

const getDimensionLabel = (
  dimensionType: Dimension,
  dimensionValue: string,
): string => {
  if (
    dimensionType === "priorLengthOfIncarceration" &&
    dimensionValue === "0"
  ) {
    return "  Not previously incarcerated";
  }

  return dimensionValue;
};

const formatDueDateFromToday = (dueDate: Date): string => {
  if (isToday(dueDate)) return "today";
  return moment(dueDate).from(moment().startOf("day"));
};

function splitAuth0UserName(
  name: string,
): Record<"firstName" | "lastName", string> {
  if (name.includes(", ")) {
    const [lastName, firstName] = name.split(", ");
    return { lastName, firstName };
  }
  const splitName = name.split(" ");
  const lastName = splitName[splitName.length - 1];
  const firstName = splitName.slice(0, -1).join(" ");

  return { lastName, firstName };
}

function rangeString({ min, max }: { min?: number; max?: number }) {
  if (min === undefined) return `${max} or Less`;
  if (max === undefined) return `${min} or More`;
  return `${min} - ${max}`;
}

function formatNameFirstLast(fullName: FullName): string {
  const { givenNames = "N/A", middleNames, surname = "Unknown" } = fullName;

  if (middleNames?.length) return `${givenNames} ${middleNames[0]}. ${surname}`;

  return `${givenNames} ${surname}`;
}

function formatNameLastFirst(fullName: FullName): string {
  const { givenNames = "N/A", middleNames, surname = "Unknown" } = fullName;

  const formattedName = `${surname}, ${givenNames}`;

  if (middleNames?.length) return `${formattedName} ${middleNames[0]}.`;

  return formattedName;
}

function getWelcomeText(
  userName: string | undefined,
  welcomeText: string | undefined = "Welcome",
): string {
  if (!userName) return welcomeText;
  return `${welcomeText}, ${userName}`;
}

function getSerialListSeparator(
  index: number,
  arrayLength: number,
  conjunction = "and",
): string {
  if (arrayLength < 2) {
    return "";
  }

  // if exactly two items: no comma, just "and"
  if (arrayLength === 2) {
    return index === 0 ? ` ${conjunction} ` : "";
  }

  // if more than two items, separate with commas until the second to last item, then
  // separate with ", and"
  // eslint-disable-next-line no-nested-ternary
  return index === arrayLength - 2
    ? `, ${conjunction} `
    : index < arrayLength - 2
      ? ", "
      : "";
}

function generateSerialListString(arr: string[], conjunction = "and"): string {
  return arr.reduce((acc, curr, index) => {
    const separator = getSerialListSeparator(index, arr.length, conjunction);
    return `${acc}${curr}${separator}`;
  }, "");
}

function formatDollarAmount(text: string) {
  let textTokens = text.split(" ");
  textTokens = textTokens.map((x) =>
    x.startsWith("$") && x.includes(".")
      ? "$" + parseFloat(x.slice(1)).toFixed(2)
      : x,
  );

  return textTokens.join(" ");
}

function htmlStringToString(htmlString?: string): string {
  if (!htmlString) return "";
  return (
    htmlString
      // replace breaks and divs with new line
      .replace(/<br>|<div>|<\/div>/gi, "\n")
      // remove any other tags
      .replace(/<[^>]*>/gi, "")
      // replace the non-breaking space special character with a space
      .replace(/&nbsp;/gi, " ")
      // remove leading and trailing quotes
      .replace(/^"|"$/g, "")
  );
}

/**
 * Append the word “ Date” (with a leading space) to a label
 * unless it already contains “date” as a standalone word (case-insensitive).
 * The suffix will also match the casing of the existing label:
 *  - all-lower → " date"
 *  - all-upper → " DATE"
 *  - mixed case/title → " Date"
 */
function appendDateSuffixIfMissing(label: string): string {
  const dateStringRegex = /\bdate\b/i;

  if (dateStringRegex.test(label)) {
    return label;
  }

  let suffix = "Date";

  if (label === label.toLowerCase()) {
    suffix = "date";
  } else if (label === label.toUpperCase()) {
    suffix = "DATE";
  }

  return `${label} ${suffix}`;
}

/** Capitalizes human names (accounting for things like hyphens and apostrophes)  */
const capitalizeName = (name: string) =>
  name.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());

export {
  appendDateSuffixIfMissing,
  capitalizeName,
  convertCurlyQuotesToStraight,
  decrypt,
  encrypt,
  formatCurrentAddress,
  formatDate,
  formatDateToISO,
  formatDaysToYearsMonthsPast,
  formatDistrictLabel,
  formatDollarAmount,
  formatDueDateFromToday,
  formatDurationFromDays,
  formatDurationFromOptionalDays,
  formatISODateString,
  formatLargeNumber,
  formatName,
  formatNameFirstLast,
  formatNameLastFirst,
  formatOfficerLabel,
  formatPercent,
  formatWorkflowsDate,
  formatWorkflowsDateString,
  formatWorkflowsDateWithTime,
  formatYearsMonthsFromNow,
  genderValueToHumanReadable,
  genderValueToLabel,
  generateEmailAddress,
  generateSerialListString,
  getDimensionLabel,
  getFirstName,
  getPeriodLabelFromMetricPeriodMonthsFilter,
  getSerialListSeparator,
  getStatePopulations,
  getStatePopulationsLabels,
  getTicks,
  getTrailingLabelFromMetricPeriodMonthsFilter,
  getWelcomeText,
  hashEmailAddress,
  htmlStringToString,
  humanReadableTitleCase,
  matrixViolationTypeToLabel,
  numberFromOfficerId,
  pluralize,
  pluralizeWord,
  raceValueToHumanReadable,
  raceValueToLabel,
  rangeString,
  safeToInt,
  splitAuth0UserName,
  toHtmlFriendly,
  toHumanReadable,
  toInt,
  toNumber,
  toPossessive,
  toTitleCase,
  violationCountLabel,
};

export const formatAsCurrency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
}).format;
