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

import { toDbDate } from "../../../../src/db/dates";
import { publishMonth } from "../../../../src/services/monthStatus";
import { testPrismaClient } from "../../../setup";
import { AUDIT_EMAIL, OTHER_CALENDAR_CODE } from "../../../setup/fixtures";
import {
  seedCalendarConfig,
  SeededCalendar,
} from "../../../setup/seedCalendarConfig";
import { coEditor } from "../../../setup/users";
import {
  initUsCoClient,
  resolveParoleBoardCalendar,
  US_CO_TEST_CONFIG,
  type usCoTestRouter,
} from "../../../us_co/parole_board/setup";

// Synthetic rows in Colorado's shape: HEARING needs a site, and FULL_BOARD
// takes none. Every Colorado entry type is public.
const calendarCode = "PAROLE_BOARD_PUBLIC";
const audit = { createdByEmail: AUDIT_EMAIL, updatedByEmail: AUDIT_EMAIL };
/** coEditor's email, lowercased as the procedures store it. */
const EDITOR_EMAIL = "co.editor@example.com";
const NOT_PUBLIC = "September 2026 isn't on the public calendar.";
const ALREADY_PUBLISHED = {
  message: "September 2026 is already published.",
  data: { code: "PRECONDITION_FAILED" },
};
const LOCKED = {
  message: "September 2026 is published. Click Edit month to change it.",
  data: { code: "PRECONDITION_FAILED" },
};

type Client = TRPCClient<typeof usCoTestRouter>;

async function calendarRow(code = calendarCode) {
  return testPrismaClient.calendar.findUniqueOrThrow({
    where: { code },
  });
}

function createMonth(calendarId: string, year: number, month: number) {
  return testPrismaClient.calendarMonth.create({
    data: { calendarId, year, month, revision: 3, ...audit },
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
      startTime: "08:00",
      ...audit,
    },
  });
}

function readMonth(id: string) {
  return testPrismaClient.calendarMonth.findUniqueOrThrow({ where: { id } });
}

function entryCount(monthId: string) {
  return testPrismaClient.calendarEntry.count({ where: { monthId } });
}

function events(monthId: string) {
  return testPrismaClient.calendarMonthStatusEvent.findMany({
    where: { monthId },
    orderBy: [{ createdAt: "asc" }, { revision: "asc" }],
  });
}

function preview(client: Client, monthId: string) {
  return client.Calendar.usCo.paroleBoard.admin.months.publishPreview.query({
    monthId,
  });
}

function publish(client: Client, monthId: string, expectedRevision: number) {
  return client.Calendar.usCo.paroleBoard.admin.months.publish.mutate({
    monthId,
    expectedRevision,
  });
}

function unpublish(client: Client, monthId: string) {
  return client.Calendar.usCo.paroleBoard.admin.months.unpublish.mutate({
    monthId,
  });
}

function addStaffMeeting(client: Client, monthId: string, date: string) {
  return client.Calendar.usCo.paroleBoard.admin.entries.add.mutate({
    monthId,
    date,
    kindCode: "FULL_BOARD",
    resourceId: null,
  });
}

let calendarId: string;
let seeded: SeededCalendar;
let draft: Awaited<ReturnType<typeof createMonth>>;

beforeEach(async () => {
  // Colorado's holiday region, US-CO, puts Labor Day on 2026-09-07.
  calendarId = (await calendarRow()).id;
  seeded = await seedCalendarConfig(
    testPrismaClient,
    calendarId,
    US_CO_TEST_CONFIG,
  );
  draft = await createMonth(calendarId, 2026, 9);
  await createEntry(seeded, draft.id, "2026-09-07", "HEARING", "SITE_A");
  await createEntry(seeded, draft.id, "2026-09-14", "HEARING", "SITE_A");
  await createEntry(seeded, draft.id, "2026-09-14", "HEARING", "SITE_B");
  await createEntry(seeded, draft.id, "2026-09-18", "FULL_BOARD", null);
});

function addSiteBHearing(client: Client, date: string) {
  return client.Calendar.usCo.paroleBoard.admin.entries.add.mutate({
    monthId: draft.id,
    date,
    kindCode: "HEARING",
    resourceId: seeded.resources["SITE_B"].id,
  });
}

