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

import {
  capitalizeName,
  convertDecimalToPercentage,
  displayReportType,
  formatListWithAnd,
  formatOffenseLabel,
  formatPercentage,
  formatPossessiveName,
  formatWithArticle,
  localDateFromUtcDate,
  localDateToUtcIsoDate,
  pluralizeDuplicates,
  titleCase,
  trimExtraSpaces,
} from "../utils";

test("convertDecimalToPercentage converts decimal to percentage number", () => {
  expect(convertDecimalToPercentage(0.25)).toBe(25);
  expect(convertDecimalToPercentage(0.987)).toBe(99);
  expect(convertDecimalToPercentage(0.001)).toBe(0);
});

test('displayReportType returns correct report type or "Unknown"', () => {
  expect(displayReportType("FileReview")).toBe("File Review");
  expect(displayReportType("FullPSI")).toBe("Full PSI");
  expect(displayReportType("FileReviewWithUpdatedLSIRScore")).toBe(
    "File Review + Updated LSI-R",
  );
  expect(displayReportType(null)).toBe("Unknown");
});

test("formatListWithAnd formats lists correctly", () => {
  expect(formatListWithAnd(["Case Management"], "needs")).toBe(
    "Case Management",
  );

  expect(
    formatListWithAnd(
      ["Case Management", "Family services", "Education"],
      "needs",
    ),
  ).toBe("Case Management, Family services and Education");

  expect(formatListWithAnd(["Case Management", "Education"], "needs")).toBe(
    "Case Management and Education",
  );

  expect(
    formatListWithAnd(
      ["Case Management", "Family services", "Education"],
      "no needs",
      true, // lowercase everything in the list
    ),
  ).toBe("case management, family services and education");

  expect(formatListWithAnd([], "no needs")).toBe("no needs");
});

test("trimExtraSpaces removes extra spaces correctly", () => {
  expect(trimExtraSpaces("  Hello   world  ")).toBe("Hello world");
  expect(trimExtraSpaces("  Text    with multiple    spaces   ")).toBe(
    "Text with multiple spaces",
  );
  expect(trimExtraSpaces("NoExtraSpaces")).toBe("NoExtraSpaces");
});

test("formatPossessiveName formats names to possessive correctly", () => {
  expect(formatPossessiveName("James")).toBe("James'");
  expect(formatPossessiveName("Chris")).toBe("Chris'");
  expect(formatPossessiveName("   Oliver   ")).toBe("Oliver's");
});

test("formatWithArticle adds correct article based on word", () => {
  expect(formatWithArticle("inpatient substance use treatment facility")).toBe(
    "an inpatient substance use treatment facility",
  );
  expect(formatWithArticle("mental health provider")).toBe(
    "a mental health provider",
  );
  expect(formatWithArticle("outpatient program")).toBe("an outpatient program");
});

test("pluralizeDuplicates formats duplicates and unique items correctly", () => {
  const pluralizedItems = pluralizeDuplicates([
    "mental health court",
    "veterans court",
    "felony drug court",
    "mental health court",
    "felony drug court",
    "inpatient substance use treatment facility",
  ]);
  expect(pluralizedItems).toEqual([
    "mental health courts",
    "a veterans court",
    "felony drug courts",
    "an inpatient substance use treatment facility",
  ]);
});

test("formatOffenseLabel", () => {
  expect(formatOffenseLabel("Violent offense")).toBe("Violent offenses");
  expect(formatOffenseLabel("Violent offenses")).toBe("Violent offenses");
  expect(formatOffenseLabel("BURGLARY")).toBe("BURGLARY offenses");
  expect(formatOffenseLabel("Violent offense, Sex offense")).toBe(
    "Violent offenses, Sex offenses",
  );
  expect(
    formatOffenseLabel("Nonviolent offenses, not sex- or drug-related"),
  ).toBe("Nonviolent offenses, not sex- or drug-related");
});

test("titleCase", () => {
  expect(titleCase("hello")).toBe("Hello");
  expect(titleCase("hello world")).toBe("Hello World");
  expect(titleCase("HELLO WORLD")).toBe("Hello World");
  expect(titleCase("hElLo WoRLd")).toBe("Hello World");
  expect(titleCase("")).toBe("");
  expect(titleCase("a b c")).toBe("A B C");
});

test("capitalizeName", () => {
  // Basic capitalization
  expect(capitalizeName("john")).toBe("John");
  expect(capitalizeName("JOHN")).toBe("John");
  expect(capitalizeName("jOhN")).toBe("John");
  expect(capitalizeName("john doe")).toBe("John Doe");

  // Hyphenated names
  expect(capitalizeName("mary-jane")).toBe("Mary-Jane");

  // Names with apostrophes
  expect(capitalizeName("o'connor")).toBe("O'Connor");

  // Names with hyphens and apostrophes
  expect(capitalizeName("john mary-jane o'connor")).toBe(
    "John Mary-Jane O'Connor",
  );

  // Special characters without letters
  expect(capitalizeName("1234")).toBe("1234");
  expect(capitalizeName("!@#$")).toBe("!@#$");
});

test("formatPercentage", () => {
  // Whole numbers
  expect(formatPercentage(50)).toBe("50%");
  expect(formatPercentage(100)).toBe("100%");

  // Rounding
  expect(formatPercentage(49.5)).toBe("50%");
  expect(formatPercentage(49.4)).toBe("49%");

  // Less than 1%
  expect(formatPercentage(0.5)).toBe("< 1%");
  expect(formatPercentage(0.01)).toBe("< 1%");

  // 0%
  expect(formatPercentage(0)).toBe("0%");

  // Negative numbers
  expect(formatPercentage(-5)).toBe("-5%");
});

test("localDateFromUtcDate returns a local Date with the same calendar day as the UTC date", () => {
  // UTC midnight for 2025-11-06 — would be Nov 5 in US timezones without the conversion
  const result = localDateFromUtcDate("2025-11-06");
  expect(result.getFullYear()).toBe(2025);
  expect(result.getMonth()).toBe(10); // 0-indexed
  expect(result.getDate()).toBe(6);

  // Also accepts a Date object
  const dateObj = new Date("2025-01-15T00:00:00.000Z");
  const result2 = localDateFromUtcDate(dateObj);
  expect(result2.getFullYear()).toBe(2025);
  expect(result2.getMonth()).toBe(0);
  expect(result2.getDate()).toBe(15);
});

test("localDateToUtcIsoDate converts a local picker Date to a UTC YYYY-MM-DD string", () => {
  // Local date Nov 6 → stored as "2025-11-06" (UTC midnight)
  const local = new Date(2025, 10, 6); // Nov 6 local
  expect(localDateToUtcIsoDate(local)).toBe("2025-11-06");

  const local2 = new Date(2025, 0, 15); // Jan 15 local
  expect(localDateToUtcIsoDate(local2)).toBe("2025-01-15");
});

test("localDateFromUtcDate and localDateToUtcIsoDate round-trip correctly", () => {
  const original = "2025-06-30";
  const localDate = localDateFromUtcDate(original);
  expect(localDateToUtcIsoDate(localDate)).toBe(original);
});
