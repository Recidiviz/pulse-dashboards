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
import moment from "moment";
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
 * Formats the avg_pct_served value from BigQuery for display (rounds to 1 decimal).
 * e.g. avgPctServed=16.3 → "16.3"
 */
export function formatTimeServedPct(avgPctServed: number): string {
  return String(Math.round(avgPctServed * 10) / 10);
}

/**
 * Computes the average time served in years from a percentage and sentence length.
 * e.g. avgPctServed=16.3, avgSentenceLengthYears=8.6 → 1.4
 */
export function computeAvgTimeServedYears(
  avgPctServed: number,
  avgSentenceLengthYears: number,
): number {
  return Math.round((avgPctServed / 100) * avgSentenceLengthYears * 10) / 10;
}

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

/**
 * Formats a judge name from source-data format ("LAST, FIRST") to display
 * format ("First Last"). Falls back to title-casing the raw string if there
 * is no comma.
 */
export const formatJudgeName = (raw: string): string => {
  const commaIdx = raw.indexOf(",");
  if (commaIdx === -1) return titleCase(raw);
  const lastName = raw.slice(0, commaIdx).trim();
  const firstName = raw.slice(commaIdx + 1).trim();
  return `${titleCase(firstName)} ${titleCase(lastName)}`;
};

/** Capitalizes human names (accounting for things like hyphens and apostrophes)  */
export const capitalizeName = (name: string) =>
  name.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());

/**
 * Splits a full name into firstName and lastName.
 * Takes the first word as firstName and the last word as lastName,
 * capitalizing both.
 */
export const splitFullName = (
  fullName?: string | null,
): { firstName: string; lastName: string } => {
  const nameParts = fullName?.trim().split(/\s+/) || [];
  return {
    firstName: capitalizeName(nameParts[0] || ""),
    lastName: capitalizeName(nameParts[nameParts.length - 1] || ""),
  };
};

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

/**
 * Formats a boolean value for display as Yes/No/Unknown/Not specified
 */
export const formatBooleanDisplay = (
  value: boolean | null | undefined,
): string => {
  if (value === true) return "Yes";
  if (value === false) return "No";
  if (value === null) return "Unknown";
  return "Not specified";
};

/**
 * Formats a date range for display.
 * Returns "04/2023 - 11/2025" format, or "04/2023 - Present" if no end date.
 * Returns "Not specified" if no start date.
 * Uses UTC to avoid off-by-one timezone issues.
 */
export const formatDateRange = (
  startDate: Date | null | undefined,
  endDate: Date | null | undefined,
): string => {
  if (!startDate) return "Not specified";

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "2-digit",
      year: "numeric",
      timeZone: "UTC",
    });
  };

  const start = formatDate(startDate);
  const end = endDate ? formatDate(endDate) : "Present";

  return `${start} - ${end}`;
};

/**
 * Formats a charge's classification type and subtype into a display string.
 * e.g. classificationType="FELONY", classificationSubtype="A" → "FELONY - A"
 * e.g. classificationType="MISDEMEANOR", classificationSubtype=null → "MISDEMEANOR"
 */
export const formatClassification = (charge: {
  classificationType?: string | null;
  classificationSubtype?: string | null;
}): string | null => {
  if (!charge.classificationType) return null;
  return charge.classificationSubtype
    ? `${charge.classificationType} - ${charge.classificationSubtype}`
    : `${charge.classificationType}`;
};

/**
 * Formats the charge classification for inline display next to the offense name.
 * e.g. classificationType="FELONY", classificationSubtype="B" → " (Class B)"
 * e.g. classificationType="MISDEMEANOR", classificationSubtype=null → " (Misdemeanor)"
 */
export const formatInlineClassification = (charge: {
  classificationType?: string | null;
  classificationSubtype?: string | null;
}): string => {
  if (!charge.classificationType) return "";
  if (charge.classificationSubtype) {
    return ` (Class ${charge.classificationSubtype})`;
  }
  return ` (${titleCase(charge.classificationType)})`;
};

/**
 * Formats judge names and division into a combined display string.
 * e.g. judgeNames=["Smith, John"], division="4" → "Smith, John / 4"
 * e.g. judgeNames=["Smith, John"], division=null → "Smith, John"
 * e.g. judgeNames=null, division="4" → "4"
 */
export const formatJudgeAndDivision = (charge: {
  judgeNames?: string[] | null;
  division?: string | null;
}): string | null => {
  const judgeNames =
    charge.judgeNames && charge.judgeNames.length > 0
      ? charge.judgeNames.map(capitalizeName).join(", ")
      : null;
  if (judgeNames && charge.division) {
    return `${judgeNames} / ${charge.division}`;
  }
  return judgeNames || charge.division || null;
};

/**
 * Formats a date as "Month Day, Year" (e.g. "March 27, 2026").
 * Uses UTC to avoid off-by-one timezone issues.
 */
export const formatLongDate = (date: Date): string => {
  return date.toLocaleDateString("en-US", {
    timeZone: "UTC",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

// e.g. "Administered By: Officer Smith, March 27, 2026"
export const formatAssessmentNote = (
  administeredBy: string | null | undefined,
  formattedDate: string | null | undefined,
): string | undefined => {
  const parts = [
    administeredBy ? `Administered By: Officer ${administeredBy}` : null,
    formattedDate,
  ].filter((part): part is string => part != null);
  return parts.length > 0 ? parts.join(", ") : undefined;
};

// e.g. "04/2023"
export const formatMonthYear = (date: Date | string): string =>
  new Date(date).toLocaleDateString("en-US", {
    timeZone: "UTC",
    month: "2-digit",
    year: "numeric",
  });

/** Format a date for display as MM/DD/YYYY, returning a dash for empty values */
export const formatDisplayDate = (
  date: string | Date | null | undefined,
): string => {
  if (!date) return "—";
  return moment(date).format("MM/DD/YYYY");
};