describe("Calendar.usCo.paroleBoard.admin.months.publishPreview", () => {
  it("returns the counts, the entries on holidays and the revision", async () => {
    const client = await initUsCoClient(coEditor);

    const result = await preview(client, draft.id);

    expect(result).toEqual({
      monthId: draft.id,
      year: 2026,
      month: 9,
      status: "DRAFT",
      revision: 3,
      counts: { entryDays: 2, entryCount: 3 },
      holidayWarnings: [
        {
          entryId: expect.any(String),
          date: "2026-09-07",
          label: "Site A",
          kind: "HEARING",
          holidayName: "Labor Day",
        },
      ],
      latestPublication: null,
    });
  });

  it("is PRECONDITION_FAILED for a PUBLISHED month", async () => {
    const client = await initUsCoClient(coEditor);
    await publish(client, draft.id, 3);

    await expect(preview(client, draft.id)).rejects.toMatchObject(
      ALREADY_PUBLISHED,
    );
  });

  it("returns the last publish for a month back in draft", async () => {
    const client = await initUsCoClient(coEditor);
    await publish(client, draft.id, 3);
    const [published] = await events(draft.id);
    await unpublish(client, draft.id);

    const result = await preview(client, draft.id);

    expect(result).toMatchObject({
      status: "DRAFT",
      revision: 5,
      latestPublication: {
        publishedAt: published.createdAt,
        publishedByEmail: EDITOR_EMAIL,
      },
    });
  });

  it("is NOT_FOUND for an unknown month", async () => {
    const client = await initUsCoClient(coEditor);

    await expect(preview(client, "no-such-month")).rejects.toMatchObject({
      data: { code: "NOT_FOUND" },
    });
  });
});

describe("Calendar.usCo.paroleBoard.admin.months.publish", () => {
  it("moves a DRAFT month to PUBLISHED and writes a PUBLISHED event", async () => {
    const client = await initUsCoClient(coEditor);

    const result = await publish(client, draft.id, 3);

    expect(result).toMatchObject({
      monthId: draft.id,
      status: "PUBLISHED",
      revision: 4,
    });
    expect(result.month).toMatchObject({
      id: draft.id,
      status: "PUBLISHED",
      revision: 4,
      lastEditedByEmail: EDITOR_EMAIL,
      latestPublication: {
        publishedAt: expect.any(Date),
        publishedByEmail: EDITOR_EMAIL,
      },
      counts: { entryDays: 2, entryCount: 3 },
    });
    expect(result.month.entries).toHaveLength(4);
    expect(await readMonth(draft.id)).toMatchObject({
      status: "PUBLISHED",
      revision: 4,
      updatedByEmail: EDITOR_EMAIL,
    });
    expect(await events(draft.id)).toEqual([
      expect.objectContaining({
        type: "PUBLISHED",
        fromStatus: "DRAFT",
        toStatus: "PUBLISHED",
        revision: 4,
        actorEmail: EDITOR_EMAIL,
      }),
    ]);
  });

  it("publishes a month with no entries", async () => {
    const empty = await createMonth(calendarId, 2026, 10);
    const client = await initUsCoClient(coEditor);

    const result = await publish(client, empty.id, 3);

    expect(result).toMatchObject({ status: "PUBLISHED", revision: 4 });
  });

  it("is CONFLICT for the revision of a preview taken before an edit, and writes nothing", async () => {
    const client = await initUsCoClient(coEditor);
    const { revision } = await preview(client, draft.id);
    await addStaffMeeting(client, draft.id, "2026-09-25");

    await expect(publish(client, draft.id, revision)).rejects.toMatchObject({
      message:
        "September 2026 changed since you opened this review. Check the updated counts and publish again.",
      data: { code: "CONFLICT" },
    });
    expect(await readMonth(draft.id)).toMatchObject({
      status: "DRAFT",
      revision: 4,
    });
    expect(await events(draft.id)).toEqual([]);
  });

  it("is PRECONDITION_FAILED for a PUBLISHED month, and writes nothing", async () => {
    const client = await initUsCoClient(coEditor);
    await publish(client, draft.id, 3);

    await expect(publish(client, draft.id, 4)).rejects.toMatchObject(
      ALREADY_PUBLISHED,
    );
    expect((await readMonth(draft.id)).revision).toBe(4);
    expect(await events(draft.id)).toHaveLength(1);
  });

  describe("holidayPolicy", () => {
    it("publishes entries on holidays under WARN", async () => {
      const client = await initUsCoClient(coEditor);

      await publish(client, draft.id, 3);

      expect((await readMonth(draft.id)).status).toBe("PUBLISHED");
    });

    // Colorado publishes under WARN. The engine's BLOCK refusal is tested
    // with synthetic rules in __tests__/db/services/monthStatus.test.ts.
  });

  it("lets exactly one of a racing publish and add through", async () => {
    const client = await initUsCoClient(coEditor);

    const [published, added] = await Promise.allSettled([
      publish(client, draft.id, 3),
      addStaffMeeting(client, draft.id, "2026-09-25"),
    ]);

    if (published.status === "fulfilled") {
      // The add ran second, found the month PUBLISHED and was refused.
      expect(added).toMatchObject({ status: "rejected", reason: LOCKED });
      expect(await readMonth(draft.id)).toMatchObject({
        status: "PUBLISHED",
        revision: 4,
      });
      expect(await entryCount(draft.id)).toBe(4);
    } else {
      // The publish ran second and failed its revision check.
      expect(added.status).toBe("fulfilled");
      expect(published.reason.data.code).toBe("CONFLICT");
      expect(await readMonth(draft.id)).toMatchObject({
        status: "DRAFT",
        revision: 4,
      });
      expect(await events(draft.id)).toEqual([]);
    }
  });
});

