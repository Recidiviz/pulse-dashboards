// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { extractHeadingIds } from "./markdownHeadingUtils";

describe("markdownHeadingUtils", () => {
  describe("extractHeadingIds", () => {
    it("should maintain the exact heading order that presenter depends on (critical for index references)", () => {
      // UsAzImportantDatesPresenter uses these specific indices - if the markdown order changes,
      // these tests will fail and alert us that the keyToHeadingIndex mapping needs to be updated
      // Mock markdown with the expected heading structure
      const mockInfoPageMarkdown = `
# Release Types

## Transition Program Releases

## Standard Transition Program

## Drug Transition Program (DTP)

## Community Supervision Begin Date (CSBD) / Temporary Release to Absolute Discharge Date (TR to ADD)

## Earned Release Credit Date (ERCD) / Absolute Discharge Date (ADD)

## Sentence Expiration Date (SED; 100% date)

## Community Supervision End Date (CSED; 115% date)
`;
      const headingIds = extractHeadingIds(mockInfoPageMarkdown);

      expect(headingIds[1]).toBe("standard-transition-program"); // acisTprDate
      expect(headingIds[2]).toBe("drug-transition-program-dtp"); // acisDtpDate
      expect(headingIds[3]).toBe(
        "community-supervision-begin-date-csbd--temporary-release-to-absolute-discharge-date-tr-to-add",
      ); // csbdDate, trToAddDate
      expect(headingIds[4]).toBe(
        "earned-release-credit-date-ercd--absolute-discharge-date-add",
      ); // ercdDate, addDate
      expect(headingIds[5]).toBe("sentence-expiration-date-sed-100-date"); // sedDate
      expect(headingIds[6]).toBe(
        "community-supervision-end-date-csed-115-date",
      ); // csedDate
    });
  });

  it("should handle empty markdown gracefully", () => {
    const headingIds = extractHeadingIds("");

    expect(headingIds).toEqual([]);
  });

  it("should handle markdown with no h2 headings", () => {
    const markdownWithoutH2 = "# H1 Only\n\nSome content.\n\n### H3 Only";
    const headingIds = extractHeadingIds(markdownWithoutH2);

    expect(headingIds).toEqual([]);
  });
});
