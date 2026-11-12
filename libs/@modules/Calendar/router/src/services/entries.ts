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
import assertNever from "assert-never";

import type { CalendarPrismaClient } from "~@modules/Calendar/prisma";
import {
  assertCancellable,
  assertEntryShape,
  entrySlotKey,
  InvalidEntryError,
  isDateInMonth,
  weekdayOf,
} from "~@modules/Calendar/rules";

import {
  dateOutsideMonthError,
  duplicateEntryError,
  entriesInSeveralMonthsError,
  entryNotCancellableError,
  entryNotDeletableError,
  entryNotFoundError,
  entryVersionConflictError,
  monthNotFoundError,
  weekdayNotAllowedError,
} from "../calendar.errors";
import { fromDbDate, toDbDate } from "../db/dates";
import { isPrismaErrorCode } from "../errors";
import type { ResolvedCalendar } from "../procedures";
import type {
  DeleteEntryResult,
  EntryDto,
  EntryMutationResult,
  MonthDetail,
  MoveEntriesResult,
} from "../types";
import {
  assertMonthIsDraft,
  classifyEntryMutationError,
  runMonthMutation,
} from "./entryMutations";
import { entryInclude, entryLabel, kindOf, kindsById } from "./helpers";
import { getMonth } from "./reads";

/**
 * The entry with entryId in the month runMonthMutation read back after the
 * write. That read shares the write's transaction, so a missing entry is a
 * bug. This throws rather than build the entry another way, though the write
 * has already committed by then.
 */
function entryInMonth<Kind extends string>(
  month: MonthDetail<Kind>,
  entryId: string,
): EntryDto<Kind> {
  const entry = month.entries.find(({ id }) => id === entryId);
  if (!entry) {
    throw new Error(
      `Entry ${entryId} is missing from the month it was written to`,
    );
  }
  return entry;
}

/** The "YYYY-MM-" prefix every date in the month starts with. */
function monthDatePrefix(month: { year: number; month: number }): string {
  return `${month.year}-${String(month.month).padStart(2, "0")}-`;
}

/**
 * The month as it is now, for a move or cancel that changes nothing and so
 * never reaches runMonthMutation, which reads the month after a write.
 */
async function readUnchangedMonth<Kind extends string>(
  prisma: CalendarPrismaClient,
  calendar: ResolvedCalendar<Kind>,
  month: { year: number; month: number },
): Promise<MonthDetail<Kind>> {
  const current = await getMonth(prisma, calendar, month);
  if (!current) throw monthNotFoundError();
  return current;
}

/**
 * The entry with entryId in a month readUnchangedMonth read, for a move or
 * cancel that changed nothing. Another editor may have deleted it since the
 * service read it, which is NOT_FOUND like any missing entry.
 */
function unchangedEntryInMonth<Kind extends string>(
  month: MonthDetail<Kind>,
  entryId: string,
): EntryDto<Kind> {
  const entry = month.entries.find(({ id }) => id === entryId);
  if (!entry) throw entryNotFoundError();
  return entry;
}

/** The month fields an entry write reads. */
const entryMonthSelect = {
  select: { id: true, status: true, year: true, month: true, revision: true },
} as const;

/**
 * Loads an entry with its kind, resource and month, through the caller's
 * calendar, so another calendar's entry id is NOT_FOUND like a missing one.
 */
async function findEntryForWrite(
  prisma: CalendarPrismaClient,
  calendarId: string,
  entryId: string,
) {
  const entry = await prisma.calendarEntry.findFirst({
    where: { id: entryId, month: { calendarId } },
    include: { ...entryInclude, month: entryMonthSelect },
  });
  if (!entry) throw entryNotFoundError();
  return entry;
}

/**
 * Loads entries like findEntryForWrite, by id. An id that is missing or in
 * another calendar has no key in the map.
 */
