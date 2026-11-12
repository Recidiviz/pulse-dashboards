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
  assertPublicMonth,
  buildPublicDays,
  PublicDayEntry,
  publicMonthSchema,
} from "../../src/services/publicDays";
import type { PublicMonth } from "../../src/types";

// Synthetic kinds and sites, shaped like a real calendar's: SESSION needs a
// site, the two meeting kinds take none, and STAFF_MEETING isn't public.
const session = {
  code: "SESSION",
  label: "Session",
  sortOrder: 1,
  isPublic: true,
};
const fullMeeting = {
  code: "FULL_MEETING",
  label: "Full meeting",
  sortOrder: 2,
  isPublic: true,
};
const planning = {
  code: "PLANNING",
  label: "Planning mtg",
  sortOrder: 3,
  isPublic: true,
};
const staffMeeting = {
  code: "STAFF_MEETING",
  label: "Staff meeting",
  sortOrder: 4,
  isPublic: false,
};
const siteA = { label: "Site A", sortOrder: 10 };
const siteB = { label: "Site B", sortOrder: 20 };

function entry(
  date: string,
  kind: PublicDayEntry["kind"],
  resource: PublicDayEntry["resource"] = null,
  cancelledAt: Date | null = null,
): PublicDayEntry {
  return {
    date: toDbDate(date),
    slotKey: resource ? `${kind.code}:${resource.label}` : kind.code,
    cancelledAt,
    kind,
    resource,
  };
}

function build(overrides: Partial<Parameters<typeof buildPublicDays>[0]> = {}) {
  return buildPublicDays({
    year: 2026,
    month: 9,
    entries: [],
    holidays: new Map([["2026-09-07", "Labor Day"]]),
    ...overrides,
  });
}

function day(days: ReturnType<typeof build>, date: string) {
  return days.find((d) => d.date === date);
}

describe("buildPublicDays", () => {
  it("has one day per date of the month, in order, with empty entries on empty days", () => {
    const days = build();

    expect(days.map((d) => d.date)).toEqual(
      Array.from(
        { length: 30 },
        (_, i) => `2026-09-${String(i + 1).padStart(2, "0")}`,
      ),
    );
    expect(day(days, "2026-09-13")).toEqual({
      date: "2026-09-13",
      holidayName: null,
      entries: [],
    });
  });

  it("covers February in a leap year", () => {
    const days = build({ year: 2028, month: 2, holidays: new Map() });

    expect(days).toHaveLength(29);
    expect(days.at(-1)?.date).toBe("2028-02-29");
  });

  it("names each day's holiday", () => {
    const days = build({ entries: [entry("2026-09-07", session, siteA)] });

    expect(day(days, "2026-09-07")).toEqual({
      date: "2026-09-07",
      holidayName: "Labor Day",
      entries: [{ label: "Site A", kind: "SESSION", cancelled: false }],
    });
    expect(day(days, "2026-09-08")?.holidayName).toBeNull();
  });

  it("leaves out entries whose kind isn't public", () => {
    const days = build({
      entries: [
        entry("2026-09-18", staffMeeting),
        entry("2026-09-18", fullMeeting),
      ],
    });

    expect(day(days, "2026-09-18")?.entries).toEqual([
      { label: "Full meeting", kind: "FULL_MEETING", cancelled: false },
    ]);
    expect(JSON.stringify(days)).not.toContain("STAFF_MEETING");
  });

  it("sorts by kind, then site, labels by site or kind, and marks cancelled entries", () => {
    const days = build({
      entries: [
        entry("2026-09-18", planning, null, new Date("2026-09-10T16:00:00Z")),
        entry("2026-09-18", session, siteB),
        entry("2026-09-18", fullMeeting),
        entry("2026-09-18", session, siteA),
      ],
    });

    expect(day(days, "2026-09-18")?.entries).toEqual([
      { label: "Site A", kind: "SESSION", cancelled: false },
      { label: "Site B", kind: "SESSION", cancelled: false },
      { label: "Full meeting", kind: "FULL_MEETING", cancelled: false },
      { label: "Planning mtg", kind: "PLANNING", cancelled: true },
    ]);
  });

  it("copies only allowlisted keys, even when the rows carry ids, emails and times", () => {
    // A full database row, as the public read loads it. It isn't a literal at
    // the call, so TypeScript accepts the extra columns.
    const row = {
      ...entry("2026-09-14", session, siteA),
      id: "entry-id-1",
      monthId: "month-id-1",
      startTime: "08:00",
      endTime: "12:00",
      source: "MANUAL",
      version: 3,
      createdByEmail: "editor-1@example.com",
      updatedByEmail: "editor-2@example.com",
      cancelledByEmail: null,
      kind: { ...session, id: "kind-id-1", calendarId: "calendar-id-1" },
      resource: { ...siteA, id: "resource-id-1", code: "SITE_A" },
    };

    const days = build({ entries: [row] });

    const allowed = new Set([
      "date",
      "holidayName",
      "entries",
      "label",
      "kind",
      "cancelled",
    ]);
    const keys = new Set<string>();
    JSON.parse(JSON.stringify(days), (key, value) => {
      if (key !== "" && Number.isNaN(Number(key))) keys.add(key);
      return value;
    });
    expect([...keys].filter((key) => !allowed.has(key))).toEqual([]);

    const json = JSON.stringify(days);
    for (const secret of [
      "entry-id-1",
      "month-id-1",
      "kind-id-1",
      "calendar-id-1",
      "resource-id-1",
      "editor-1@example.com",
      "editor-2@example.com",
      "08:00",
      "12:00",
      "MANUAL",
    ]) {
      expect(json).not.toContain(secret);
    }
  });
});

describe("publicMonthSchema and assertPublicMonth", () => {
  const valid: PublicMonth = {
    month: "2026-09",
    title: "September 2026",
    days: [
      {
        date: "2026-09-07",
        holidayName: "Labor Day",
        entries: [{ label: "Site A", kind: "SESSION", cancelled: false }],
      },
    ],
    previous: null,
    next: "2026-10",
    notPublishedYet: null,
  };

  it("accepts a public month", () => {
    expect(() => assertPublicMonth(valid)).not.toThrow();
  });

  it("rejects an extra key at every level", () => {
    expect(
      publicMonthSchema.safeParse({ ...valid, publishedByEmail: "x" }).success,
    ).toBe(false);
    expect(
      publicMonthSchema.safeParse({
        ...valid,
        days: [{ ...valid.days[0], id: "day-1" }],
      }).success,
    ).toBe(false);
    expect(
      publicMonthSchema.safeParse({
        ...valid,
        days: [
          {
            ...valid.days[0],
            entries: [{ ...valid.days[0].entries[0], startTime: "08:00" }],
          },
        ],
      }).success,
    ).toBe(false);
  });

  it("fails the read with INTERNAL_SERVER_ERROR for a month with an extra key", () => {
    // Not a literal at the call, so TypeScript accepts the extra field.
    const leaky = { ...valid, monthId: "month-id-1" };

    expect(() => assertPublicMonth(leaky)).toThrow(
      expect.objectContaining({
        code: "INTERNAL_SERVER_ERROR",
        message: "A published month is invalid",
      }),
    );
  });
});
