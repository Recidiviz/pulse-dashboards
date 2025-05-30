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

import { startCase } from "lodash";
import Pluralize from "pluralize";

import {
  OFFENSE_SUFFIX,
  OFFENSES_SUFFIX,
} from "../components/CaseDetails/constants";
import { ReportType } from "../components/constants";

/**
 * Converts a decimal number to a percentage
 */
export const convertDecimalToPercentage = (decimal: number) => {
  return Math.round(decimal * 100);
};

/**
 * Displays the human-readable format of a report type.
 * If the `reportType` is `null` or `undefined`, returns "Unknown"
 */
export const displayReportType = (
  reportType?: keyof typeof ReportType | null,
) => {
  return reportType ? ReportType[reportType] : "Unknown";
};

/**
 * Formats a list of items with commas and "and" for the final item and optionally converts all items to lowercase
 */
export const formatListWithAnd = (
  items: string[] | undefined,
  emptyListText: string,
  lowercase?: boolean,
): string | undefined => {
  if (!items) return;

  const formattedItems = lowercase
    ? items?.map((item: string) => item.toLocaleLowerCase())
    : items;
  if (formattedItems.length === 0) {
    return emptyListText;
  }
  if (formattedItems.length === 1) {
    return formattedItems[0];
  }
  if (formattedItems.length === 2) {
    return `${formattedItems[0]} and ${formattedItems[1]}`;
  }

  const lastItem = formattedItems[formattedItems.length - 1];
  const firstItems = formattedItems.slice(0, -1).join(", ");

  return `${firstItems} and ${lastItem}`;
};

/**
 * Trims extra spaces from a string, replacing multiple spaces with a single space, and removes leading and trailing spaces (excludes newlines)
 */
export const trimExtraSpaces = (str: string) => {
  return str.replace(/ {2,}/g, " ").trim();
};

/**
 * Formats a name to its possessive form by adding an apostrophe (') or ('s) based on whether a given name ends with 's'
 */
export const formatPossessiveName = (name?: string) => {
  if (!name) return;
  const trimmedName = name.trim();
  return trimmedName.endsWith("s") ? `${trimmedName}'` : `${trimmedName}'s`;
};

/**
 * Formats a word with the appropriate article ("a" or "an") based on its initial letter
 */
export const formatWithArticle = (word: string) => {
  const firstLetter = word[0].toLowerCase();
  const article = ["a", "e", "i", "o", "u"].includes(firstLetter) ? "an" : "a";
  return `${article} ${word}`;
};

/**
 * Pluralizes duplicate items in a list and ensures each item appears only once, and
 * uses `formatWithArticle` for unique items.
 */
export const pluralizeDuplicates = (items: string[]) => {
  const counts = items.reduce(
    (acc, item) => {
      acc[item] = (acc[item] || 0) + 1;
      return acc;
    },
    {} as { [key: string]: number },
  );
  const formattedItems = items.map((item) =>
    counts[item] > 1 ? Pluralize(item) : formatWithArticle(item),
  );
  const uniqueItems = new Set(formattedItems);

  return Array.from(uniqueItems);
};

/**
 * Deduplicates and pluralizes each item in a list
 */
export const deduplicateAndPluralize = (items?: string[]) => {
  if (!items) return [];
  const formattedItems = items.map((item) => Pluralize(item));
  const uniqueItems = new Set(formattedItems);

  return Array.from(uniqueItems);
};

/**
 * Converts a county name (e.g. "District 3 - Caldwell") to the district code (e.g. "D3")
 */
export const convertCountyToDistrictCode = (county?: string) => {
  const match = county?.match(/District (\d+)/);
  return match ? `D${match[1]}` : null;
};

/**
 * Converts a district name (e.g. "DISTRICT 4") to the district code (e.g. "D4")
 */
export const convertDistrictToDistrictCode = (district?: string | null) => {
  const match = district?.match(/district (\d+)/i);
  return match ? `D${match[1]}` : null;
};

/** Displays `record` for 1 record or `records` for 0 or more than 1 records */
export const printFormattedRecordString = (numberOfRecords: number) => {
  return numberOfRecords === 1 ? `record` : `records`;
};

/** Ensures the offense string includes the word "offenses", and appends it if it does not. */
export const formatOffenseLabel = (offense: string) => {
  if (offense.toLocaleLowerCase().includes(OFFENSES_SUFFIX)) {
    return offense;
  }

  return offense.toLocaleLowerCase().includes(OFFENSE_SUFFIX)
    ? offense.replaceAll(OFFENSE_SUFFIX, OFFENSES_SUFFIX)
    : `${offense} ${OFFENSES_SUFFIX}`;
};

/** Converts a string to title case */
export const titleCase = (str?: string | null) => {
  if (!str) return "";
  return startCase(str.toLocaleLowerCase());
};

/** Capitalizes human names (accounting for things like hyphens and apostrophes)  */
export const capitalizeName = (name: string) =>
  name.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());

/**
 * Rounds a percentage rate to a whole number.
 * If the percentage is greater than 0 and less than 1, returns "< 1%".
 */
export const formatPercentage = (rate?: number): string | undefined => {
  if (rate === undefined) return;
  if (rate > 0 && rate < 1) {
    return "< 1%";
  }
  return `${Math.round(rate)}%`;
};
