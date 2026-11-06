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

import { fromDbDate, toDbDate } from "../src/db/dates";

describe.each(["UTC", "America/Denver", "Pacific/Auckland"])(
  "with TZ=%s",
  (timeZone) => {
    beforeEach(() => {
      vi.stubEnv("TZ", timeZone);
    });

    test("the host time zone is in effect", () => {
      const offset = new Date("2026-09-30T00:00:00.000Z").getTimezoneOffset();
      expect(offset === 0).toBe(timeZone === "UTC");
    });

    test("toDbDate gives UTC midnight on the date", () => {
      expect(toDbDate("2026-09-30").toISOString()).toBe(
        "2026-09-30T00:00:00.000Z",
      );
    });

    test("fromDbDate reads back the stored date", () => {
      expect(fromDbDate(new Date("2026-09-30T00:00:00.000Z"))).toBe(
        "2026-09-30",
      );
    });

    test.each(["2026-09-30", "2026-01-01", "2026-12-31", "2028-02-29"])(
      "%s round-trips",
      (iso) => {
        expect(fromDbDate(toDbDate(iso))).toBe(iso);
      },
    );
  },
);

test.each(["2026-09-31", "2026-9-30", "2026-09-30T00:00:00Z", ""])(
  "toDbDate rejects %j",
  (value) => {
    expect(() => toDbDate(value)).toThrow(
      expect.objectContaining({ code: "INVALID_DATE" }),
    );
  },
);
