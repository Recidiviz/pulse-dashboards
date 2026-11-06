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

import { getPrismaClient } from "~@modules/Calendar/prisma";

import {
  CalendarNotFoundError,
  findCalendarByCode,
} from "../../src/db/calendar";
import { createDemoCalendar } from "../setup/fixtures";
import { resetCalendarTables } from "../setup/resetCalendarTables";

const prisma = getPrismaClient("US_CO");

beforeEach(async () => {
  await resetCalendarTables(prisma);
  await createDemoCalendar(prisma, "DEMO_CALENDAR");
});

afterAll(async () => {
  await prisma.$disconnect();
});

test("returns the calendar with its kinds in sortOrder", async () => {
  const calendar = await findCalendarByCode(prisma, "DEMO_CALENDAR");

  expect(calendar).toMatchObject({
    code: "DEMO_CALENDAR",
    name: "Demo calendar",
  });
  expect(calendar.kinds.map((kind) => kind.code)).toEqual([
    "SESSION",
    "ALL_HANDS",
    "PLANNING",
  ]);
  expect(calendar.resourceTypes.map((type) => type.code)).toEqual(["SITE"]);
});

test("picks the calendar with the requested code when there are two", async () => {
  await createDemoCalendar(prisma, "OTHER_CALENDAR");

  const calendar = await findCalendarByCode(prisma, "OTHER_CALENDAR");

  expect(calendar.code).toBe("OTHER_CALENDAR");
});

test("throws CalendarNotFoundError for an unknown code", async () => {
  await expect(findCalendarByCode(prisma, "NO_SUCH_CALENDAR")).rejects.toThrow(
    CalendarNotFoundError,
  );
});
