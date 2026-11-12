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

import { holidayBlockedError } from "../../src/calendar.errors";
import { toDbDate } from "../../src/db/dates";
import { findHolidayEntries } from "../../src/services/monthStatus";

describe("findHolidayEntries", () => {
  const session = { code: "SESSION", label: "Session" };
  const meeting = { code: "ALL_HANDS", label: "All hands" };

  it("returns the entries on holidays, in the order given, labelled by site or kind", () => {
    const holidays = new Map([
      ["2026-11-11", "Veterans Day"],
      ["2026-11-26", "Thanksgiving Day"],
    ]);

    const result = findHolidayEntries(
      [
        {
          id: "e1",
          date: toDbDate("2026-11-11"),
          cancelledAt: null,
          kind: session,
          resource: { label: "Site A" },
        },
        {
          id: "e2",
          date: toDbDate("2026-11-12"),
          cancelledAt: null,
          kind: session,
          resource: { label: "Site A" },
        },
        {
          id: "e3",
          date: toDbDate("2026-11-26"),
          cancelledAt: null,
          kind: meeting,
          resource: null,
        },
      ],
      holidays,
    );

    expect(result).toEqual([
      {
        entryId: "e1",
        date: "2026-11-11",
        label: "Site A",
        kind: "SESSION",
        holidayName: "Veterans Day",
      },
      {
        entryId: "e3",
        date: "2026-11-26",
        label: "All hands",
        kind: "ALL_HANDS",
        holidayName: "Thanksgiving Day",
      },
    ]);
  });
});

describe("holidayBlockedError", () => {
  const entry = (label: string) => ({
    label,
    date: "2026-09-07",
    holidayName: "Labor Day",
  });

  it("names every entry when there are five or fewer", () => {
    const error = holidayBlockedError(2026, 9, [
      entry("Site A"),
      entry("Site B"),
    ]);

    expect(error).toMatchObject({
      code: "PRECONDITION_FAILED",
      message:
        "September 2026 has entries on holidays. Move or delete them before publishing: Site A on September 7 (Labor Day), Site B on September 7 (Labor Day).",
    });
  });

  it("names the first five and counts the rest", () => {
    const labels = ["A", "B", "C", "D", "E", "F", "G"].map((x) => `Site ${x}`);

    const error = holidayBlockedError(2026, 9, labels.map(entry));

    expect(error.message).toBe(
      "September 2026 has entries on holidays. Move or delete them before publishing: " +
        "Site A on September 7 (Labor Day), Site B on September 7 (Labor Day), " +
        "Site C on September 7 (Labor Day), Site D on September 7 (Labor Day), " +
        "Site E on September 7 (Labor Day), and 2 more.",
    );
  });
});
