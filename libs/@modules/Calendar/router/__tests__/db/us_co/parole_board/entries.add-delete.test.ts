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

import type { TRPCClient } from "@trpc/client";

import { fromDbDate, toDbDate } from "../../../../src/db/dates";
import type { UsCoKindCode } from "../../../../src/us_co/parole_board";
import { testPrismaClient } from "../../../setup";
import { AUDIT_EMAIL, OTHER_CALENDAR_CODE } from "../../../setup/fixtures";
import {
  seedCalendarConfig,
  SeededCalendar,
} from "../../../setup/seedCalendarConfig";
import { coEditor, idUser } from "../../../setup/users";
import {
  initUsCoClient,
  US_CO_TEST_CONFIG,
  type usCoTestRouter,
} from "../../../us_co/parole_board/setup";

// Synthetic rows in Colorado's shape: HEARING needs a site, and FULL_BOARD
// and BUSINESS_MEETING take none.
const calendarCode = "PAROLE_BOARD_PUBLIC";
const audit = { createdByEmail: AUDIT_EMAIL, updatedByEmail: AUDIT_EMAIL };
/** coEditor's email, lowercased as the procedures store it. */
const EDITOR_EMAIL = "co.editor@example.com";

async function calendarId(code = calendarCode): Promise<string> {
  const calendar = await testPrismaClient.calendar.findUniqueOrThrow({
    where: { code },
  });
  return calendar.id;
}

function createMonth(
  id: string,
  year: number,
  month: number,
  status: "DRAFT" | "PUBLISHED" = "DRAFT",
) {
  return testPrismaClient.calendarMonth.create({
    data: { calendarId: id, year, month, status, revision: 3, ...audit },
  });
}

function createEntry(
  seeded: SeededCalendar,
  monthId: string,
  date: string,
  kindCode: string,
  resourceCode: string | null,
) {
  return testPrismaClient.calendarEntry.create({
    data: {
      calendarId: seeded.kinds[kindCode].calendarId,
      monthId,
      date: toDbDate(date),
      kindId: seeded.kinds[kindCode].id,
      resourceId: resourceCode ? seeded.resources[resourceCode].id : null,
      slotKey: resourceCode ? `${kindCode}:${resourceCode}` : kindCode,
      source: "PATTERN",
      ...audit,
    },
  });
}

function readMonth(id: string) {
  return testPrismaClient.calendarMonth.findUniqueOrThrow({ where: { id } });
}

function entryDates(monthId: string) {
  return testPrismaClient.calendarEntry
    .findMany({
      where: { monthId },
      orderBy: [{ date: "asc" }, { slotKey: "asc" }],
    })
    .then((rows) =>
      rows.map((row) => `${fromDbDate(row.date)} ${row.slotKey}`),
    );
}

let id: string;
let seeded: SeededCalendar;
let draft: Awaited<ReturnType<typeof createMonth>>;
let published: Awaited<ReturnType<typeof createMonth>>;
let existing: Awaited<ReturnType<typeof createEntry>>;

beforeEach(async () => {
  id = await calendarId();
  seeded = await seedCalendarConfig(testPrismaClient, id, US_CO_TEST_CONFIG);
  draft = await createMonth(id, 2026, 9);
  published = await createMonth(id, 2026, 8, "PUBLISHED");
  existing = await createEntry(
    seeded,
    draft.id,
    "2026-09-14",
    "HEARING",
    "SITE_A",
  );
});