describe("a published month", () => {
  it("refuses entry writes", async () => {
    const client = await initUsCoClient(coEditor);
    await publish(client, draft.id, 3);
    const entry = await testPrismaClient.calendarEntry.findFirstOrThrow({
      where: { monthId: draft.id, date: toDbDate("2026-09-14") },
    });

    await expect(addSiteBHearing(client, "2026-09-21")).rejects.toMatchObject(
      LOCKED,
    );
    await expect(
      client.Calendar.usCo.paroleBoard.admin.entries.delete.mutate({
        entryId: entry.id,
        expectedVersion: entry.version,
      }),
    ).rejects.toMatchObject(LOCKED);
    expect(await readMonth(draft.id)).toMatchObject({
      status: "PUBLISHED",
      revision: 4,
    });
    expect(await entryCount(draft.id)).toBe(4);
  });

  it("takes entry writes again after Edit month", async () => {
    const client = await initUsCoClient(coEditor);
    await publish(client, draft.id, 3);
    await unpublish(client, draft.id);

    const { monthRevision } = await addSiteBHearing(client, "2026-09-21");

    expect(monthRevision).toBe(6);
    expect(await readMonth(draft.id)).toMatchObject({
      status: "DRAFT",
      revision: 6,
    });
  });

  it("is published again with the edits made after Edit month", async () => {
    const client = await initUsCoClient(coEditor);
    await publish(client, draft.id, 3);
    await unpublish(client, draft.id);
    await addSiteBHearing(client, "2026-09-21");
    const review = await preview(client, draft.id);
    expect(review).toMatchObject({
      revision: 6,
      counts: { entryDays: 3, entryCount: 4 },
      latestPublication: { publishedByEmail: EDITOR_EMAIL },
    });

    const result = await publish(client, draft.id, review.revision);

    expect(result).toMatchObject({
      monthId: draft.id,
      status: "PUBLISHED",
      revision: 7,
    });
    expect(result.month).toMatchObject({
      status: "PUBLISHED",
      revision: 7,
      counts: { entryDays: 3, entryCount: 4 },
    });
    expect(await events(draft.id)).toMatchObject([
      { type: "PUBLISHED", fromStatus: "DRAFT", revision: 4 },
      { type: "UNPUBLISHED", fromStatus: "PUBLISHED", revision: 5 },
      { type: "PUBLISHED", fromStatus: "DRAFT", revision: 7 },
    ]);
  });

  it("is CONFLICT to republish a review taken before a later edit", async () => {
    const client = await initUsCoClient(coEditor);
    await publish(client, draft.id, 3);
    await unpublish(client, draft.id);
    const { revision } = await preview(client, draft.id);
    await addSiteBHearing(client, "2026-09-21");

    await expect(publish(client, draft.id, revision)).rejects.toMatchObject({
      data: { code: "CONFLICT" },
    });
    expect(await readMonth(draft.id)).toMatchObject({
      status: "DRAFT",
      revision: 6,
    });
  });
});

