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

import type { CalendarPrismaClient } from "~@modules/Calendar/prisma";
import { Prisma } from "~@modules/Calendar/prisma";

import { createMonths } from "../../../../src/services/createMonths";
import { testPrismaClient } from "../../../setup";
import { AUDIT_EMAIL } from "../../../setup/fixtures";
import { seedCalendarConfig } from "../../../setup/seedCalendarConfig";
import {
  resolveParoleBoardCalendar,
  US_CO_TEST_CONFIG,
} from "../../../us_co/parole_board/setup";

// Kept in its own file, so the insert this test makes fail inside the
// transaction can't affect another test's database connection.

const october = { year: 2026, month: 10 };

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"], now: new Date("2026-10-08T18:00:00Z") });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("createMonths when another editor creates the month first", () => {
  it("is CONFLICT and leaves the other editor's month", async () => {
    const { id } = await testPrismaClient.calendar.findUniqueOrThrow({
      where: {
        code: "PAROLE_BOARD_PUBLIC",
      },
    });
    await seedCalendarConfig(testPrismaClient, id, US_CO_TEST_CONFIG);
    // Read after seeding, so calendar.kinds includes the kinds the patterns use.
    const calendar = await resolveParoleBoardCalendar();
    await testPrismaClient.calendarMonth.create({
      data: {
        calendarId: id,
        ...october,
        createdByEmail: AUDIT_EMAIL,
        updatedByEmail: AUDIT_EMAIL,
      },
    });
    // The existence check sees no month, as it would if another editor's
    // create committed just after it. The writes use the real client.
    const racing = {
      calendarMonth: { findMany: async () => [] },
      calendarEntryPattern: testPrismaClient.calendarEntryPattern,
      calendarResource: testPrismaClient.calendarResource,
      $transaction: testPrismaClient.$transaction.bind(testPrismaClient),
    } as unknown as CalendarPrismaClient;

    await expect(
      createMonths(racing, calendar, "editor-1@example.com", [october]),
    ).rejects.toMatchObject({
      code: "CONFLICT",
      message:
        "One of these months was just created by someone else. Refresh and try again.",
    });
    expect(await testPrismaClient.calendarMonth.count()).toBe(1);
  });
});

describe("createMonths when a drafted entry repeats a slot", () => {
  it("fails with the database's own error, not CONFLICT", async () => {
    const { id } = await testPrismaClient.calendar.findUniqueOrThrow({
      where: {
        code: "PAROLE_BOARD_PUBLIC",
      },
    });
    await seedCalendarConfig(testPrismaClient, id, US_CO_TEST_CONFIG);
    const calendar = await resolveParoleBoardCalendar();
    // Each transaction writes its first entry twice, which breaks the
    // (monthId, date, slotKey) key inside the draft write.
    const duplicating = {
      calendarMonth: testPrismaClient.calendarMonth,
      calendarEntryPattern: testPrismaClient.calendarEntryPattern,
      calendarResource: testPrismaClient.calendarResource,
      $transaction: (write: (tx: unknown) => Promise<unknown>) =>
        testPrismaClient.$transaction((tx) =>
          write({
            calendarMonth: tx.calendarMonth,
            calendarMonthStatusEvent: tx.calendarMonthStatusEvent,
            calendarEntry: {
              createMany: ({
                data,
              }: {
                data: Prisma.CalendarEntryCreateManyInput[];
              }) => tx.calendarEntry.createMany({ data: [...data, data[0]] }),
            },
          }),
        ),
    } as unknown as CalendarPrismaClient;

    const result = createMonths(duplicating, calendar, "editor-1@example.com", [
      october,
    ]);

    await expect(result).rejects.toBeInstanceOf(
      Prisma.PrismaClientKnownRequestError,
    );
    await expect(result).rejects.toMatchObject({ code: "P2002" });
    expect(await testPrismaClient.calendarMonth.count()).toBe(0);
  });
});