describe("Calendar.usCo.paroleBoard.admin.entries.add", () => {
  function add(
    client: TRPCClient<typeof usCoTestRouter>,
    fields: {
      monthId?: string;
      date: string;
      kindCode: UsCoKindCode;
      resourceId: string | null;
    },
  ) {
    return client.Calendar.usCo.paroleBoard.admin.entries.add.mutate({
      monthId: draft.id,
      ...fields,
    });
  }

  it("adds a MANUAL version 1 entry with the pattern's times and the caller's email", async () => {
    const client = await initUsCoClient(coEditor);

    const { entry, monthRevision } = await add(client, {
      date: "2026-09-21",
      kindCode: "HEARING",
      resourceId: seeded.resources["SITE_A"].id,
    });

    expect(entry).toMatchObject({
      date: "2026-09-21",
      kind: { code: "HEARING", label: "Hearing" },
      label: "Site A",
      resource: { code: "SITE_A", label: "Site A", typeCode: "SITE" },
      slotKey: "HEARING:SITE_A",
      startTime: "08:00",
      endTime: null,
      source: "MANUAL",
      cancelled: false,
      holidayName: null,
      version: 1,
      updatedByEmail: EDITOR_EMAIL,
    });
    const row = await testPrismaClient.calendarEntry.findUniqueOrThrow({
      where: { id: entry.id },
    });
    expect(row).toMatchObject({
      monthId: draft.id,
      source: "MANUAL",
      version: 1,
      cancelledAt: null,
      createdByEmail: EDITOR_EMAIL,
      updatedByEmail: EDITOR_EMAIL,
    });
    expect(monthRevision).toBe(4);
    expect(await readMonth(draft.id)).toMatchObject({
      revision: 4,
      updatedByEmail: EDITOR_EMAIL,
    });
  });

  it("returns the month after the add, with the new entry in it", async () => {
    const client = await initUsCoClient(coEditor);

    const { entry, month } = await add(client, {
      date: "2026-09-21",
      kindCode: "HEARING",
      resourceId: seeded.resources["SITE_A"].id,
    });

    expect(month).toMatchObject({
      id: draft.id,
      year: 2026,
      month: 9,
      status: "DRAFT",
      revision: 4,
      lastEditedByEmail: EDITOR_EMAIL,
      counts: { entryDays: 2, entryCount: 2 },
    });
    expect(month.entries).toEqual([
      expect.objectContaining({ id: existing.id, date: "2026-09-14" }),
      entry,
    ]);
  });

  it("adds a kind with no resource with a null resource and the kind's slotKey", async () => {
    const client = await initUsCoClient(coEditor);

    const { entry } = await add(client, {
      date: "2026-09-04",
      kindCode: "FULL_BOARD",
      resourceId: null,
    });

    expect(entry).toMatchObject({
      resource: null,
      label: "Full Board",
      slotKey: "FULL_BOARD",
    });
  });

  it("leaves the times null when the slot has no pattern", async () => {
    await testPrismaClient.calendarEntryPattern.deleteMany({
      where: { calendarId: id, slotKey: "HEARING:SITE_B" },
    });
    const client = await initUsCoClient(coEditor);

    const { entry } = await add(client, {
      date: "2026-09-08",
      kindCode: "HEARING",
      resourceId: seeded.resources["SITE_B"].id,
    });

    expect(entry).toMatchObject({ startTime: null, endTime: null });
  });

  it.each([
    [
      "a SESSION with no resource",
      "HEARING",
      null,
      "Pick a location for Hearing.",
    ],
    [
      "a FULL_BOARD with a resource",
      "FULL_BOARD",
      "SITE_A",
      "Full Board doesn't take a location.",
    ],
  ])(
    "is BAD_REQUEST for %s",
    async (_label, kindCode, resourceCode, message) => {
      const client = await initUsCoClient(coEditor);

      await expect(
        add(client, {
          date: "2026-09-04",
          kindCode: kindCode as UsCoKindCode,
          resourceId: resourceCode ? seeded.resources[resourceCode].id : null,
        }),
      ).rejects.toMatchObject({ message, data: { code: "BAD_REQUEST" } });
      expect((await readMonth(draft.id)).revision).toBe(3);
    },
  );

  it("is BAD_REQUEST for a date in another month", async () => {
    const client = await initUsCoClient(coEditor);

    await expect(
      add(client, {
        date: "2026-10-01",
        kindCode: "FULL_BOARD",
        resourceId: null,
      }),
    ).rejects.toMatchObject({
      message: "Pick a day in September 2026.",
      data: { code: "BAD_REQUEST" },
    });
  });

  it("is BAD_REQUEST on a weekend, which Colorado doesn't allow, and writes nothing", async () => {
    const client = await initUsCoClient(coEditor);

    await expect(
      add(client, {
        date: "2026-09-12",
        kindCode: "HEARING",
        resourceId: seeded.resources["SITE_A"].id,
      }),
    ).rejects.toMatchObject({
      message: "This calendar has no entries on Saturdays. Pick another day.",
      data: { code: "BAD_REQUEST" },
    });
    expect((await readMonth(draft.id)).revision).toBe(3);
    expect(await entryDates(draft.id)).toEqual(["2026-09-14 HEARING:SITE_A"]);

    // Friday is still open.
    await expect(
      add(client, {
        date: "2026-09-11",
        kindCode: "HEARING",
        resourceId: seeded.resources["SITE_A"].id,
      }),
    ).resolves.toMatchObject({ entry: { date: "2026-09-11" } });
  });

  it("is BAD_REQUEST for a date that doesn't exist", async () => {
    const client = await initUsCoClient(coEditor);

    await expect(
      add(client, {
        date: "2026-02-30",
        kindCode: "FULL_BOARD",
        resourceId: null,
      }),
    ).rejects.toMatchObject({ data: { code: "BAD_REQUEST" } });
  });

  it("is CONFLICT for an exact duplicate and doesn't bump the revision", async () => {
    const client = await initUsCoClient(coEditor);

    await expect(
      add(client, {
        date: "2026-09-14",
        kindCode: "HEARING",
        resourceId: seeded.resources["SITE_A"].id,
      }),
    ).rejects.toMatchObject({
      message: "Site A is already on September 14.",
      data: { code: "CONFLICT" },
    });
    expect((await readMonth(draft.id)).revision).toBe(3);
  });

  it("is CONFLICT for a second entry of a kind with no resource on one day", async () => {
    await createEntry(seeded, draft.id, "2026-09-04", "FULL_BOARD", null);
    const client = await initUsCoClient(coEditor);

    await expect(
      add(client, {
        date: "2026-09-04",
        kindCode: "FULL_BOARD",
        resourceId: null,
      }),
    ).rejects.toMatchObject({
      message: "Full Board is already on September 4.",
      data: { code: "CONFLICT" },
    });
  });

  it("adds the same site on another day and another site on the same day", async () => {
    const client = await initUsCoClient(coEditor);

    await add(client, {
      date: "2026-09-15",
      kindCode: "HEARING",
      resourceId: seeded.resources["SITE_A"].id,
    });
    const { monthRevision } = await add(client, {
      date: "2026-09-14",
      kindCode: "HEARING",
      resourceId: seeded.resources["SITE_B"].id,
    });

    expect(monthRevision).toBe(5);
    expect(await entryDates(draft.id)).toEqual([
      "2026-09-14 HEARING:SITE_A",
      "2026-09-14 HEARING:SITE_B",
      "2026-09-15 HEARING:SITE_A",
    ]);
  });

  it("is PRECONDITION_FAILED on a published month and writes nothing", async () => {
    const client = await initUsCoClient(coEditor);

    await expect(
      add(client, {
        monthId: published.id,
        date: "2026-08-07",
        kindCode: "FULL_BOARD",
        resourceId: null,
      }),
    ).rejects.toMatchObject({
      message: "August 2026 is published. Click Edit month to change it.",
      data: { code: "PRECONDITION_FAILED" },
    });
    expect(await entryDates(published.id)).toEqual([]);
    expect(await readMonth(published.id)).toMatchObject({
      status: "PUBLISHED",
      revision: 3,
      updatedByEmail: AUDIT_EMAIL,
    });
  });

  it("is PRECONDITION_FAILED on a published month before checking the date", async () => {
    const client = await initUsCoClient(coEditor);

    await expect(
      add(client, {
        monthId: published.id,
        date: "2026-08-08",
        kindCode: "FULL_BOARD",
        resourceId: null,
      }),
    ).rejects.toMatchObject({ data: { code: "PRECONDITION_FAILED" } });
  });

  it.each([
    [
      "month",
      { monthId: "no-such-month" },
      "That month no longer exists. Refresh to see the latest calendar.",
    ],
    [
      "kind row",
      { kindCode: "BUSINESS_MEETING" as const, resourceId: null },
      "That kind doesn't exist.",
    ],
    [
      "resource",
      { resourceId: "no-such-resource" },
      "That location doesn't exist.",
    ],
  ])("is NOT_FOUND for an unknown %s", async (_label, override, message) => {
    // Colorado's code has a Business Meeting entry type; without its kind
    // row, the calendar can't take one.
    await testPrismaClient.calendarEntryPattern.delete({
      where: { id: seeded.patterns["BUSINESS_MEETING"].id },
    });
    await testPrismaClient.calendarEntryKind.delete({
      where: { id: seeded.kinds["BUSINESS_MEETING"].id },
    });
    const client = await initUsCoClient(coEditor);

    await expect(
      add(client, {
        date: "2026-09-21",
        kindCode: "HEARING",
        resourceId: seeded.resources["SITE_A"].id,
        ...override,
      }),
    ).rejects.toMatchObject({ message, data: { code: "NOT_FOUND" } });
    expect((await readMonth(draft.id)).revision).toBe(3);
  });

  it("is BAD_REQUEST for an inactive resource", async () => {
    await testPrismaClient.calendarResource.update({
      where: { id: seeded.resources["SITE_B"].id },
      data: { isActive: false },
    });
    const client = await initUsCoClient(coEditor);

    await expect(
      add(client, {
        date: "2026-09-08",
        kindCode: "HEARING",
        resourceId: seeded.resources["SITE_B"].id,
      }),
    ).rejects.toMatchObject({
      message: "Site B is no longer an active location.",
      data: { code: "BAD_REQUEST" },
    });
  });

  it("is INTERNAL_SERVER_ERROR for a stored resource code with a colon", async () => {
    await testPrismaClient.calendarResource.update({
      where: { id: seeded.resources["SITE_B"].id },
      data: { code: "SITE:B" },
    });
    const client = await initUsCoClient(coEditor);

    await expect(
      add(client, {
        date: "2026-09-08",
        kindCode: "HEARING",
        resourceId: seeded.resources["SITE_B"].id,
      }),
    ).rejects.toMatchObject({ data: { code: "INTERNAL_SERVER_ERROR" } });
    expect((await readMonth(draft.id)).revision).toBe(3);
  });

  it("adds an entry on a Colorado holiday and flags it", async () => {
    const client = await initUsCoClient(coEditor);

    const { entry } = await add(client, {
      date: "2026-09-07",
      kindCode: "HEARING",
      resourceId: seeded.resources["SITE_A"].id,
    });

    expect(entry.holidayName).toBe("Labor Day");
  });
});

