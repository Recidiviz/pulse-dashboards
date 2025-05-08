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

import { stateCodeFromCurrentUrl } from "./stateCodeFromCurrentUrl";

test("no state code", () => {
  vi.stubGlobal("location", { pathname: "/" });
  expect(stateCodeFromCurrentUrl()).toBeUndefined();
});

test("valid state code", () => {
  vi.stubGlobal("location", { pathname: "/maine" });
  expect(stateCodeFromCurrentUrl()).toBe("US_ME");

  vi.stubGlobal("location", { pathname: "/maine/some-resident-id" });
  expect(stateCodeFromCurrentUrl()).toBe("US_ME");
});

test("invalid state code", () => {
  vi.stubGlobal("location", { pathname: "/oz" });
  expect(stateCodeFromCurrentUrl()).toBeUndefined();

  vi.stubGlobal("location", { pathname: "/oz/some-id" });
  expect(stateCodeFromCurrentUrl()).toBeUndefined();
});
