// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

import { parseUsTnFormDate } from "../formDate";

describe("parseUsTnFormDate", () => {
  test.each([
    ["10/19/2026", "2026-10-19"],
    ["1/5/2026", "2026-01-05"],
    ["10/19/26", "2026-10-19"],
    ["10-19-2026", "2026-10-19"],
    ["10.19.2026", "2026-10-19"],
    ["10-19/2026", "2026-10-19"],
    ["2026-10-19", "2026-10-19"],
    [" 10/19/2026 ", "2026-10-19"],
    ["2/29/2028", "2028-02-29"],
  ])("normalizes %j to %s", (input, expected) => {
    expect(parseUsTnFormDate(input)).toBe(expected);
  });

  test.each([
    // Partially typed dates the form autosaves before the user finishes
    "10/",
    "10/19",
    "10/19/2",
    "10/19/202",
    // Dates that do not exist
    "11/31/2026",
    "2/29/2027",
    "13/01/2026",
    "0/19/2026",
    // Unsupported formats
    "10/19/20226",
    "Oct 19 2026",
    "",
    undefined,
  ])("rejects %j", (input) => {
    expect(parseUsTnFormDate(input)).toBeUndefined();
  });
});