describe("Calendar.usCo.paroleBoard.admin.months.unpublish", () => {
  it("moves a PUBLISHED month to DRAFT and writes an UNPUBLISHED event", async () => {
    const client = await initUsCoClient(coEditor);
    await publish(client, draft.id, 3);

    const result = await unpublish(client, draft.id);

    expect(result).toMatchObject({
      monthId: draft.id,
      status: "DRAFT",
      revision: 5,
    });
    expect(result.month).toMatchObject({
      id: draft.id,
      status: "DRAFT",
      revision: 5,
      lastEditedByEmail: EDITOR_EMAIL,
      latestPublication: { publishedByEmail: EDITOR_EMAIL },
    });
    expect(result.month.entries).toHaveLength(4);
    expect(await readMonth(draft.id)).toMatchObject({
      status: "DRAFT",
      revision: 5,
      updatedByEmail: EDITOR_EMAIL,
    });
    expect((await events(draft.id)).at(-1)).toMatchObject({
      type: "UNPUBLISHED",
      fromStatus: "PUBLISHED",
      toStatus: "DRAFT",
      revision: 5,
      actorEmail: EDITOR_EMAIL,
    });
    expect(await entryCount(draft.id)).toBe(4);
  });

  it("is PRECONDITION_FAILED for a month that was never published", async () => {
    const client = await initUsCoClient(coEditor);

    await expect(unpublish(client, draft.id)).rejects.toMatchObject({
      message: NOT_PUBLIC,
      data: { code: "PRECONDITION_FAILED" },
    });
    expect((await readMonth(draft.id)).revision).toBe(3);
    expect(await events(draft.id)).toEqual([]);
  });

  it("is PRECONDITION_FAILED for a month already back in draft", async () => {
    const client = await initUsCoClient(coEditor);
    await publish(client, draft.id, 3);
    await unpublish(client, draft.id);

    await expect(unpublish(client, draft.id)).rejects.toMatchObject({
      message: NOT_PUBLIC,
      data: { code: "PRECONDITION_FAILED" },
    });
    expect((await readMonth(draft.id)).revision).toBe(5);
    expect(await events(draft.id)).toHaveLength(2);
  });

  it("lets only one of two racing Edit months through", async () => {
    const client = await initUsCoClient(coEditor);
    await publish(client, draft.id, 3);

    const results = await Promise.allSettled([
      unpublish(client, draft.id),
      unpublish(client, draft.id),
    ]);

    expect(results.map((r) => r.status).sort()).toEqual([
      "fulfilled",
      "rejected",
    ]);
    expect(results.find((r) => r.status === "rejected")?.reason).toMatchObject({
      data: { code: "PRECONDITION_FAILED" },
    });
    expect((await readMonth(draft.id)).revision).toBe(5);
    expect((await events(draft.id)).map((e) => e.type)).toEqual([
      "PUBLISHED",
      "UNPUBLISHED",
    ]);
  });

  it("is NOT_FOUND for an unknown month", async () => {
    const client = await initUsCoClient(coEditor);

    await expect(unpublish(client, "no-such-month")).rejects.toMatchObject({
      data: { code: "NOT_FOUND" },
    });
  });
});

describe("calendar and state isolation", () => {
  let otherMonth: Awaited<ReturnType<typeof createMonth>>;

  beforeEach(async () => {
    const otherId = (await calendarRow(OTHER_CALENDAR_CODE)).id;
    const otherSeeded = await seedCalendarConfig(
      testPrismaClient,
      otherId,
      US_CO_TEST_CONFIG,
    );
    otherMonth = await createMonth(otherId, 2026, 9);
    await createEntry(
      otherSeeded,
      otherMonth.id,
      "2026-09-14",
      "HEARING",
      "SITE_A",
    );
    // Published through the engine, since Colorado's API serves only the
    // Parole Board calendar, so unpublish has a PUBLISHED month to aim at.
    await publishMonth(
      testPrismaClient,
      await resolveParoleBoardCalendar(OTHER_CALENDAR_CODE),
      {
        monthId: otherMonth.id,
        expectedRevision: 3,
        email: "id-editor@example.com",
      },
    );
  });

  it.each([
    ["publishPreview", (c: Client, id: string) => preview(c, id)],
    ["publish", (c: Client, id: string) => publish(c, id, 4)],
    ["unpublish", (c: Client, id: string) => unpublish(c, id)],
  ])(
    "is NOT_FOUND when a US_CO editor sends another calendar's month to %s",
    async (_name, call) => {
      const before = {
        month: await readMonth(otherMonth.id),
        events: await events(otherMonth.id),
      };
      const client = await initUsCoClient(coEditor);

      await expect(call(client, otherMonth.id)).rejects.toMatchObject({
        data: { code: "NOT_FOUND" },
      });
      expect({
        month: await readMonth(otherMonth.id),
        events: await events(otherMonth.id),
      }).toEqual(before);
    },
  );
});
