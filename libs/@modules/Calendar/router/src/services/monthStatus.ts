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

import { TRPCError } from "@trpc/server";

import type { CalendarPrismaClient, Prisma } from "~@modules/Calendar/prisma";
import type { IsoDate } from "~@modules/Calendar/rules";

import {
  holidayBlockedError,
  HolidayEntry,
  monthAlreadyPublishedError,
  monthNotFoundError,
  monthNotPublicError,
  monthStatusChangedError,
  publishFailedError,
  publishRevisionConflictError,
  unpublishFailedError,
} from "../calendar.errors";
import { fromDbDate } from "../db/dates";
import { isPrismaErrorCode } from "../errors";
import type { ResolvedCalendar } from "../procedures";
import type {
  MonthDetail,
  PublishPreview,
  PublishResult,
  UnpublishResult,
} from "../types";
import {
  compareEntries,
  computeMonthCounts,
  entryInclude,
  entryLabel,
  getHolidaysInMonth,
  kindOf,
  kindsById,
  latestPublishedEventInclude,
} from "./helpers";
import { getMonth } from "./reads";

/** The month and the caller a status change acts on. */
export interface StatusChangeTarget {
  monthId: string;
  /** The caller's lowercased email, for the audit columns. */
  email: string;
}

/**
 * The month as getMonth reads it inside a status change's transaction, after
 * the status event, so it carries the new status, revision and
 * latestPublication.
 */
async function readMonthAfterStatusChange<Kind extends string>(
  tx: Prisma.TransactionClient,
  calendar: ResolvedCalendar<Kind>,
  month: { year: number; month: number },
): Promise<MonthDetail<Kind>> {
  const detail = await getMonth(tx, calendar, month);
  // The guarded update locked the month row, so it can't be gone yet.
  if (!detail) throw monthNotFoundError();
  return detail;
}

/** An entry whose date is a holiday, with the entry's id. */
export type HolidayWarning<Kind extends string = string> = HolidayEntry & {
  entryId: string;
  kind: Kind;
};

/**
 * Returns the entries that aren't cancelled and whose date is a holiday, in
 * the order given. Preview's holidayWarnings and publish's BLOCK check both
 * use it, so the warnings and the refusal always name the same entries.
 */
export function findHolidayEntries<Kind extends string>(
  entries: {
    id: string;
    date: Date;
    cancelledAt: Date | null;
    kind: { code: Kind; label: string };
    resource: { label: string } | null;
  }[],
  holidays: Map<IsoDate, string>,
): HolidayWarning<Kind>[] {
  return entries.flatMap((entry) => {
    const date = fromDbDate(entry.date);
    const holidayName = holidays.get(date);
    return entry.cancelledAt !== null || holidayName === undefined
      ? []
      : [
          {
            entryId: entry.id,
            date,
            label: entryLabel(entry),
            kind: entry.kind.code,
            holidayName,
          },
        ];
  });
}

/**
 * The publish review of a DRAFT month: its counts, the entries on holidays,
 * and the revision to send back to publish as expectedRevision. Holidays warn
 * here under either holidayPolicy. latestPublication is set for a
 * month that was published and then moved back to DRAFT with Edit month. A
 * PUBLISHED month is PRECONDITION_FAILED, as publish is.
 */
export async function getPublishPreview<Kind extends string>(
  prisma: Pick<CalendarPrismaClient, "calendarMonth">,
  calendar: ResolvedCalendar<Kind>,
  monthId: string,
): Promise<PublishPreview<Kind>> {
  const row = await prisma.calendarMonth.findFirst({
    where: { id: monthId, calendarId: calendar.id },
    include: {
      ...latestPublishedEventInclude,
      entries: { include: entryInclude },
    },
  });
  if (!row) throw monthNotFoundError();

  const { year, month } = row;
  if (row.status === "PUBLISHED") {
    throw monthAlreadyPublishedError(year, month);
  }
  const kinds = kindsById(calendar.kinds);
  const holidays = getHolidaysInMonth(calendar.rules.settings, { year, month });
  const entries = row.entries
    .map((entry) => ({ ...entry, kind: kindOf(kinds, entry.kindId) }))
    .sort(compareEntries);
  const [latest] = row.statusEvents;
  return {
    monthId: row.id,
    year,
    month,
    status: "DRAFT",
    revision: row.revision,
    counts: computeMonthCounts(entries, kinds),
    holidayWarnings: findHolidayEntries(entries, holidays),
    latestPublication: latest
      ? { publishedAt: latest.createdAt, publishedByEmail: latest.actorEmail }
      : null,
  };
}

