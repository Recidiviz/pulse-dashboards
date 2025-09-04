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

import { formatFullDate, formatISODatesInText } from "./date";

test("formatFullDate", () => {
  expect(formatFullDate(new Date(2024, 3, 24))).toBe("April 24, 2024");
});

test("formatISODatesInText", () => {
  expect(formatISODatesInText("Pending since 2025-01-14")).toBe(
    "Pending since January 14, 2025",
  );
  // invalid date-esque patterns are ignored
  expect(formatISODatesInText("4444-44-44")).toBe("4444-44-44");
});
