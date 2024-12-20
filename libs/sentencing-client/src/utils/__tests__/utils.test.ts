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
  convertDecimalToPercentage,
  displayReportType,
  formatListWithAnd,
  formatOffenseLabel,
  formatPossessiveName,
  formatWithArticle,
  pluralizeDuplicates,
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