/** Reads a month in the caller's calendar for an error message, or null. */
function findMonth(
  prisma: Pick<CalendarPrismaClient, "calendarMonth">,
  calendarId: string,
  monthId: string,
) {
  return prisma.calendarMonth.findFirst({
    where: { id: monthId, calendarId },
    select: { year: true, month: true, status: true, revision: true },
  });
}

/**
 * Under holidayPolicy BLOCK, throws holidayBlockedError when any of the
 * month's entries falls on a holiday. It reads the entries in tx, after
 * publish has locked the month, so it checks exactly the entries that go
 * public. holidays are the month's, from getHolidaysInMonth.
 */
async function assertNoBlockedHolidays(
  tx: Prisma.TransactionClient,
  calendar: ResolvedCalendar,
  { monthId, year, month }: { monthId: string; year: number; month: number },
  holidays: Map<IsoDate, string>,
): Promise<void> {
  if (calendar.rules.settings.holidayPolicy !== "BLOCK") return;
  const kinds = kindsById(calendar.kinds);
  // Sorted so the message names entries in calendar order.
  const entries = (
    await tx.calendarEntry.findMany({
      where: { monthId },
      include: { resource: true },
    })
  )
    .map((entry) => ({ ...entry, kind: kindOf(kinds, entry.kindId) }))
    .sort(compareEntries);
  const onHolidays = findHolidayEntries(entries, holidays);
  if (onHolidays.length > 0) {
    throw holidayBlockedError(year, month, onHolidays);
  }
}

/**
 * Publishes a DRAFT month whose revision is expectedRevision. It moves
 * the month to PUBLISHED, adds 1 to its revision and writes a PUBLISHED
 * status event with the caller's email, in one transaction. From then on the
 * public calendar serves the month's entries as they are, and the month is
 * locked: every entry write is PRECONDITION_FAILED until an editor moves it
 * back to DRAFT with Edit month. It returns the published month, read in the
 * same transaction, with its new revision and latestPublication.
 *
 * The guarded month update runs first, the same lock order every entry write
 * uses. An entry write that waits on that lock runs after publish commits,
 * finds the month PUBLISHED and is rejected; a publish that waits on an entry
 * write's lock fails its revision guard. So a month never goes public with
 * entries the editor didn't review.
 *
 * Throws NOT_FOUND for a month outside the caller's calendar,
 * PRECONDITION_FAILED for a month that is already PUBLISHED or, under
 * holidayPolicy BLOCK, has entries on holidays, CONFLICT for a stale
 * expectedRevision, and INTERNAL_SERVER_ERROR with the PRD copy for anything
 * else. A calendar whose holidayRegion no source covers gets
 * getHolidaysInMonth's INTERNAL_SERVER_ERROR, as every other procedure that
 * reads holidays does. None of them writes anything.
 */
