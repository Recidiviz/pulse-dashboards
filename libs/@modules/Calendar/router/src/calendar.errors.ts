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
// date-fns directly, not ~utils: the ~utils barrel loads its download helpers,
// whose jsonexport directory import Node rejects when the server starts.
import { format } from "date-fns";

/**
 * Formats a month for error messages, such as "October 2026". It builds the
 * Date from local parts, so the server's time zone can't shift the month.
 */
export function formatMonthLabel(year: number, month: number): string {
  return format(new Date(year, month - 1, 1), "MMMM yyyy");
}

/**
 * Throws NOT_IMPLEMENTED (HTTP 501) for a procedure whose handler hasn't been
 * written yet. path is the procedure's full path, such as
 * "Calendar.usCo.paroleBoard.admin.months.get".
 */
export function notImplemented(path: string): never {
  throw new TRPCError({
    code: "NOT_IMPLEMENTED",
    message: `${path} isn't implemented yet`,
  });
}

/** Joins month labels as "A", "A and B", or "A, B and C". */
function joinMonthLabels(months: { year: number; month: number }[]): string {
  const labels = months.map(({ year, month }) => formatMonthLabel(year, month));
  if (labels.length <= 2) return labels.join(" and ");
  return `${labels.slice(0, -1).join(", ")} and ${labels[labels.length - 1]}`;
}

/**
 * BAD_REQUEST for a month outside the Add month window, such as "You can add
 * October 2026 to October 2027 only."
 */
export function monthOutsideAddWindowError(
  first: { year: number; month: number },
  last: { year: number; month: number },
): TRPCError {
  return new TRPCError({
    code: "BAD_REQUEST",
    message: `You can add ${formatMonthLabel(first.year, first.month)} to ${formatMonthLabel(last.year, last.month)} only.`,
  });
}

/**
 * CONFLICT for requested months that already exist, naming each one, such as
 * "October 2026 already exists. Refresh to see it."
 */
export function monthsAlreadyExistError(
  months: { year: number; month: number }[],
): TRPCError {
  const one = months.length === 1;
  return new TRPCError({
    code: "CONFLICT",
    message: `${joinMonthLabels(months)} already ${one ? "exists" : "exist"}. Refresh to see ${one ? "it" : "them"}.`,
  });
}

/** CONFLICT when another editor created one of the months during the request. */
export function monthCreatedConcurrentlyError(): TRPCError {
  return new TRPCError({
    code: "CONFLICT",
    message:
      "One of these months was just created by someone else. Refresh and try again.",
  });
}

/**
 * INTERNAL_SERVER_ERROR when the draft generator rejects the calendar's stored
 * kinds, resources or patterns. It's bad reference data, not a bad request.
 */
export function invalidDraftInputError(cause: unknown): TRPCError {
  return new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: "The calendar's stored patterns are invalid",
    cause,
  });
}

/**
 * Formats a "YYYY-MM-DD" date as "September 14" for error messages. Like
 * formatMonthLabel, it builds the Date from local parts.
 */
function formatDayLabel(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  return format(new Date(year, month - 1, day), "MMMM d");
}

/** NOT_FOUND for a month that isn't in the caller's calendar. */
export function monthNotFoundError(): TRPCError {
  return new TRPCError({
    code: "NOT_FOUND",
    message: "That month no longer exists. Refresh to see the latest calendar.",
  });
}

/**
 * NOT_FOUND for a public read of a month that isn't on the public calendar:
 * a DRAFT month, whether never published or back in draft after Edit month,
 * or a month the calendar doesn't have. The public page shows the
 * same words.
 */
export function publicMonthNotFoundError(): TRPCError {
  return new TRPCError({
    code: "NOT_FOUND",
    message: "This month isn't available.",
  });
}

/** NOT_FOUND for an entry that isn't in the caller's calendar. */
export function entryNotFoundError(): TRPCError {
  return new TRPCError({
    code: "NOT_FOUND",
    message:
      "This entry no longer exists. Someone may have deleted it. Refresh to see the latest calendar.",
  });
}

/**
 * BAD_REQUEST for deleting an entry whose kind isn't deletable, such as
 * "Business Mtg can't be deleted. Cancel it instead."
 */
export function entryNotDeletableError(label: string): TRPCError {
  return new TRPCError({
    code: "BAD_REQUEST",
    message: `${label} can't be deleted. Cancel it instead.`,
  });
}

/** BAD_REQUEST for a move whose entries aren't all in one month. */
export function entriesInSeveralMonthsError(): TRPCError {
  return new TRPCError({
    code: "BAD_REQUEST",
    message: "Pick entries from one month to move together.",
  });
}

/** CONFLICT for a write whose expectedVersion isn't the entry's version. */
export function entryVersionConflictError(): TRPCError {
  return new TRPCError({
    code: "CONFLICT",
    message:
      "Someone else changed this entry. Refresh to see the latest calendar, then try again.",
  });
}

/**
 * CONFLICT for a write whose guarded update matched nothing although its
 * month and entry are still there, because the month changed while it ran.
 */
export function monthChangedError(): TRPCError {
  return new TRPCError({
    code: "CONFLICT",
    message:
      "This month changed while you were saving. Refresh to see the latest calendar, then try again.",
  });
}

/**
 * PRECONDITION_FAILED for an entry write to a PUBLISHED month, which is
 * locked until an editor moves it back to DRAFT with Edit month, such
 * as "September 2026 is published. Click Edit month to change it."
 */