describe("Calendar.usCo.paroleBoard.admin.entries.delete", () => {
  function remove(
    client: TRPCClient<typeof usCoTestRouter>,
    entryId: string,
    expectedVersion: number,
  ) {
    return client.Calendar.usCo.paroleBoard.admin.entries.delete.mutate({
      entryId,
      expectedVersion,
    });
  }

  it("deletes the entry when the version matches and bumps the revision", async () => {
    const client = await initUsCoClient(coEditor);

    const result = await remove(client, existing.id, 1);

    expect(result).toMatchObject({
      deletedEntryId: existing.id,
      monthRevision: 4,
    });
    expect(await entryDates(draft.id)).toEqual([]);
    expect(await readMonth(draft.id)).toMatchObject({
      revision: 4,
      updatedByEmail: EDITOR_EMAIL,
    });
  });

  it("returns the entry's month after the delete, without the entry", async () => {
    const other = await createEntry(
      seeded,
      draft.id,
      "2026-09-15",
      "HEARING",
      "SITE_B",
    );
    const client = await initUsCoClient(coEditor);

    const { month } = await remove(client, existing.id, 1);

    expect(month).toMatchObject({
      id: draft.id,
      revision: 4,
      lastEditedByEmail: EDITOR_EMAIL,
      counts: { entryDays: 1, entryCount: 1 },
    });
    expect(month.entries.map(({ id }) => id)).toEqual([other.id]);
  });

  it("deletes an entry of a kind with no resource", async () => {
    const meeting = await createEntry(
      seeded,
      draft.id,
      "2026-09-04",
      "FULL_BOARD",
      null,
    );
    const client = await initUsCoClient(coEditor);

    await remove(client, meeting.id, 1);

    expect(await entryDates(draft.id)).toEqual(["2026-09-14 HEARING:SITE_A"]);
  });

  it("is CONFLICT for a stale version and writes nothing", async () => {
    await testPrismaClient.calendarEntry.update({
      where: { id: existing.id },
      data: { version: 2 },
    });
    const client = await initUsCoClient(coEditor);

    await expect(remove(client, existing.id, 1)).rejects.toMatchObject({
      message:
        "Someone else changed this entry. Refresh to see the latest calendar, then try again.",
      data: { code: "CONFLICT" },
    });
    expect(await entryDates(draft.id)).toEqual(["2026-09-14 HEARING:SITE_A"]);
    expect((await readMonth(draft.id)).revision).toBe(3);
  });

  it("is NOT_FOUND for an entry that's already gone", async () => {
    await testPrismaClient.calendarEntry.delete({ where: { id: existing.id } });
    const client = await initUsCoClient(coEditor);

    await expect(remove(client, existing.id, 1)).rejects.toMatchObject({
      message:
        "This entry no longer exists. Someone may have deleted it. Refresh to see the latest calendar.",
      data: { code: "NOT_FOUND" },
    });
  });

  it.each([
    ["the entry's version", "FULL_BOARD", 1],
    ["a stale version", "FULL_BOARD", 2],
    ["a Business Meeting", "BUSINESS_MEETING", 1],
  ])(
    "is PRECONDITION_FAILED on a published month with %s and writes nothing",
    async (_label, kindCode, version) => {
      const entry = await createEntry(
        seeded,
        published.id,
        "2026-08-07",
        kindCode,
        null,
      );
      const client = await initUsCoClient(coEditor);

      await expect(remove(client, entry.id, version)).rejects.toMatchObject({
        message: "August 2026 is published. Click Edit month to change it.",
        data: { code: "PRECONDITION_FAILED" },
      });
      expect(await entryDates(published.id)).toEqual([
        `2026-08-07 ${kindCode}`,
      ]);
      expect(await readMonth(published.id)).toMatchObject({
        status: "PUBLISHED",
        revision: 3,
        updatedByEmail: AUDIT_EMAIL,
      });
    },
  );

  it("is BAD_REQUEST for a Business Meeting, which can only be cancelled, and writes nothing", async () => {
    const entry = await createEntry(
      seeded,
      draft.id,
      "2026-09-18",
      "BUSINESS_MEETING",
      null,
    );
    const client = await initUsCoClient(coEditor);

    await expect(remove(client, entry.id, 1)).rejects.toMatchObject({
      message: "Business Mtg can't be deleted. Cancel it instead.",
      data: { code: "BAD_REQUEST" },
    });
    expect(await entryDates(draft.id)).toEqual([
      "2026-09-14 HEARING:SITE_A",
      "2026-09-18 BUSINESS_MEETING",
    ]);
    expect((await readMonth(draft.id)).revision).toBe(3);
  });

  it("lets one of two deletes with the same version win and the other is NOT_FOUND", async () => {
    const client = await initUsCoClient(coEditor);

    const results = await Promise.allSettled([
      remove(client, existing.id, 1),
      remove(client, existing.id, 1),
    ]);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(rejected[0]).toMatchObject({
      reason: { data: { code: "NOT_FOUND" } },
    });
    expect(await entryDates(draft.id)).toEqual([]);
  });
});

