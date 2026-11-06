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

import { formatMonthLabel } from "../src/calendar.errors";

describe("formatMonthLabel", () => {
  // In Denver, a Date built at UTC midnight would fall on the last day of the
  // month before.
  it.each(["UTC", "America/Denver"])(
    "gives the same month in %s",
    (timeZone) => {
      vi.stubEnv("TZ", timeZone);

      expect(formatMonthLabel(2026, 10)).toBe("October 2026");
      expect(formatMonthLabel(2027, 1)).toBe("January 2027");
      expect(formatMonthLabel(2026, 12)).toBe("December 2026");
    },
  );
});