async function findEntriesForWrite(
  prisma: CalendarPrismaClient,
  calendarId: string,
  entryIds: string[],
) {
  const rows = await prisma.calendarEntry.findMany({
    where: { id: { in: entryIds }, month: { calendarId } },
    include: { ...entryInclude, month: entryMonthSelect },
  });
  return new Map(rows.map((row) => [row.id, row]));
}

/**
 * Returns the label of the first moving entry whose slot newDate already has
 * or that shares a slot with another moving entry, or null when every entry
 * fits. A day holds one entry per slot.
 */
async function findSlotClash(
  prisma: CalendarPrismaClient,
  monthId: string,
  newDate: string,
  moving: {
    entry: Parameters<typeof entryLabel>[0] & { id: string; slotKey: string };
  }[],
): Promise<string | null> {
  const ids = moving.map(({ entry }) => entry.id);
  const taken = new Set(
    (
      await prisma.calendarEntry.findMany({
        where: {
          monthId,
          date: toDbDate(newDate),
          id: { notIn: ids },
          slotKey: { in: moving.map(({ entry }) => entry.slotKey) },
        },
        select: { slotKey: true },
      })
    ).map(({ slotKey }) => slotKey),
  );
  for (const { entry } of moving) {
    if (taken.has(entry.slotKey)) return entryLabel(entry);
    taken.add(entry.slotKey);
  }
  return null;
}

/**
 * Maps a failed assertEntryShape or entrySlotKey to a tRPC error. A kind or
 * resource from another calendar is NOT_FOUND, like any other id outside the
 * caller's calendar. An invalid kind or resource code is INTERNAL_SERVER_ERROR,
 * not BAD_REQUEST, because the codes come from the calendar's stored
 * configuration rather than the caller's input. Every other reason is a bad
 * request. A new reason fails typecheck until it has a case here.
 */
function invalidEntryToTrpc(
  e: InvalidEntryError,
  kindLabel: string,
  label: string,
): TRPCError {
  switch (e.reason) {
    case "CALENDAR_MISMATCH":
      return new TRPCError({
        code: "NOT_FOUND",
        message: "That kind or location doesn't exist.",
      });
    case "RESOURCE_REQUIRED":
      return new TRPCError({
        code: "BAD_REQUEST",
        message: `Pick a location for ${kindLabel}.`,
      });
    case "RESOURCE_NOT_ALLOWED":
      return new TRPCError({
        code: "BAD_REQUEST",
        message: `${kindLabel} doesn't take a location.`,
      });
    case "INACTIVE_RESOURCE":
      return new TRPCError({
        code: "BAD_REQUEST",
        message: `${label} is no longer an active location.`,
      });
    case "INVALID_CODE":
      return new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: e.message,
        cause: e,
      });
    case "NOT_CANCELLABLE":
      return new TRPCError({
        code: "BAD_REQUEST",
        message: e.message,
        cause: e,
      });
  }
  return assertNever(e.reason);
}

export interface AddEntryInput<Kind extends string = string> {
  monthId: string;
  date: string;
  kindCode: Kind;
  resourceId: string | null;
}

/**
 * Adds a MANUAL entry to a DRAFT month, on one of the weekdays the
 * calendar's settings allow. Holidays never block it; the returned entry
 * carries holidayName. It copies startTime and endTime from the slot's current
 * pattern, or leaves them null without one. A PUBLISHED month is locked, so
 * the add is PRECONDITION_FAILED until an editor clicks Edit month. It
 * returns the month after the add along with the new entry.
 */
