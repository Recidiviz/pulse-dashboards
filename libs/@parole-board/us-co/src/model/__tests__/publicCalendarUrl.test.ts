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

import { publicMonthUrl } from "../publicCalendarUrl";

const BASE = "https://public-calendar.test";

describe("publicMonthUrl", () => {
  it("puts the month on the public calendar's address as YYYY-MM", () => {
    expect(publicMonthUrl(BASE, { year: 2026, month: 9 })).toBe(
      "https://public-calendar.test/2026-09",
    );
  });

  it("keeps two-digit months as they are", () => {
    expect(publicMonthUrl(BASE, { year: 2027, month: 12 })).toBe(
      "https://public-calendar.test/2027-12",
    );
  });

  it("takes the address with a trailing slash", () => {
    expect(publicMonthUrl(`${BASE}/`, { year: 2026, month: 9 })).toBe(
      "https://public-calendar.test/2026-09",
    );
  });

  test.each([
    ["no address", undefined],
    ["an empty address", ""],
    ["an address that isn't a URL", "public-calendar.test"],
    ["an http:// address", "http://public-calendar.test"],
    ["an address with a path", "https://public-calendar.test/calendar"],
    ["an address with a query", "https://public-calendar.test/?month=1"],
    ["an address with a hash", "https://public-calendar.test/#top"],
    ["an address with credentials", "https://user:pass@public-calendar.test"],
  ])("gives null for %s", (_, address) => {
    expect(publicMonthUrl(address, { year: 2026, month: 9 })).toBeNull();
  });
});
