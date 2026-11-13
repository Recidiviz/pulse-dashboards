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

import { isMonthParam } from "../months";

describe("isMonthParam", () => {
  test.each(["2026-11", "2027-01", "2000-01", "5000-12"])(
    "accepts %s",
    (value) => {
      expect(isMonthParam(value)).toBe(true);
    },
  );

  test.each([
    "2026-13",
    "2026-00",
    "2026-1",
    "november",
    "2026-11-01",
    "",
    "1999-12",
    "5001-01",
  ])("rejects %s", (value) => {
    expect(isMonthParam(value)).toBe(false);
  });
});