export async function addEntry<Kind extends string>(
  prisma: CalendarPrismaClient,
  calendar: ResolvedCalendar<Kind>,
  email: string,
  input: AddEntryInput<Kind>,
): Promise<EntryMutationResult<Kind>> {
  const calendarId = calendar.id;
  const month = await prisma.calendarMonth.findFirst({
    where: { id: input.monthId, calendarId },
  });
  if (!month) throw monthNotFoundError();
  assertMonthIsDraft(month);
  if (!isDateInMonth(input.date, month)) {
    throw dateOutsideMonthError(month.year, month.month);
  }
  if (
    !calendar.rules.settings.allowedWeekdays.includes(weekdayOf(input.date))
  ) {
    throw weekdayNotAllowedError(input.date);
  }

  const kind = calendar.kinds.find((k) => k.code === input.kindCode);
  if (!kind) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "That kind doesn't exist.",
    });
  }
  const resource =
    input.resourceId === null
      ? null
      : await prisma.calendarResource.findFirst({
          where: { id: input.resourceId, calendarId },
        });
  if (input.resourceId !== null && !resource) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "That location doesn't exist.",
    });
  }
  const label = entryLabel({ kind, resource });
  let slotKey: string;
  try {
    assertEntryShape({ calendarId, kind, resource, isNew: true });
    slotKey = entrySlotKey({
      kindCode: kind.code,
      resourceCode: resource?.code ?? null,
    });
  } catch (e) {
    if (e instanceof InvalidEntryError) {
      throw invalidEntryToTrpc(e, kind.label, label);
    }
    throw e;
  }

  const pattern = await prisma.calendarEntryPattern.findFirst({
    where: { calendarId, slotKey },
    orderBy: { version: "desc" },
    select: { startTime: true, endTime: true },
  });

  try {
    const {
      result: entry,
      monthRevision,
      month: updatedMonth,
    } = await runMonthMutation(
      prisma,
      { calendar, monthId: month.id, email },
      (tx) =>
        tx.calendarEntry.create({
          data: {
            calendarId,
            monthId: month.id,
            date: toDbDate(input.date),
            kindId: kind.id,
            resourceId: resource?.id ?? null,
            slotKey,
            startTime: pattern?.startTime ?? null,
            endTime: pattern?.endTime ?? null,
            source: "MANUAL",
            version: 1,
            createdByEmail: email,
            updatedByEmail: email,
          },
          include: entryInclude,
        }),
    );
    return {
      entry: entryInMonth(updatedMonth, entry.id),
      monthRevision,
      month: updatedMonth,
    };
  } catch (e) {
    return classifyEntryMutationError(prisma, e, {
      calendarId,
      monthId: month.id,
      duplicate: { label, date: input.date },
    });
  }
}

/**
 * Hard-deletes an entry from a DRAFT month when expectedVersion is its version.
 * An entry whose entry type isn't deletable, such as Colorado's Business
 * Meetings, can only be cancelled. A PUBLISHED month is locked, so the delete
 * is PRECONDITION_FAILED until an editor clicks Edit month. It returns the
 * entry's month after the delete.
 */
export async function deleteEntry<Kind extends string>(
  prisma: CalendarPrismaClient,
  calendar: ResolvedCalendar<Kind>,
  email: string,
  { entryId, expectedVersion }: { entryId: string; expectedVersion: number },
): Promise<DeleteEntryResult<Kind>> {
  const calendarId = calendar.id;
  const entry = await prisma.calendarEntry.findFirst({
    where: { id: entryId, month: { calendarId } },
    select: {
      monthId: true,
      version: true,
      kindId: true,
      resource: { select: { label: true } },
      month: { select: { year: true, month: true, status: true } },
    },
  });
  if (!entry) throw entryNotFoundError();
  assertMonthIsDraft(entry.month);
  const kind = kindOf(kindsById(calendar.kinds), entry.kindId);
  if (!kind.deletable) {
    throw entryNotDeletableError(
      entryLabel({ kind, resource: entry.resource }),
    );
  }
  if (entry.version !== expectedVersion) throw entryVersionConflictError();

  const { monthId } = entry;
  try {
    const { monthRevision, month } = await runMonthMutation(
      prisma,
      { calendar, monthId, email },
      (tx) =>
        tx.calendarEntry.delete({
          where: { id: entryId, monthId, version: expectedVersion },
        }),
    );
    return { deletedEntryId: entryId, monthRevision, month };
  } catch (e) {
    return classifyEntryMutationError(prisma, e, {
      calendarId,
      monthId,
      entryId,
    });
  }
}

