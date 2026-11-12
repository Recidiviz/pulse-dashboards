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

import { toDbDate } from "../../src/db/dates";
import {
  compareEntries,
  computeMonthCounts,
  entryLabel,
  toMonthSummary,
} from "../../src/services/helpers";

function entry(
  date: string,
  kindSortOrder: number,
  resourceSortOrder: number | null,
  slotKey: string,
) {
  return {
    date: toDbDate(date),
    slotKey,
    kind: { sortOrder: kindSortOrder },
    resource:
      resourceSortOrder === null ? null : { sortOrder: resourceSortOrder },
  };
}

describe("compareEntries", () => {
  it("orders by date, then kind sortOrder, then resource sortOrder", () => {
    const entries = [
      entry("2026-09-04", 3, null, "BOARD_MEETING"),
      entry("2026-09-04", 1, 20, "SESSION:SITE_B"),
      entry("2026-09-04", 2, null, "STAFF_MEETING"),
      entry("2026-09-04", 1, 10, "SESSION:SITE_A"),
      entry("2026-09-01", 2, null, "STAFF_MEETING"),
    ];

    expect(entries.sort(compareEntries).map((e) => e.slotKey)).toEqual([
      "STAFF_MEETING",
      "SESSION:SITE_A",
      "SESSION:SITE_B",
      "STAFF_MEETING",
      "BOARD_MEETING",
    ]);
  });

  it("breaks a resource sortOrder tie by slotKey", () => {
    const entries = [
      entry("2026-09-01", 1, 10, "SESSION:SITE_B"),
      entry("2026-09-01", 1, 10, "SESSION:SITE_A"),
    ];

    expect(entries.sort(compareEntries).map((e) => e.slotKey)).toEqual([
      "SESSION:SITE_A",
      "SESSION:SITE_B",
    ]);
  });
});

describe("computeMonthCounts", () => {
  const kinds = new Map([
    ["kind-counts", { countsTowardTotal: true }],
    ["kind-meeting", { countsTowardTotal: false }],
  ]);
  const counts = "kind-counts";
  const meeting = "kind-meeting";

  const cancelledAt = new Date("2026-08-30T12:00:00Z");

  it("counts entries and distinct dates whose kind counts toward the total", () => {
    expect(
      computeMonthCounts(
        [
          { date: toDbDate("2026-09-01"), cancelledAt: null, kindId: counts },
          { date: toDbDate("2026-09-01"), cancelledAt: null, kindId: counts },
          { date: toDbDate("2026-09-08"), cancelledAt: null, kindId: counts },
          { date: toDbDate("2026-09-04"), cancelledAt: null, kindId: meeting },
          { date: toDbDate("2026-09-11"), cancelledAt: null, kindId: meeting },
        ],
        kinds,
      ),
    ).toEqual({ entryDays: 2, entryCount: 3 });
  });

  it("leaves out cancelled entries, and a date whose only entry is cancelled", () => {
    expect(
      computeMonthCounts(
        [
          { date: toDbDate("2026-09-01"), cancelledAt: null, kindId: counts },
          { date: toDbDate("2026-09-01"), cancelledAt, kindId: counts },
          { date: toDbDate("2026-09-08"), cancelledAt, kindId: counts },
        ],
        kinds,
      ),
    ).toEqual({ entryDays: 1, entryCount: 1 });
  });

  it("is zero for a month with only meetings", () => {
    expect(
      computeMonthCounts(
        [{ date: toDbDate("2026-09-04"), cancelledAt: null, kindId: meeting }],
        kinds,
      ),
    ).toEqual({ entryDays: 0, entryCount: 0 });
  });
});

describe("entryLabel", () => {
  it("uses the resource's label, or the kind's when there's no resource", () => {
    expect(
      entryLabel({ kind: { label: "Session" }, resource: { label: "Site A" } }),
    ).toBe("Site A");
    expect(
      entryLabel({ kind: { label: "Staff meeting" }, resource: null }),
    ).toBe("Staff meeting");
  });
});

describe("toMonthSummary", () => {
  const updatedAt = new Date("2026-08-30T12:00:00Z");
  const row = {
    id: "month-1",
    calendarId: "calendar-1",
    year: 2026,
    month: 9,
    status: "DRAFT" as const,
    revision: 4,
    createdAt: new Date("2026-08-01T12:00:00Z"),
    createdByEmail: "editor-1@example.com",
    updatedAt,
    updatedByEmail: "editor-2@example.com",
  };

  it("maps the month row, with no latestPublication when there's no PUBLISHED event", () => {
    expect(toMonthSummary({ ...row, statusEvents: [] })).toEqual({
      id: "month-1",
      year: 2026,
      month: 9,
      status: "DRAFT",
      revision: 4,
      lastEditedAt: updatedAt,
      lastEditedByEmail: "editor-2@example.com",
      latestPublication: null,
    });
  });

  it("reads latestPublication from the PUBLISHED event's createdAt and actorEmail", () => {
    const publishedAt = new Date("2026-08-20T15:00:00Z");

    expect(
      toMonthSummary({
        ...row,
        statusEvents: [
          { createdAt: publishedAt, actorEmail: "publisher-1@example.com" },
        ],
      }).latestPublication,
    ).toEqual({ publishedAt, publishedByEmail: "publisher-1@example.com" });
  });
});
