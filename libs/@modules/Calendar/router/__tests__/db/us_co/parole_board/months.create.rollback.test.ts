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

import { testPrismaClient } from "../../../setup";
import { seedCalendarConfig } from "../../../setup/seedCalendarConfig";
import { coEditor } from "../../../setup/users";
import {
  initUsCoClient,
  US_CO_TEST_CONFIG,
} from "../../../us_co/parole_board/setup";

const calls = vi.hoisted(() => ({ count: 0 }));

// Fails the second month's write, after the first month's rows are in the
// transaction, so the test shows the first month rolls back too.
vi.mock("../../../../src/services/writeDraftMonth", async (importOriginal) => {
  const original =
    await importOriginal<
      typeof import("../../../../src/services/writeDraftMonth")
    >();
  return {
    writeDraftMonth: (...args: Parameters<typeof original.writeDraftMonth>) => {
      calls.count += 1;
      if (calls.count === 2) throw new Error("write failed");
      return original.writeDraftMonth(...args);
    },
  };
});

describe("Calendar.usCo.paroleBoard.admin.months.create", () => {
  beforeEach(() => {
    calls.count = 0;
    vi.useFakeTimers({
      toFake: ["Date"],
      now: new Date("2026-10-08T18:00:00Z"),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("leaves no months, entries or events when a later month fails", async () => {
    const calendar = await testPrismaClient.calendar.findUniqueOrThrow({
      where: {
        code: "PAROLE_BOARD_PUBLIC",
      },
    });
    await seedCalendarConfig(testPrismaClient, calendar.id, US_CO_TEST_CONFIG);
    const client = await initUsCoClient(coEditor);

    await expect(
      client.Calendar.usCo.paroleBoard.admin.months.create.mutate({
        months: [
          { year: 2026, month: 10 },
          { year: 2026, month: 11 },
        ],
      }),
    ).rejects.toMatchObject({ data: { code: "INTERNAL_SERVER_ERROR" } });

    expect(calls.count).toBe(2);
    expect(
      await Promise.all([
        testPrismaClient.calendarMonth.count(),
        testPrismaClient.calendarEntry.count(),
        testPrismaClient.calendarMonthStatusEvent.count(),
      ]),
    ).toEqual([0, 0, 0]);
  });
});