/**
 * Moves one entry, or several the editor selected, to newDate in their month,
 * in one transaction: every entry moves or none does. Each
 * expectedVersion must be its entry's version. Everything but the date
 * stays as it was, including source and cancellation. newDate must be one of
 * the weekdays the calendar's settings allow. Holidays never block a move;
 * the returned entries carry holidayName. Entries already on newDate
 * are returned unchanged, and a move that changes nothing writes nothing. The
 * month must be DRAFT: a move in a PUBLISHED month is PRECONDITION_FAILED,
 * even one that would change nothing. It returns the month after the move,
 * or as it is when nothing moved.
 */
export async function moveEntries<Kind extends string>(
  prisma: CalendarPrismaClient,
  calendar: ResolvedCalendar<Kind>,
  email: string,
  input: {
    entries: { entryId: string; expectedVersion: number }[];
    newDate: string;
  },
): Promise<MoveEntriesResult<Kind>> {
  const calendarId = calendar.id;
  const { newDate } = input;
  const found = await findEntriesForWrite(
    prisma,
    calendarId,
    input.entries.map(({ entryId }) => entryId),
  );
  const entries = input.entries.map(({ entryId, expectedVersion }) => {
    const entry = found.get(entryId);
    if (!entry) throw entryNotFoundError();
    return { entry, expectedVersion };
  });
  const { month } = entries[0].entry;
  if (entries.some(({ entry }) => entry.month.id !== month.id)) {
    throw entriesInSeveralMonthsError();
  }
  assertMonthIsDraft(month);
  if (
    entries.some(
      ({ entry, expectedVersion }) => entry.version !== expectedVersion,
    )
  ) {
    throw entryVersionConflictError();
  }
  if (!newDate.startsWith(monthDatePrefix(month))) {
    throw dateOutsideMonthError(month.year, month.month);
  }
  const toMove = entries
    .map(({ entry }) => entry)
    .filter((entry) => fromDbDate(entry.date) !== newDate);
  if (toMove.length === 0) {
    const current = await readUnchangedMonth(prisma, calendar, month);
    return {
      entries: entries.map(({ entry }) =>
        unchangedEntryInMonth(current, entry.id),
      ),
      monthRevision: current.revision,
      month: current,
    };
  }
  // Checked before anything is written, so a multi-entry move to a disallowed
  // day moves none of them. A move that changes nothing returns above, so
  // entries already on such a day aren't refused.
  if (!calendar.rules.settings.allowedWeekdays.includes(weekdayOf(newDate))) {
    throw weekdayNotAllowedError(newDate);
  }
  // Checked before the write so the message names the entry that clashes; the
  // unique key on (month, date, slot) still guards a concurrent add.
  const clash = await findSlotClash(prisma, month.id, newDate, entries);
  if (clash) throw duplicateEntryError(clash, newDate);
  const stayingIds = [
    ...new Set(
      entries
        .map(({ entry }) => entry.id)
        .filter((id) => !toMove.some((entry) => entry.id === id)),
    ),
  ];

  try {
    const { monthRevision, month: updatedMonth } = await runMonthMutation(
      prisma,
      { calendar, monthId: month.id, email },
      async (tx) => {
        // Prisma runs a transaction's queries one after another on its
        // connection, so these updates don't race each other.
        await Promise.all(
          toMove.map((entry) =>
            tx.calendarEntry.update({
              where: {
                id: entry.id,
                monthId: month.id,
                version: entry.version,
              },
              data: {
                date: toDbDate(newDate),
                version: { increment: 1 },
                updatedByEmail: email,
              },
            }),
          ),
        );
        // Entries already on newDate aren't written, so check that another
        // editor hasn't deleted one since the read. The throw rolls the move
        // back, and the month row is locked by now, so none can go before
        // the month is read.
        if (stayingIds.length > 0) {
          const staying = await tx.calendarEntry.count({
            where: { id: { in: stayingIds }, monthId: month.id },
          });
          if (staying !== stayingIds.length) throw entryNotFoundError();
        }
      },
    );
    return {
      entries: entries.map(({ entry }) => entryInMonth(updatedMonth, entry.id)),
      monthRevision,
      month: updatedMonth,
    };
  } catch (e) {
    // A concurrent write made the move fail. Name the entry it's about: the
    // one whose slot is now taken, or one that was deleted.
    const ids = toMove.map(({ id }) => id);
    const label = isPrismaErrorCode(e, "P2002")
      ? await findSlotClash(prisma, month.id, newDate, entries)
      : null;
    const remaining = isPrismaErrorCode(e, "P2025")
      ? await findEntriesForWrite(prisma, calendarId, ids)
      : null;
    return classifyEntryMutationError(prisma, e, {
      calendarId,
      monthId: month.id,
      entryId: ids.find((id) => remaining && !remaining.has(id)) ?? ids[0],
      duplicate: { label: label ?? entryLabel(toMove[0]), date: newDate },
    });
  }
}

