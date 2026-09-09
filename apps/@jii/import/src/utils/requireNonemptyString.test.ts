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

import { requireNonemptyString } from "./requireNonemptyString";

test("returns a nonempty string as-is", () => {
  expect(requireNonemptyString("abc123")).toBe("abc123");
});

test.each([
  ["empty string", ""],
  ["number", 42],
  ["boolean", true],
  ["null", null],
  ["undefined", undefined],
  ["object", { id: "abc123" }],
  ["array", ["abc123"]],
])("throws for %s", (_label, input) => {
  expect(() => requireNonemptyString(input)).toThrow();
});
