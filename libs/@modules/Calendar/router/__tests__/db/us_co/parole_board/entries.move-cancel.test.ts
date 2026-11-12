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

// Synthetic rows in Colorado's shape: HEARING needs a site and can't be
// cancelled, and FULL_BOARD and BUSINESS_MEETING take none and can be.
const calendarCode = "PAROLE_BOARD_PUBLIC";
const audit = { createdByEmail: AUDIT_EMAIL, updatedByEmail: AUDIT_EMAIL };
/** coEditor's email, lowercased as the procedures store it. */
const EDITOR_EMAIL = "co.editor@example.com";
const NOW = new Date("2026-08-20T16:00:00Z");

type Client = TRPCClient<typeof usCoTestRouter>;

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

function readEntry(id: string) {
  return testPrismaClient.calendarEntry.findUniqueOrThrow({ where: { id } });
}

/** Moves entries, each given as [id, expectedVersion], to date together. */
function moveMany(client: Client, entries: [string, number][], date: string) {
  return client.Calendar.usCo.paroleBoard.admin.entries.move.mutate({
    entries: entries.map(([entryId, expectedVersion]) => ({
      entryId,
      expectedVersion,
    })),
    newDate: date,
  });
}

/** Moves one entry and returns it with the month and its revision. */
async function move(
  client: Client,
  entryId: string,
  version: number,
  date: string,
) {
  const { entries, monthRevision, month } = await moveMany(
    client,
    [[entryId, version]],
    date,
  );
  return { entry: entries[0], monthRevision, month };
}

function cancel(client: Client, entryId: string, version: number) {
  return client.Calendar.usCo.paroleBoard.admin.entries.cancel.mutate({
    entryId,
    expectedVersion: version,
  });
}

function uncancel(client: Client, entryId: string, version: number) {
  return client.Calendar.usCo.paroleBoard.admin.entries.uncancel.mutate({
    entryId,
    expectedVersion: version,
  });
}

/** Marks an entry cancelled directly, as an earlier cancel would have. */
function markCancelled(entryId: string) {
  return testPrismaClient.calendarEntry.update({
    where: { id: entryId },
    data: { cancelledAt: NOW, cancelledByEmail: AUDIT_EMAIL },
  });
}

let id: string;
let seeded: SeededCalendar;
let draft: Awaited<ReturnType<typeof createMonth>>;
let published: Awaited<ReturnType<typeof createMonth>>;
let siteAFirst: Awaited<ReturnType<typeof createEntry>>;
let siteASecond: Awaited<ReturnType<typeof createEntry>>;
let siteB: Awaited<ReturnType<typeof createEntry>>;
let meeting: Awaited<ReturnType<typeof createEntry>>;

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ["Date"], now: NOW });
  id = await calendarId();
  seeded = await seedCalendarConfig(testPrismaClient, id, US_CO_TEST_CONFIG);
  draft = await createMonth(id, 2026, 9);
  published = await createMonth(id, 2026, 8, "PUBLISHED");
  siteAFirst = await createEntry(
    seeded,
    draft.id,
    "2026-09-07",
    "HEARING",
    "SITE_A",
  );
  siteASecond = await createEntry(
    seeded,
    draft.id,
    "2026-09-14",
    "HEARING",
    "SITE_A",
  );
  siteB = await createEntry(
    seeded,
    draft.id,
    "2026-09-08",
    "HEARING",
    "SITE_B",
  );
  meeting = await createEntry(
    seeded,
    draft.id,
    "2026-09-11",
    "FULL_BOARD",
    null,
  );
});

afterEach(() => {
  vi.useRealTimers();
});

