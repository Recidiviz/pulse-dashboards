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

import {
  digitsOnly,
  formatMmDdYyyy,
  formatPhone,
  normalizeUsPhoneNumber,
} from "../inputFormatters";

test("digitsOnly strips non-digits", () => {
  expect(digitsOnly("(208) 555-0111")).toBe("2085550111");
});

test("normalizeUsPhoneNumber formats a valid 10-digit number (and strips leading 1)", () => {
  expect(normalizeUsPhoneNumber("1 (208) 555-0111")).toBe("208-555-0111");
  expect(normalizeUsPhoneNumber("2085550111")).toBe("208-555-0111");
  expect(normalizeUsPhoneNumber("208-555-0111")).toBe("208-555-0111");
});

test("normalizeUsPhoneNumber returns digits unchanged when not 10 digits", () => {
  expect(normalizeUsPhoneNumber("123")).toBe("123");
});

test("formatPhone preserves a trailing dash while typing", () => {
  expect(formatPhone("208-")).toBe("208-");
});

test("formatPhone builds XXX-XXX-XXXX as digits are entered", () => {
  expect(formatPhone("208")).toBe("208");
  expect(formatPhone("208555")).toBe("208-555");
  expect(formatPhone("2085551234")).toBe("208-555-1234");
  expect(formatPhone("(208) 555-1234")).toBe("(208) 555-1234");
});

test("formatMmDdYyyy formats MMDDYYYY and partial MMDD", () => {
  expect(formatMmDdYyyy("01012006")).toBe("01/01/2006");
  expect(formatMmDdYyyy("0101")).toBe("01/01");
});
