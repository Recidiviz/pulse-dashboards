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

import { toDbDate } from "../../src/db/dates";
import { testCalendarConfig } from "./calendarConfig";

export const AUDIT_EMAIL = "calendar-tests@example.com";

/** The code of the second calendar insertFixtures adds. */
export const OTHER_CALENDAR_CODE = "OTHER_CALENDAR";

const audit = { createdByEmail: AUDIT_EMAIL, updatedByEmail: AUDIT_EMAIL };

type CreateData<Delegate extends { create: (args: never) => unknown }> =
  Parameters<Delegate["create"]>[0] extends { data: infer Data } ? Data : never;

/** Insert columns that take foreign keys as plain ids. */
export type CalendarEntryInput = Extract<
  CreateData<CalendarPrismaClient["calendarEntry"]>,
  { monthId: string }
>;
export type CalendarEntryPatternInput = Extract<
  CreateData<CalendarPrismaClient["calendarEntryPattern"]>,
  { calendarId: string }
>;
export type CalendarInput = CreateData<CalendarPrismaClient["calendar"]>;

/** The columns a Calendar insert needs, so a test can drop or override one. */
export function calendarData(code: string): CalendarInput {
  return {
    code,
    name: "Demo calendar",
    ...audit,
  };
}

/**
 * Creates a synthetic calendar for the database tests: one resource type, one
 * resource, a SESSION kind for entries at a resource, two meeting kinds and
 * the September 2026 month. It mirrors the shapes a real calendar uses without
 * any state's configuration.
 */
export async function createDemoCalendar(
  prisma: CalendarPrismaClient,
  code = "DEMO_CALENDAR",
) {
  const calendar = await prisma.calendar.create({
    data: calendarData(code),
  });
  const calendarId = calendar.id;

  const site = await prisma.calendarResourceType.create({
    data: { calendarId, code: "SITE", label: "Site", sortOrder: 1 },
  });
  const siteA = await prisma.calendarResource.create({
    data: {
      calendarId,
      typeId: site.id,
      code: "SITE_A",
      label: "Site A",
      sortOrder: 1,
      ...audit,
    },
  });

  // Created out of sortOrder, so a read that ignores sortOrder shows it.
  const planning = await prisma.calendarEntryKind.create({
    data: {
      calendarId,
      code: "PLANNING",
      label: "Planning",
      sortOrder: 3,
    },
  });
  const session = await prisma.calendarEntryKind.create({
    data: {
      calendarId,
      code: "SESSION",
      label: "Session",
      sortOrder: 1,
    },
  });
  const allHands = await prisma.calendarEntryKind.create({
    data: {
      calendarId,
      code: "ALL_HANDS",
      label: "All hands",
      sortOrder: 2,
    },
  });

  const month = await prisma.calendarMonth.create({
    data: { calendarId, year: 2026, month: 9, ...audit },
  });

  return {
    calendar,
    resource: siteA,
    kinds: { session, allHands, planning },
    month,
  };
}

export type DemoCalendar = Awaited<ReturnType<typeof createDemoCalendar>>;

/** The columns of a SESSION entry at SITE_A on 2026-09-01, for a test to override. */
export function sessionEntryData(demo: DemoCalendar): CalendarEntryInput {
  return {
    calendarId: demo.calendar.id,
    monthId: demo.month.id,
    date: toDbDate("2026-09-01"),
    kindId: demo.kinds.session.id,
    resourceId: demo.resource.id,
    slotKey: "SESSION:SITE_A",
    source: "PATTERN",
    startTime: "08:00",
    ...audit,
  };
}

/** The columns of an ALL_HANDS entry on 2026-09-04, a Friday, for a test to override. */
export function allHandsEntryData(demo: DemoCalendar): CalendarEntryInput {
  return {
    calendarId: demo.calendar.id,
    monthId: demo.month.id,
    date: toDbDate("2026-09-04"),
    kindId: demo.kinds.allHands.id,
    resourceId: null,
    slotKey: "ALL_HANDS",
    source: "MANUAL",
    ...audit,
  };
}

/** The columns of a version 1 SESSION pattern at SITE_A, for a test to override. */
export function sessionPatternData(
  demo: DemoCalendar,
): CalendarEntryPatternInput {
  return {
    calendarId: demo.calendar.id,
    kindId: demo.kinds.session.id,
    resourceId: demo.resource.id,
    slotKey: "SESSION:SITE_A",
    version: 1,
    rules: [{ type: "weekOfMonth", week: 1, weekday: "MONDAY" }],
    startTime: "08:00",
    createdByEmail: AUDIT_EMAIL,
  };
}

/**
 * Asserts that a write fails on the named database constraint, so a test
 * can't pass because a different check rejected the row.
 */
export async function expectConstraintError(
  write: Promise<unknown>,
  constraint: string,
): Promise<void> {
  await expect(write).rejects.toThrow(constraint);
}

/** Asserts that a write fails on a unique key (Prisma's P2002). */
export async function expectUniqueError(
  write: Promise<unknown>,
): Promise<void> {
  await expect(write).rejects.toMatchObject({ code: "P2002" });
}

/**
 * Inserts the Calendar rows the procedure tests resolve: the test calendar,
 * and another calendar in the same database, for the tests that a request
 * never reaches another calendar's rows.
 */
export async function insertFixtures(prisma: CalendarPrismaClient) {
  const { code, name } = testCalendarConfig.calendar;
  const testCalendar = await prisma.calendar.create({
    data: { code, name, ...audit },
  });
  const otherCalendar = await prisma.calendar.create({
    data: { code: OTHER_CALENDAR_CODE, name: "Other test calendar", ...audit },
  });
  return { testCalendar, otherCalendar };
}