export function monthPublishedError(year: number, month: number): TRPCError {
  return new TRPCError({
    code: "PRECONDITION_FAILED",
    message: `${formatMonthLabel(year, month)} is published. Click Edit month to change it.`,
  });
}

/**
 * CONFLICT for an add that matches an existing entry's month, date and slot,
 * such as "FCF is already on September 14."
 */
export function duplicateEntryError(label: string, isoDate: string): TRPCError {
  return new TRPCError({
    code: "CONFLICT",
    message: `${label} is already on ${formatDayLabel(isoDate)}.`,
  });
}

/** BAD_REQUEST for an entry date outside its month. */
export function dateOutsideMonthError(year: number, month: number): TRPCError {
  return new TRPCError({
    code: "BAD_REQUEST",
    message: `Pick a day in ${formatMonthLabel(year, month)}.`,
  });
}

/**
 * BAD_REQUEST for an entry date on a weekday outside the calendar's
 * allowedWeekdays, such as "This calendar has no entries on Saturdays. Pick
 * another day."
 */
export function weekdayNotAllowedError(isoDate: string): TRPCError {
  const [year, month, day] = isoDate.split("-").map(Number);
  const weekday = format(new Date(year, month - 1, day), "EEEE");
  return new TRPCError({
    code: "BAD_REQUEST",
    message: `This calendar has no entries on ${weekday}s. Pick another day.`,
  });
}

/**
 * BAD_REQUEST for cancelling or uncancelling an entry whose entry type isn't
 * cancellable, such as "FCF can't be cancelled. Delete it instead."
 */
export function entryNotCancellableError(label: string): TRPCError {
  return new TRPCError({
    code: "BAD_REQUEST",
    message: `${label} can't be cancelled. Delete it instead.`,
  });
}

/**
 * PRECONDITION_FAILED for previewing or publishing a month that is already
 * PUBLISHED, such as "September 2026 is already published." Its
 * entries are locked, so it has nothing new to publish until an editor moves
 * it back to DRAFT with Edit month.
 */
export function monthAlreadyPublishedError(
  year: number,
  month: number,
): TRPCError {
  return new TRPCError({
    code: "PRECONDITION_FAILED",
    message: `${formatMonthLabel(year, month)} is already published.`,
  });
}

/**
 * CONFLICT for a publish whose expectedRevision isn't the month's revision,
 * because the month changed after the editor opened the publish review.
 */
export function publishRevisionConflictError(
  year: number,
  month: number,
): TRPCError {
  return new TRPCError({
    code: "CONFLICT",
    message: `${formatMonthLabel(year, month)} changed since you opened this review. Check the updated counts and publish again.`,
  });
}

/** An entry that falls on a holiday, as holidayBlockedError names it. */
export interface HolidayEntry {
  label: string;
  /** "YYYY-MM-DD". */
  date: string;
  holidayName: string;
}

/** How many entries holidayBlockedError names before it counts the rest. */
const HOLIDAY_ENTRIES_NAMED = 5;

/**
 * PRECONDITION_FAILED for a publish under holidayPolicy BLOCK while entries
 * fall on holidays, such as "September 2026 has entries on holidays.
 * Move or delete them before publishing: Site A on September 7 (Labor Day)."
 * It names the first five entries and counts the rest.
 */
export function holidayBlockedError(
  year: number,
  month: number,
  entries: HolidayEntry[],
): TRPCError {
  const named = entries
    .slice(0, HOLIDAY_ENTRIES_NAMED)
    .map(
      (entry) =>
        `${entry.label} on ${formatDayLabel(entry.date)} (${entry.holidayName})`,
    );
  const more = entries.length - named.length;
  const list = more > 0 ? [...named, `and ${more} more`] : named;
  return new TRPCError({
    code: "PRECONDITION_FAILED",
    message: `${formatMonthLabel(year, month)} has entries on holidays. Move or delete them before publishing: ${list.join(", ")}.`,
  });
}

/**
 * INTERNAL_SERVER_ERROR for a publish that failed for any reason other than
 * its status and revision checks. The transaction has rolled back, so the
 * month and the public calendar are unchanged.
 * cause carries the original error to Sentry; the message never includes it.
 */
export function publishFailedError(
  year: number,
  month: number,
  cause: unknown,
): TRPCError {
  return new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: `${formatMonthLabel(year, month)} wasn't published. The public calendar hasn't changed. Try again or contact Recidiviz support.`,
    cause,
  });
}

/**
 * INTERNAL_SERVER_ERROR for an Edit month that failed for any reason other
 * than its status guard. The transaction has rolled back, so the month is
 * still published. cause carries the original error to Sentry; the message
 * never includes it.
 */
export function unpublishFailedError(
  year: number,
  month: number,
  cause: unknown,
): TRPCError {
  return new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: `${formatMonthLabel(year, month)} is still published. Try Edit month again or contact Recidiviz support.`,
    cause,
  });
}

/**
 * PRECONDITION_FAILED for Edit month on a DRAFT month, which the public can't
 * see: it has never been published, or an editor already moved it back to
 * DRAFT.
 */
export function monthNotPublicError(year: number, month: number): TRPCError {
  return new TRPCError({
    code: "PRECONDITION_FAILED",
    message: `${formatMonthLabel(year, month)} isn't on the public calendar.`,
  });
}

/**
 * CONFLICT for an Edit month whose month changed between its read and its
 * write, so the change didn't apply.
 */
export function monthStatusChangedError(
  year: number,
  month: number,
): TRPCError {
  return new TRPCError({
    code: "CONFLICT",
    message: `${formatMonthLabel(year, month)} changed. Refresh to see the latest.`,
  });
}