describe("Calendar.usCo.paroleBoard.admin.entries.move", () => {
  it("moves the entry, bumps its version and the revision, and records the caller", async () => {
    const client = await initUsCoClient(coEditor);

    const { entry, monthRevision, month } = await move(
      client,
      siteASecond.id,
      1,
      "2026-09-15",
    );

    expect(entry).toMatchObject({
      id: siteASecond.id,
      date: "2026-09-15",
      slotKey: "HEARING:SITE_A",
      source: "PATTERN",
      version: 2,
      updatedByEmail: EDITOR_EMAIL,
    });
    expect(monthRevision).toBe(4);
    expect(month).toMatchObject({
      id: draft.id,
      revision: 4,
      lastEditedByEmail: EDITOR_EMAIL,
    });
    expect(month.entries).toContainEqual(entry);
    const row = await readEntry(siteASecond.id);
    expect(fromDbDate(row.date)).toBe("2026-09-15");
    expect(row).toMatchObject({
      version: 2,
      source: "PATTERN",
      createdByEmail: AUDIT_EMAIL,
      updatedByEmail: EDITOR_EMAIL,
    });
    expect(await readMonth(draft.id)).toMatchObject({
      revision: 4,
      updatedByEmail: EDITOR_EMAIL,
    });
  });

  it("is CONFLICT for a stale version and leaves the date alone", async () => {
    await testPrismaClient.calendarEntry.update({
      where: { id: siteASecond.id },
      data: { version: 2 },
    });
    const client = await initUsCoClient(coEditor);

    await expect(
      move(client, siteASecond.id, 1, "2026-09-15"),
    ).rejects.toMatchObject({
      message:
        "Someone else changed this entry. Refresh to see the latest calendar, then try again.",
      data: { code: "CONFLICT" },
    });
    expect(fromDbDate((await readEntry(siteASecond.id)).date)).toBe(
      "2026-09-14",
    );
    expect((await readMonth(draft.id)).revision).toBe(3);
  });

  it("is BAD_REQUEST for a day in another month", async () => {
    const client = await initUsCoClient(coEditor);

    await expect(
      move(client, siteASecond.id, 1, "2026-10-01"),
    ).rejects.toMatchObject({
      message: "Pick a day in September 2026.",
      data: { code: "BAD_REQUEST" },
    });
    expect((await readEntry(siteASecond.id)).version).toBe(1);
  });

  it("is CONFLICT for a move onto the same slot's day and doesn't bump the revision", async () => {
    const client = await initUsCoClient(coEditor);

    await expect(
      move(client, siteAFirst.id, 1, "2026-09-14"),
    ).rejects.toMatchObject({
      message: "Site A is already on September 14.",
      data: { code: "CONFLICT" },
    });
    expect(fromDbDate((await readEntry(siteAFirst.id)).date)).toBe(
      "2026-09-07",
    );
    expect((await readMonth(draft.id)).revision).toBe(3);
  });

  it("is CONFLICT for a move to its own date with a stale version", async () => {
    const client = await initUsCoClient(coEditor);

    await expect(
      move(client, siteASecond.id, 2, "2026-09-14"),
    ).rejects.toMatchObject({ data: { code: "CONFLICT" } });
  });

  it("returns the entry unchanged for a move to its own date", async () => {
    const client = await initUsCoClient(coEditor);

    const { entry, monthRevision, month } = await move(
      client,
      siteASecond.id,
      1,
      "2026-09-14",
    );

    expect(entry).toMatchObject({ date: "2026-09-14", version: 1 });
    expect(monthRevision).toBe(3);
    expect(month).toMatchObject({
      id: draft.id,
      revision: 3,
      lastEditedByEmail: AUDIT_EMAIL,
    });
    expect(month.entries).toContainEqual(entry);
    expect(await readEntry(siteASecond.id)).toMatchObject({
      version: 1,
      updatedByEmail: AUDIT_EMAIL,
    });
    expect(await readMonth(draft.id)).toMatchObject({
      revision: 3,
      updatedByEmail: AUDIT_EMAIL,
    });
  });

  it.each([
    ["a stale version", 2, "2026-08-14"],
    ["a weekend day", 1, "2026-08-15"],
  ])(
    "is PRECONDITION_FAILED in a published month before checking %s",
    async (_label, version, newDate) => {
      const entry = await createEntry(
        seeded,
        published.id,
        "2026-08-07",
        "FULL_BOARD",
        null,
      );
      const client = await initUsCoClient(coEditor);

      await expect(
        move(client, entry.id, version, newDate),
      ).rejects.toMatchObject({
        message: "August 2026 is published. Click Edit month to change it.",
        data: { code: "PRECONDITION_FAILED" },
      });
    },
  );

  it.each([
    ["to another day", "2026-08-14"],
    ["to its own day, which would change nothing", "2026-08-07"],
  ])(
    "is PRECONDITION_FAILED in a published month %s and writes nothing",
    async (_label, newDate) => {
      const entry = await createEntry(
        seeded,
        published.id,
        "2026-08-07",
        "FULL_BOARD",
        null,
      );
      const client = await initUsCoClient(coEditor);

      await expect(move(client, entry.id, 1, newDate)).rejects.toMatchObject({
        message: "August 2026 is published. Click Edit month to change it.",
        data: { code: "PRECONDITION_FAILED" },
      });
      expect(await readEntry(entry.id)).toMatchObject({
        date: toDbDate("2026-08-07"),
        version: 1,
        updatedByEmail: AUDIT_EMAIL,
      });
      expect(await readMonth(published.id)).toMatchObject({
        status: "PUBLISHED",
        revision: 3,
        updatedByEmail: AUDIT_EMAIL,
      });
    },
  );

  it("is NOT_FOUND for an entry that's been deleted", async () => {
    await testPrismaClient.calendarEntry.delete({
      where: { id: siteASecond.id },
    });
    const client = await initUsCoClient(coEditor);

    await expect(
      move(client, siteASecond.id, 1, "2026-09-15"),
    ).rejects.toMatchObject({
      message:
        "This entry no longer exists. Someone may have deleted it. Refresh to see the latest calendar.",
      data: { code: "NOT_FOUND" },
    });
    expect((await readMonth(draft.id)).revision).toBe(3);
  });

  it("keeps a cancelled meeting cancelled", async () => {
    await markCancelled(meeting.id);
    const client = await initUsCoClient(coEditor);

    const { entry } = await move(client, meeting.id, 1, "2026-09-25");

    expect(entry).toMatchObject({
      date: "2026-09-25",
      cancelled: true,
      cancelledByEmail: AUDIT_EMAIL,
    });
    expect(await readEntry(meeting.id)).toMatchObject({
      cancelledAt: NOW,
      cancelledByEmail: AUDIT_EMAIL,
    });
  });

  it("moves an entry onto a Colorado holiday and flags it", async () => {
    const client = await initUsCoClient(coEditor);

    const { entry } = await move(client, siteB.id, 1, "2026-09-07");

    expect(entry).toMatchObject({
      date: "2026-09-07",
      holidayName: "Labor Day",
    });
  });

  it("lets one of a move and a delete with the same version win", async () => {
    const client = await initUsCoClient(coEditor);

    const results = await Promise.allSettled([
      move(client, siteASecond.id, 1, "2026-09-15"),
      client.Calendar.usCo.paroleBoard.admin.entries.delete.mutate({
        entryId: siteASecond.id,
        expectedVersion: 1,
      }),
    ]);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(["CONFLICT", "NOT_FOUND"]).toContain(
      (rejected[0] as PromiseRejectedResult).reason.data.code,
    );
    const row = await testPrismaClient.calendarEntry.findUnique({
      where: { id: siteASecond.id },
    });
    if (row) expect(fromDbDate(row.date)).toBe("2026-09-15");
  });
});