/**
 * Cancels (cancelled true) or uncancels an entry whose entry type is
 * cancellable, when expectedVersion is its version. An entry already in the
 * requested state comes back unchanged with no write, so the call is safe to
 * repeat; that's why cancel and uncancel are two procedures, not a toggle.
 * The month must be DRAFT: either call on a PUBLISHED month is
 * PRECONDITION_FAILED, even a repeat that would change nothing. It returns
 * the entry's month after the write, or as it is when nothing changed.
 */
export async function setEntryCancelled<Kind extends string>(
  prisma: CalendarPrismaClient,
  calendar: ResolvedCalendar<Kind>,
  email: string,
  input: { entryId: string; expectedVersion: number },
  cancelled: boolean,
): Promise<EntryMutationResult<Kind>> {
  const calendarId = calendar.id;
  const kinds = kindsById(calendar.kinds);
  const { entryId, expectedVersion } = input;
  const entry = await findEntryForWrite(prisma, calendarId, entryId);
  assertMonthIsDraft(entry.month);
  // Uncancel checks the kind too, so both procedures refuse a kind that can't
  // be cancelled with the same error; only cancellable kinds are ever
  // cancelled.
  try {
    assertCancellable(kindOf(kinds, entry.kindId));
  } catch (e) {
    if (e instanceof InvalidEntryError) {
      throw entryNotCancellableError(entryLabel(entry));
    }
    throw e;
  }
  const { month } = entry;
  if (entry.version !== expectedVersion) throw entryVersionConflictError();
  if ((entry.cancelledAt !== null) === cancelled) {
    const current = await readUnchangedMonth(prisma, calendar, month);
    return {
      entry: unchangedEntryInMonth(current, entryId),
      monthRevision: current.revision,
      month: current,
    };
  }

  try {
    const { monthRevision, month: updatedMonth } = await runMonthMutation(
      prisma,
      { calendar, monthId: month.id, email },
      (tx) =>
        tx.calendarEntry.update({
          where: { id: entryId, monthId: month.id, version: expectedVersion },
          data: {
            cancelledAt: cancelled ? new Date() : null,
            cancelledByEmail: cancelled ? email : null,
            version: { increment: 1 },
            updatedByEmail: email,
          },
        }),
    );
    return {
      entry: entryInMonth(updatedMonth, entryId),
      monthRevision,
      month: updatedMonth,
    };
  } catch (e) {
    return classifyEntryMutationError(prisma, e, {
      calendarId,
      monthId: month.id,
      entryId,
    });
  }
}