describe("calendar and state isolation", () => {
  let otherMonth: Awaited<ReturnType<typeof createMonth>>;
  let otherEntry: Awaited<ReturnType<typeof createEntry>>;
  let otherSeeded: SeededCalendar;

  beforeEach(async () => {
    const otherId = await calendarId(OTHER_CALENDAR_CODE);
    otherSeeded = await seedCalendarConfig(
      testPrismaClient,
      otherId,
      US_CO_TEST_CONFIG,
    );
    otherMonth = await createMonth(otherId, 2026, 9);
    otherEntry = await createEntry(
      otherSeeded,
      otherMonth.id,
      "2026-09-14",
      "HEARING",
      "SITE_A",
    );
  });

  async function expectOtherCalendarUnchanged() {
    expect(await entryDates(otherMonth.id)).toEqual([
      "2026-09-14 HEARING:SITE_A",
    ]);
    expect(await readMonth(otherMonth.id)).toMatchObject({
      revision: 3,
      updatedByEmail: AUDIT_EMAIL,
    });
  }

  it("is NOT_FOUND when a US_CO editor adds to another calendar's month", async () => {
    const client = await initUsCoClient(coEditor);

    await expect(
      client.Calendar.usCo.paroleBoard.admin.entries.add.mutate({
        monthId: otherMonth.id,
        date: "2026-09-04",
        kindCode: "FULL_BOARD",
        resourceId: null,
      }),
    ).rejects.toMatchObject({ data: { code: "NOT_FOUND" } });
    await expectOtherCalendarUnchanged();
  });

  it("is NOT_FOUND when a US_CO editor sends another calendar's resource", async () => {
    const client = await initUsCoClient(coEditor);

    await expect(
      client.Calendar.usCo.paroleBoard.admin.entries.add.mutate({
        monthId: draft.id,
        date: "2026-09-21",
        kindCode: "HEARING",
        resourceId: otherSeeded.resources["SITE_A"].id,
      }),
    ).rejects.toMatchObject({ data: { code: "NOT_FOUND" } });
    expect((await readMonth(draft.id)).revision).toBe(3);
  });

  it("is NOT_FOUND when a US_CO editor deletes another calendar's entry", async () => {
    const client = await initUsCoClient(coEditor);

    await expect(
      client.Calendar.usCo.paroleBoard.admin.entries.delete.mutate({
        entryId: otherEntry.id,
        expectedVersion: 1,
      }),
    ).rejects.toMatchObject({ data: { code: "NOT_FOUND" } });
    await expectOtherCalendarUnchanged();
  });

  it("is FORBIDDEN for a US_ID editor, whose state this calendar isn't", async () => {
    const client = await initUsCoClient(idUser, { stateCode: "US_ID" });

    await expect(
      client.Calendar.usCo.paroleBoard.admin.entries.delete.mutate({
        entryId: otherEntry.id,
        expectedVersion: 1,
      }),
    ).rejects.toMatchObject({ data: { code: "FORBIDDEN" } });
    await expectOtherCalendarUnchanged();
  });
});