describe("Calendar.usCo.paroleBoard.admin.entries.move with several entries", () => {
  it("moves every entry to the day in one revision, in input order", async () => {
    const client = await initUsCoClient(coEditor);

    const { entries, monthRevision, month } = await moveMany(
      client,
      [
        [meeting.id, 1],
        [siteB.id, 1],
        [siteASecond.id, 1],
      ],
      "2026-09-15",
    );

    expect(entries.map((e) => [e.id, e.date, e.version])).toEqual([
      [meeting.id, "2026-09-15", 2],
      [siteB.id, "2026-09-15", 2],
      [siteASecond.id, "2026-09-15", 2],
    ]);
    expect(monthRevision).toBe(4);
    expect(month.revision).toBe(4);
    for (const entry of entries) expect(month.entries).toContainEqual(entry);
    expect((await readMonth(draft.id)).revision).toBe(4);
  });

  it("leaves an entry already on the day unchanged and moves the rest", async () => {
    const client = await initUsCoClient(coEditor);

    const { entries } = await moveMany(
      client,
      [
        [siteAFirst.id, 1],
        [siteB.id, 1],
      ],
      "2026-09-07",
    );

    expect(entries.map((e) => [e.date, e.version])).toEqual([
      ["2026-09-07", 1],
      ["2026-09-07", 2],
    ]);
  });

  it.each([
    [
      "two selected entries share a slot",
      () => [
        [siteAFirst.id, 1],
        [siteASecond.id, 1],
      ],
      "2026-09-15",
    ],
    [
      "the day already has a selected entry's slot",
      () => [
        [siteB.id, 1],
        [siteASecond.id, 1],
      ],
      "2026-09-07",
    ],
  ] as const)(
    "is CONFLICT naming the entry when %s, and moves nothing",
    async (_label, entries, date) => {
      const client = await initUsCoClient(coEditor);

      await expect(
        moveMany(client, entries() as [string, number][], date),
      ).rejects.toMatchObject({
        message: `Site A is already on September ${Number(date.slice(8))}.`,
        data: { code: "CONFLICT" },
      });
      expect(fromDbDate((await readEntry(siteB.id)).date)).toBe("2026-09-08");
      expect(fromDbDate((await readEntry(siteASecond.id)).date)).toBe(
        "2026-09-14",
      );
      expect((await readMonth(draft.id)).revision).toBe(3);
    },
  );

  it("rolls back entries it already moved when a later one fails inside the transaction", async () => {
    // A trigger fails the write of the second entry, after the first one's
    // update has run in the same transaction.
    await testPrismaClient.$executeRawUnsafe(`
      CREATE FUNCTION test_fail_entry_update() RETURNS trigger AS $$
      BEGIN RAISE EXCEPTION 'test failure'; END;
      $$ LANGUAGE plpgsql`);
    await testPrismaClient.$executeRawUnsafe(`
      CREATE TRIGGER test_fail_entry_update BEFORE UPDATE ON "CalendarEntry"
      FOR EACH ROW WHEN (OLD."id" = '${siteASecond.id}')
      EXECUTE FUNCTION test_fail_entry_update()`);
    const client = await initUsCoClient(coEditor);

    try {
      await expect(
        moveMany(
          client,
          [
            [siteB.id, 1],
            [siteASecond.id, 1],
          ],
          "2026-09-15",
        ),
      ).rejects.toMatchObject({ data: { code: "INTERNAL_SERVER_ERROR" } });
    } finally {
      await testPrismaClient.$executeRawUnsafe(
        `DROP TRIGGER test_fail_entry_update ON "CalendarEntry"`,
      );
      await testPrismaClient.$executeRawUnsafe(
        `DROP FUNCTION test_fail_entry_update()`,
      );
    }
    expect(await readEntry(siteB.id)).toMatchObject({ version: 1 });
    expect(fromDbDate((await readEntry(siteB.id)).date)).toBe("2026-09-08");
    expect((await readMonth(draft.id)).revision).toBe(3);
  });

  it("is BAD_REQUEST on a weekend, which Colorado doesn't allow, and moves nothing", async () => {
    const client = await initUsCoClient(coEditor);

    await expect(
      moveMany(
        client,
        [
          [meeting.id, 1],
          [siteB.id, 1],
        ],
        "2026-09-13",
      ),
    ).rejects.toMatchObject({
      message: "This calendar has no entries on Sundays. Pick another day.",
      data: { code: "BAD_REQUEST" },
    });
    expect(fromDbDate((await readEntry(meeting.id)).date)).toBe("2026-09-11");
    expect(fromDbDate((await readEntry(siteB.id)).date)).toBe("2026-09-08");
    expect((await readMonth(draft.id)).revision).toBe(3);
  });

  it("returns an entry already on a disallowed day unchanged", async () => {
    const sunday = await createEntry(
      seeded,
      draft.id,
      "2026-09-13",
      "FULL_BOARD",
      null,
    );
    const client = await initUsCoClient(coEditor);

    const { entries, monthRevision } = await moveMany(
      client,
      [[sunday.id, 1]],
      "2026-09-13",
    );

    expect(entries[0]).toMatchObject({ date: "2026-09-13", version: 1 });
    expect(monthRevision).toBe(3);
  });

  it("is CONFLICT when one version is stale, and moves nothing", async () => {
    await testPrismaClient.calendarEntry.update({
      where: { id: siteB.id },
      data: { version: 2 },
    });
    const client = await initUsCoClient(coEditor);

    await expect(
      moveMany(
        client,
        [
          [meeting.id, 1],
          [siteB.id, 1],
        ],
        "2026-09-15",
      ),
    ).rejects.toMatchObject({ data: { code: "CONFLICT" } });
    expect(fromDbDate((await readEntry(meeting.id)).date)).toBe("2026-09-11");
    expect((await readMonth(draft.id)).revision).toBe(3);
  });

  it("is BAD_REQUEST for entries from two months", async () => {
    const august = await createEntry(
      seeded,
      published.id,
      "2026-08-07",
      "FULL_BOARD",
      null,
    );
    const client = await initUsCoClient(coEditor);

    await expect(
      moveMany(
        client,
        [
          [siteB.id, 1],
          [august.id, 1],
        ],
        "2026-09-15",
      ),
    ).rejects.toMatchObject({
      message: "Pick entries from one month to move together.",
      data: { code: "BAD_REQUEST" },
    });
  });

  it("is NOT_FOUND when one entry is gone, and moves nothing", async () => {
    await testPrismaClient.calendarEntry.delete({ where: { id: siteB.id } });
    const client = await initUsCoClient(coEditor);

    await expect(
      moveMany(
        client,
        [
          [meeting.id, 1],
          [siteB.id, 1],
        ],
        "2026-09-15",
      ),
    ).rejects.toMatchObject({ data: { code: "NOT_FOUND" } });
    expect(fromDbDate((await readEntry(meeting.id)).date)).toBe("2026-09-11");
  });
});

