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

import { resolveHasRouteAccess } from "../src/procedures";

describe("resolveHasRouteAccess", () => {
  it.each([
    ["no routes", undefined, false],
    ["an empty map", {}, false],
    ["the route set to false", { publicCalendar: false }, false],
    ["the route", { publicCalendar: true }, true],
    ["a prefixed key", { parole_publicCalendar: true }, true],
    ["a key with two prefixes", { a_b_publicCalendar: true }, true],
    [
      "a longer route that starts with it",
      { publicCalendarAdmin: true },
      false,
    ],
    ["the route followed by a suffix", { publicCalendar_x: true }, false],
    [
      "the route among unrelated routes",
      { workflows_tasks: true, publicCalendar: true, insights: false },
      true,
    ],
  ])("%s: %s", (_label, routes, expected) => {
    expect(resolveHasRouteAccess(routes, "publicCalendar")).toBe(expected);
  });
});
