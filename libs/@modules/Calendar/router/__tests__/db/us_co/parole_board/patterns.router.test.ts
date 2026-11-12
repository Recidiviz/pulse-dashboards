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

import * as Sentry from "@sentry/node";

import { testPrismaClient } from "../../../setup";
import { AUDIT_EMAIL } from "../../../setup/fixtures";
import {
  seedCalendarConfig,
  SeededCalendar,
} from "../../../setup/seedCalendarConfig";
import { coEditor } from "../../../setup/users";
import {
  initUsCoClient,
  paroleBoardCalendarId,
  US_CO_TEST_CONFIG,
} from "../../../us_co/parole_board/setup";

vi.mock("@sentry/node", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@sentry/node")>()),
  captureMessage: vi.fn(),
}));

describe("Calendar.usCo.paroleBoard.admin.patterns.listCurrent", () => {
  let calendarId: string;
  let seeded: SeededCalendar;

  beforeEach(async () => {
    calendarId = await paroleBoardCalendarId();
    seeded = await seedCalendarConfig(
      testPrismaClient,
      calendarId,
      US_CO_TEST_CONFIG,
    );
  });

  function addVersion(
    slotKey: string,
    version: number,
    rules: unknown,
    kindCode = "HEARING",
    resourceCode: string | null = "SITE_A",
  ) {
    return testPrismaClient.calendarEntryPattern.create({
      data: {
        calendarId,
        kindId: seeded.kinds[kindCode].id,
        resourceId: resourceCode ? seeded.resources[resourceCode].id : null,
        slotKey,
        version,
        rules: rules as object,
        startTime: "10:00",
        createdByEmail: "editor-1@example.com",
      },
    });
  }

  it("returns one row per slot, in kind and then resource sortOrder", async () => {
    const client = await initUsCoClient(coEditor);

    const rows =
      await client.Calendar.usCo.paroleBoard.admin.patterns.listCurrent.query();

    expect(rows).toEqual([
      {
        slotKey: "HEARING:SITE_A",
        kind: { code: "HEARING", label: "Hearing" },
        resource: {
          id: seeded.resources["SITE_A"].id,
          code: "SITE_A",
          label: "Site A",
          typeCode: "SITE",
          sortOrder: 10,
        },
        pattern: {
          id: seeded.patterns["HEARING:SITE_A"].id,
          version: 1,
          rules: [{ type: "weekOfMonth", week: 1, weekday: "MONDAY" }],
          startTime: "08:00",
          endTime: null,
          createdAt: expect.any(Date),
          createdByEmail: AUDIT_EMAIL,
        },
      },
      expect.objectContaining({ slotKey: "HEARING:SITE_B" }),
      expect.objectContaining({
        slotKey: "FULL_BOARD",
        kind: { code: "FULL_BOARD", label: "Full Board" },
        resource: null,
        pattern: expect.objectContaining({
          rules: [{ type: "everyWeekday", weekday: "FRIDAY" }],
        }),
      }),
      expect.objectContaining({
        slotKey: "BUSINESS_MEETING",
        kind: { code: "BUSINESS_MEETING", label: "Business Mtg" },
        resource: null,
        pattern: expect.objectContaining({
          rules: [{ type: "weekOfMonth", week: 3, weekday: "FRIDAY" }],
        }),
      }),
    ]);
  });

  it("returns a slot's highest version", async () => {
    const v2 = await addVersion("HEARING:SITE_A", 2, [
      { type: "weekOfMonth", week: 2, weekday: "MONDAY" },
    ]);
    const client = await initUsCoClient(coEditor);

    const rows =
      await client.Calendar.usCo.paroleBoard.admin.patterns.listCurrent.query();

    expect(rows[0].pattern).toMatchObject({
      id: v2.id,
      version: 2,
      rules: [{ type: "weekOfMonth", week: 2, weekday: "MONDAY" }],
      startTime: "10:00",
      createdByEmail: "editor-1@example.com",
    });
  });

  it("returns null for a slot with no pattern", async () => {
    await testPrismaClient.calendarEntryPattern.delete({
      where: { id: seeded.patterns["BUSINESS_MEETING"].id },
    });
    const client = await initUsCoClient(coEditor);

    const rows =
      await client.Calendar.usCo.paroleBoard.admin.patterns.listCurrent.query();

    expect(rows.at(-1)).toEqual({
      slotKey: "BUSINESS_MEETING",
      kind: { code: "BUSINESS_MEETING", label: "Business Mtg" },
      resource: null,
      pattern: null,
    });
  });

  it("leaves out an inactive resource's slot", async () => {
    await testPrismaClient.calendarResource.update({
      where: { id: seeded.resources["SITE_B"].id },
      data: { isActive: false },
    });
    const client = await initUsCoClient(coEditor);

    const rows =
      await client.Calendar.usCo.paroleBoard.admin.patterns.listCurrent.query();

    expect(rows.map((row) => row.slotKey)).toEqual([
      "HEARING:SITE_A",
      "FULL_BOARD",
      "BUSINESS_MEETING",
    ]);
  });

  it("is INTERNAL_SERVER_ERROR and reports only the pattern id when stored rules are invalid", async () => {
    const bad = await addVersion("HEARING:SITE_A", 2, [
      { type: "weekOfMonth", week: 5, weekday: "MONDAY" },
    ]);
    const client = await initUsCoClient(coEditor);

    await expect(
      client.Calendar.usCo.paroleBoard.admin.patterns.listCurrent.query(),
    ).rejects.toMatchObject({ data: { code: "INTERNAL_SERVER_ERROR" } });

    expect(Sentry.captureMessage).toHaveBeenCalledWith(
      `Stored calendar pattern ${bad.id} has invalid rules`,
      { level: "error", tags: { calendarPatternId: bad.id } },
    );
  });
});