describe("Calendar.usCo.paroleBoard.admin.entries.cancel", () => {
  it("cancels a cancellable entry and records who did it", async () => {
    const client = await initUsCoClient(coEditor);

    const { entry, monthRevision, month } = await cancel(client, meeting.id, 1);

    expect(entry).toMatchObject({
      cancelled: true,
      cancelledAt: NOW,
      cancelledByEmail: EDITOR_EMAIL,
      version: 2,
      updatedByEmail: EDITOR_EMAIL,
    });
    expect(monthRevision).toBe(4);
    expect(month).toMatchObject({
      id: draft.id,
      revision: 4,
      lastEditedByEmail: EDITOR_EMAIL,
    });
    expect(month.entries).toContainEqual(entry);
    expect(await readEntry(meeting.id)).toMatchObject({
      cancelledAt: NOW,
      cancelledByEmail: EDITOR_EMAIL,
      version: 2,
      updatedByEmail: EDITOR_EMAIL,
    });
    expect(await readMonth(draft.id)).toMatchObject({
      revision: 4,
      updatedByEmail: EDITOR_EMAIL,
    });
  });

  it.each([
    ["cancel", cancel],
    ["uncancel", uncancel],
  ])(
    "is BAD_REQUEST to %s a kind that can't be cancelled",
    async (_label, call) => {
      const client = await initUsCoClient(coEditor);

      await expect(call(client, siteASecond.id, 1)).rejects.toMatchObject({
        message: "Site A can't be cancelled. Delete it instead.",
        data: { code: "BAD_REQUEST" },
      });
      expect(await readEntry(siteASecond.id)).toMatchObject({
        cancelledAt: null,
        version: 1,
      });
      expect((await readMonth(draft.id)).revision).toBe(3);
    },
  );

  it("is BAD_REQUEST, not CONFLICT, for a kind that can't be cancelled with a stale version", async () => {
    const client = await initUsCoClient(coEditor);

    await expect(cancel(client, siteASecond.id, 99)).rejects.toMatchObject({
      data: { code: "BAD_REQUEST" },
    });
  });

  it("changes nothing when cancelled again with the fresh version", async () => {
    const client = await initUsCoClient(coEditor);
    const first = await cancel(client, meeting.id, 1);

    const second = await cancel(client, meeting.id, first.entry.version);

    expect(second).toEqual(first);
    expect((await readEntry(meeting.id)).version).toBe(2);
    expect((await readMonth(draft.id)).revision).toBe(4);
  });

  it("is CONFLICT for a stale version and writes nothing", async () => {
    await testPrismaClient.calendarEntry.update({
      where: { id: meeting.id },
      data: { version: 2 },
    });
    const client = await initUsCoClient(coEditor);

    await expect(cancel(client, meeting.id, 1)).rejects.toMatchObject({
      data: { code: "CONFLICT" },
    });
    expect(await readEntry(meeting.id)).toMatchObject({
      cancelledAt: null,
      version: 2,
    });
    expect((await readMonth(draft.id)).revision).toBe(3);
  });

  it.each([
    ["a stale version", "FULL_BOARD", null, 2],
    ["the kind, for a hearing", "HEARING", "SITE_A", 1],
  ])(
    "is PRECONDITION_FAILED in a published month before checking %s",
    async (_label, kindCode, resourceCode, version) => {
      const entry = await createEntry(
        seeded,
        published.id,
        "2026-08-07",
        kindCode,
        resourceCode,
      );
      const client = await initUsCoClient(coEditor);

      await expect(cancel(client, entry.id, version)).rejects.toMatchObject({
        message: "August 2026 is published. Click Edit month to change it.",
        data: { code: "PRECONDITION_FAILED" },
      });
    },
  );

  it.each([
    ["an entry", null],
    ["an entry already cancelled, which would change nothing", NOW],
  ])(
    "is PRECONDITION_FAILED for %s in a published month and writes nothing",
    async (_label, cancelledAt) => {
      const entry = await createEntry(
        seeded,
        published.id,
        "2026-08-07",
        "FULL_BOARD",
        null,
      );
      if (cancelledAt) await markCancelled(entry.id);
      const client = await initUsCoClient(coEditor);

      await expect(cancel(client, entry.id, 1)).rejects.toMatchObject({
        message: "August 2026 is published. Click Edit month to change it.",
        data: { code: "PRECONDITION_FAILED" },
      });
      expect(await readEntry(entry.id)).toMatchObject({
        cancelledAt,
        version: 1,
      });
      expect(await readMonth(published.id)).toMatchObject({
        status: "PUBLISHED",
        revision: 3,
        updatedByEmail: AUDIT_EMAIL,
      });
    },
  );

  it("is NOT_FOUND for an entry that's been deleted", async () => {
    await testPrismaClient.calendarEntry.delete({ where: { id: meeting.id } });
    const client = await initUsCoClient(coEditor);

    await expect(cancel(client, meeting.id, 1)).rejects.toMatchObject({
      data: { code: "NOT_FOUND" },
    });
    expect((await readMonth(draft.id)).revision).toBe(3);
  });
});

