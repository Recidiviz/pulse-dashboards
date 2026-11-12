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

import { parseMonthSearch } from "../../src/services/monthsList";

describe("parseMonthSearch", () => {
  it.each([
    ["", {}],
    ["   ", {}],
    ["2026", { year: 2026 }],
    ["Oct", { month: 10 }],
    ["sept", { month: 9 }],
    ["JUNE", { month: 6 }],
    ["Jul", { month: 7 }],
    ["October 2026", { year: 2026, month: 10 }],
    ["2026 October", { year: 2026, month: 10 }],
    ["  oct ,  2026 ", { year: 2026, month: 10 }],
    ["10/2026", { year: 2026, month: 10 }],
    ["1/2027", { year: 2027, month: 1 }],
  ])("reads %j", (text, expected) => {
    expect(parseMonthSearch(text)).toEqual(expected);
  });

  it.each([
    "Ju",
    "Octember",
    "20",
    "13/2026",
    "0/2026",
    "October 26",
    "2026 2027",
    "Oct Nov",
    "October 2026 extra",
    "2026-10",
  ])("returns null for %j", (text) => {
    expect(parseMonthSearch(text)).toBeNull();
  });
});
