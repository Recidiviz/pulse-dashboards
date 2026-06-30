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

import { getEnabledStateCodes } from "./getEnabledStateCodes";

test("split state codes from env", () => {
  vi.stubEnv("ENABLED_STATE_DBS", "US_AR,US_AZ,US_TN");
  expect(getEnabledStateCodes()).toMatchInlineSnapshot(`
    [
      "US_AR",
      "US_AZ",
      "US_TN",
    ]
  `);
});

test("one state code", () => {
  vi.stubEnv("ENABLED_STATE_DBS", "US_AR");
  expect(getEnabledStateCodes()).toMatchInlineSnapshot(`
    [
      "US_AR",
    ]
  `);
});

test("no enabled states", () => {
  expect(getEnabledStateCodes).toThrowErrorMatchingInlineSnapshot(
    `[Error: No states specified in ENABLED_STATE_DBS]`,
  );
});