describe("Calendar.usCo.paroleBoard.admin.entries.uncancel", () => {
  beforeEach(async () => {
    await markCancelled(meeting.id);
  });

  it("clears the cancellation and bumps the version and revision", async () => {
    const client = await initUsCoClient(coEditor);

    const { entry, monthRevision, month } = await uncancel(
      client,
      meeting.id,
      1,
    );

    expect(entry).toMatchObject({
      cancelled: false,
      cancelledAt: null,
      cancelledByEmail: null,
      version: 2,
      updatedByEmail: EDITOR_EMAIL,
    });
    expect(monthRevision).toBe(4);
    expect(month).toMatchObject({ id: draft.id, revision: 4 });
    expect(month.entries).toContainEqual(entry);
    expect(await readEntry(meeting.id)).toMatchObject({
      cancelledAt: null,
      cancelledByEmail: null,
      version: 2,
    });
  });

  it("changes nothing when uncancelled again with the fresh version", async () => {
    const client = await initUsCoClient(coEditor);
    const first = await uncancel(client, meeting.id, 1);

    const second = await uncancel(client, meeting.id, first.entry.version);

    expect(second).toEqual(first);
    expect((await readMonth(draft.id)).revision).toBe(4);
  });

  it("is CONFLICT for a stale version and writes nothing", async () => {
    await testPrismaClient.calendarEntry.update({
      where: { id: meeting.id },
      data: { version: 2 },
    });
    const client = await initUsCoClient(coEditor);

    await expect(uncancel(client, meeting.id, 1)).rejects.toMatchObject({
      data: { code: "CONFLICT" },
    });
    expect((await readEntry(meeting.id)).cancelledAt).toEqual(NOW);
    expect((await readMonth(draft.id)).revision).toBe(3);
  });

  it.each([
    ["a cancelled entry", NOW],
    ["an entry that isn't cancelled, which would change nothing", null],
  ])(
    "is PRECONDITION_FAILED for %s in a published month and writes nothing",
    async (_label, cancelledAt) => {
      const entry = await createEntry(
        seeded,
        published.id,
        "2026-08-07",
        "FULL_BOARD",
        null,
      );
      if (cancelledAt) await markCancelled(entry.id);
      const client = await initUsCoClient(coEditor);

      await expect(uncancel(client, entry.id, 1)).rejects.toMatchObject({
        message: "August 2026 is published. Click Edit month to change it.",
        data: { code: "PRECONDITION_FAILED" },
      });
      expect(await readEntry(entry.id)).toMatchObject({
        cancelledAt,
        version: 1,
      });
      expect(await readMonth(published.id)).toMatchObject({
        status: "PUBLISHED",
        revision: 3,
        updatedByEmail: AUDIT_EMAIL,
      });
    },
  );

  it("is NOT_FOUND for an entry that's been deleted", async () => {
    await testPrismaClient.calendarEntry.delete({ where: { id: meeting.id } });
    const client = await initUsCoClient(coEditor);

    await expect(uncancel(client, meeting.id, 1)).rejects.toMatchObject({
      data: { code: "NOT_FOUND" },
    });
  });
});

