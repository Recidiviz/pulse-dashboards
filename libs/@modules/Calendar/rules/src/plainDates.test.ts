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

import { TIME_PATTERN } from "./plainDates";

describe("TIME_PATTERN", () => {
  it.each(["00:00", "09:30", "23:59"])("accepts %s", (time) => {
    expect(TIME_PATTERN.test(time)).toBe(true);
  });

  it.each(["9:30", "24:00", "12:60", "09:30:00", ""])("rejects %j", (time) => {
    expect(TIME_PATTERN.test(time)).toBe(false);
  });
});
