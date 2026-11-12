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

import {
  duplicateEntryError,
  entryNotFoundError,
  entryVersionConflictError,
  monthChangedError,
  monthNotFoundError,
  monthPublishedError,
} from "../calendar.errors";
import { isPrismaErrorCode } from "../errors";
import type { ResolvedCalendar } from "../procedures";
import type { MonthDetail, MonthStatus } from "../types";
import { getMonth } from "./reads";

/** The month an entry mutation writes to, and who is writing. */
export interface MonthMutationTarget<Kind extends string = string> {
  /** The calendar the state's procedure resolved. The month must belong to it. */
  calendar: ResolvedCalendar<Kind>;
  monthId: string;
  /** The caller's lowercased email, for the month's updatedByEmail. */
  email: string;
}

/**
 * Runs an entry write in one transaction with the month's revision bump.
 * Only a DRAFT month takes entry writes: a PUBLISHED month is locked until an
 * editor moves it back to DRAFT with Edit month. This is the server's
 * check; the admin's read-only view of a published month is only UX.
 *
 * It first bumps the month's revision and sets its updatedByEmail, guarded on
 * the month being in this calendar and DRAFT, then runs fn. When the guard
 * matches no row it reads the month again and throws monthNotFoundError for a
 * missing month, monthPublishedError for a PUBLISHED one, and
 * monthChangedError otherwise, without running fn.
 *
 * The guarded update locks the month row before fn touches any entry row.
 * months.publish and months.unpublish must also update the month row before
 * reading entries, so an edit and a status change can't deadlock. An edit
 * that waits on a publish's lock sees the PUBLISHED month once the publish
 * commits and is rejected; a publish that waits on an edit's lock fails its
 * revision guard.
 *
 * Any error rolls back both writes; pass it to classifyEntryMutationError.
 *
 * Returns fn's result, the month's revision after the bump, and the month as
 * getMonth reads it after fn, in the same transaction, so the services can
 * return the month the write produced.
 */
export async function runMonthMutation<T, Kind extends string>(
  prisma: CalendarPrismaClient,
  { calendar, monthId, email }: MonthMutationTarget<Kind>,
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<{ result: T; monthRevision: number; month: MonthDetail<Kind> }> {
  return prisma.$transaction(async (tx) => {
    const [bumped] = await tx.calendarMonth.updateManyAndReturn({
      where: { id: monthId, calendarId: calendar.id, status: "DRAFT" },
      data: { revision: { increment: 1 }, updatedByEmail: email },
      select: { revision: true, year: true, month: true },
    });
    if (!bumped) {
      const month = await tx.calendarMonth.findFirst({
        where: { id: monthId, calendarId: calendar.id },
        select: { year: true, month: true, status: true },
      });
      if (!month) throw monthNotFoundError();
      if (month.status === "PUBLISHED") {
        throw monthPublishedError(month.year, month.month);
      }
      throw monthChangedError();
    }
    const result = await fn(tx);
    const month = await getMonth(tx, calendar, bumped);
    // The bump locked the month row, so it can't be gone yet.
    if (!month) throw monthNotFoundError();
    return { result, monthRevision: bumped.revision, month };
  });
}

/**
 * Throws monthPublishedError when a month read before the write is PUBLISHED.
 * Services call it before their own checks and any no-op shortcut, so a write
 * to a published month always gets the same answer; runMonthMutation's guard
 * still covers a publish that lands after this read.
 */
export function assertMonthIsDraft(month: {
  year: number;
  month: number;
  status: MonthStatus;
}): void {
  if (month.status === "PUBLISHED") {
    throw monthPublishedError(month.year, month.month);
  }
}

/** What classifyEntryMutationError needs to name the failure. */
export interface EntryMutationErrorContext {
  calendarId: string;
  monthId: string;
  /** The entry the write targeted, for every mutation but add. */
  entryId?: string;
  /** The new entry's label and date, for add's duplicate message. */
  duplicate?: { label: string; date: string };
}

/**
 * Whether e is the unique key violation on an entry's (monthId, date,
 * slotKey), CalendarEntry_monthId_date_slotKey_key. CalendarEntry has no other
 * unique key a write can hit, since ids are generated.
 */
function isEntrySlotConflict(e: unknown): boolean {
  return (
    isPrismaErrorCode(e, "P2002") && e.meta?.["modelName"] === "CalendarEntry"
  );
}

/**
 * Turns an error from an entry mutation into a NOT_FOUND or CONFLICT tRPC
 * error, after the transaction has rolled back. It reads the month and entry
 * again outside the transaction, because Postgres refuses further statements
 * in a transaction after one fails.
 *
 * - A TRPCError is rethrown as it is.
 * - A duplicate (month, date, slotKey) is CONFLICT naming the entry and day.
 * - P2025 means a guarded write matched no row. A missing month is NOT_FOUND,
 *   a missing entry is NOT_FOUND, and an entry that is still there changed
 *   version, so CONFLICT. A month that is still there with no entry to check
 *   changed between the write and the read, so it's a CONFLICT the user can
 *   retry.
 * - Anything else is rethrown unchanged, so Sentry's tRPC middleware reports
 *   it instead of the user seeing a misleading CONFLICT.
 */
export async function classifyEntryMutationError(
  prisma: Pick<CalendarPrismaClient, "calendarMonth" | "calendarEntry">,
  e: unknown,
  { calendarId, monthId, entryId, duplicate }: EntryMutationErrorContext,
): Promise<never> {
  if (e instanceof TRPCError) throw e;

  if (duplicate && isEntrySlotConflict(e)) {
    throw duplicateEntryError(duplicate.label, duplicate.date);
  }

  if (isPrismaErrorCode(e, "P2025")) {
    const month = await prisma.calendarMonth.findFirst({
      where: { id: monthId, calendarId },
      select: { id: true },
    });
    if (!month) throw monthNotFoundError();
    if (entryId) {
      const entry = await prisma.calendarEntry.findFirst({
        where: { id: entryId, monthId },
        select: { id: true },
      });
      throw entry ? entryVersionConflictError() : entryNotFoundError();
    }
    throw monthChangedError();
  }

  throw e;
}