export async function publishMonth<Kind extends string>(
  prisma: CalendarPrismaClient,
  calendar: ResolvedCalendar<Kind>,
  {
    monthId,
    email,
    expectedRevision,
  }: StatusChangeTarget & { expectedRevision: number },
): Promise<PublishResult<Kind>> {
  const before = await findMonth(prisma, calendar.id, monthId);
  if (!before) throw monthNotFoundError();
  const { year, month } = before;
  if (before.status === "PUBLISHED") {
    throw monthAlreadyPublishedError(year, month);
  }
  if (before.revision !== expectedRevision) {
    throw publishRevisionConflictError(year, month);
  }
  const holidays = getHolidaysInMonth(calendar.rules.settings, { year, month });

  try {
    const { revision, detail } = await prisma.$transaction(async (tx) => {
      const updated = await tx.calendarMonth.update({
        where: {
          id: monthId,
          calendarId: calendar.id,
          status: "DRAFT",
          revision: expectedRevision,
        },
        data: {
          status: "PUBLISHED",
          revision: { increment: 1 },
          updatedByEmail: email,
        },
        select: { revision: true },
      });
      await assertNoBlockedHolidays(
        tx,
        calendar,
        { monthId, year, month },
        holidays,
      );
      await tx.calendarMonthStatusEvent.create({
        data: {
          monthId,
          type: "PUBLISHED",
          fromStatus: "DRAFT",
          toStatus: "PUBLISHED",
          revision: updated.revision,
          actorEmail: email,
        },
      });
      return {
        revision: updated.revision,
        detail: await readMonthAfterStatusChange(tx, calendar, before),
      };
    });

    // Ids only: no emails in logs.
    console.info("Calendar month published", { monthId, revision });
    return { monthId, status: "PUBLISHED", revision, month: detail };
  } catch (e) {
    if (e instanceof TRPCError) throw e;
    if (isPrismaErrorCode(e, "P2025")) {
      // The guarded update matched no row: the month changed after the
      // checks above. Read it again to say how.
      const after = await findMonth(prisma, calendar.id, monthId);
      if (!after) throw monthNotFoundError();
      // Another editor published it first.
      if (after.status === "PUBLISHED") {
        throw monthAlreadyPublishedError(year, month);
      }
      throw publishRevisionConflictError(year, month);
    }
    throw publishFailedError(year, month, e);
  }
}

/**
 * The editor's Edit month: moves a PUBLISHED month back to DRAFT, adds
 * 1 to its revision and writes an UNPUBLISHED status event, in one
 * transaction. That takes the month off the public calendar and unlocks its
 * entries until its next publish. Like publish, it runs on
 * calendarEditorProcedure, records the caller's email and returns the month
 * as it reads in the same transaction.
 *
 * Throws NOT_FOUND for a month outside the caller's calendar,
 * PRECONDITION_FAILED for a month that isn't PUBLISHED, including one that a
 * concurrent Edit month moved to DRAFT between the read and the write,
 * CONFLICT for a month that left PUBLISHED and was published again in that
 * window, and INTERNAL_SERVER_ERROR for anything else. None of them writes
 * anything.
 */
export async function unpublishMonth<Kind extends string>(
  prisma: CalendarPrismaClient,
  calendar: ResolvedCalendar<Kind>,
  { monthId, email }: StatusChangeTarget,
): Promise<UnpublishResult<Kind>> {
  const before = await findMonth(prisma, calendar.id, monthId);
  if (!before) throw monthNotFoundError();
  if (before.status !== "PUBLISHED") {
    throw monthNotPublicError(before.year, before.month);
  }

  try {
    const { revision, detail } = await prisma.$transaction(async (tx) => {
      const updated = await tx.calendarMonth.update({
        where: { id: monthId, calendarId: calendar.id, status: "PUBLISHED" },
        data: {
          status: "DRAFT",
          revision: { increment: 1 },
          updatedByEmail: email,
        },
        select: { revision: true },
      });
      await tx.calendarMonthStatusEvent.create({
        data: {
          monthId,
          type: "UNPUBLISHED",
          fromStatus: "PUBLISHED",
          toStatus: "DRAFT",
          revision: updated.revision,
          actorEmail: email,
        },
      });
      return {
        revision: updated.revision,
        detail: await readMonthAfterStatusChange(tx, calendar, before),
      };
    });

    // Ids only: no emails in logs.
    console.info("Calendar month unpublished", { monthId, revision });
    return { monthId, status: "DRAFT", revision, month: detail };
  } catch (e) {
    if (!isPrismaErrorCode(e, "P2025")) {
      throw unpublishFailedError(before.year, before.month, e);
    }
    // The guarded update matched no row: the month changed after the check
    // above. Read it again to say how.
    const after = await findMonth(prisma, calendar.id, monthId);
    if (!after) throw monthNotFoundError();
    if (after.status !== "PUBLISHED") {
      throw monthNotPublicError(after.year, after.month);
    }
    throw monthStatusChangedError(after.year, after.month);
  }
}