describe("calendar and state isolation", () => {
  let otherMonth: Awaited<ReturnType<typeof createMonth>>;
  let idMeeting: Awaited<ReturnType<typeof createEntry>>;

  beforeEach(async () => {
    const otherId = await calendarId(OTHER_CALENDAR_CODE);
    const otherSeeded = await seedCalendarConfig(
      testPrismaClient,
      otherId,
      US_CO_TEST_CONFIG,
    );
    otherMonth = await createMonth(otherId, 2026, 9);
    idMeeting = await createEntry(
      otherSeeded,
      otherMonth.id,
      "2026-09-11",
      "FULL_BOARD",
      null,
    );
  });

  it.each([
    ["moves", (c: Client, e: string) => move(c, e, 1, "2026-09-18")],
    ["cancels", (c: Client, e: string) => cancel(c, e, 1)],
    ["uncancels", (c: Client, e: string) => uncancel(c, e, 1)],
  ])(
    "is NOT_FOUND when a US_CO editor %s another calendar's entry",
    async (_label, call) => {
      const client = await initUsCoClient(coEditor);

      await expect(call(client, idMeeting.id)).rejects.toMatchObject({
        data: { code: "NOT_FOUND" },
      });
      const row = await readEntry(idMeeting.id);
      expect(fromDbDate(row.date)).toBe("2026-09-11");
      expect(row).toMatchObject({
        version: 1,
        cancelledAt: null,
        updatedByEmail: AUDIT_EMAIL,
      });
      expect((await readMonth(otherMonth.id)).revision).toBe(3);
    },
  );

  it("is FORBIDDEN for a US_ID editor, whose state this calendar isn't", async () => {
    const client = await initUsCoClient(idUser, { stateCode: "US_ID" });

    await expect(cancel(client, idMeeting.id, 1)).rejects.toMatchObject({
      data: { code: "FORBIDDEN" },
    });
  });
});
