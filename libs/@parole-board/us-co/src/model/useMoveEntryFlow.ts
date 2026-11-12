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

import { notifyManager } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";

import type {
  CalendarApiConfig,
  EntryDto,
  YearMonthOption,
} from "~@parole-board/common";
import {
  getCalendarErrorCode,
  getCalendarErrorMessage,
  STALE_CALENDAR_CODES,
  useCalendarConfig,
  useMoveEntries,
  useParoleBoardHost,
  useReportError,
} from "~@parole-board/common";
import { pluralize } from "~utils";

import { formatMonthDay, joinLabels } from "./month";

const NO_IDS: ReadonlySet<string> = new Set();

/** The toast's id, so a second move's toast replaces the first one's. */
export const MOVE_TOAST_ID = "pb-calendar-entry-move";

/** How the editor moved: by dragging a chip, or with "Move to…". */
export type MoveMethod = "drag" | "move_to";

/**
 * How a move ended. "blocked" sent no request, because a moving entry would
 * share a slot on the day or nothing was left to move. "failed" means the
 * server refused it and a toast has told the editor why.
 */
export type MoveOutcome =
  | { status: "moved" }
  | { status: "blocked" }
  | { status: "failed" };

/** A drag move waiting on the server. */
type PendingMove = {
  /** The moving entries' ids. */
  ids: ReadonlySet<string>;
  /** The moving entries' labels, for the status message. */
  labels: readonly string[];
  /** The days the entries leave, "YYYY-MM-DD". */
  from: readonly string[];
  /** The day the entries go to, "YYYY-MM-DD". */
  date: string;
};

/** Whole days from one "YYYY-MM-DD" date to another, negative going back. */
export function dayDelta(from: string, to: string): number {
  const toUtc = (date: string) => {
    const [year, month, day] = date.split("-").map(Number);
    return Date.UTC(year, month - 1, day);
  };
  return Math.round((toUtc(to) - toUtc(from)) / 86_400_000);
}

/**
 * For each day, the labels of the moving entries whose slot another entry
 * already holds there, cancelled entries included, since the server's unique
 * slot key counts them too. For CCF on September 15 in the September
 * 2026 fixture this gives { "2026-09-16": ["CCF"] }. "Move to…" disables
 * those days.
 */
export function alreadyOnByDay(
  entries: readonly Pick<EntryDto, "id" | "date" | "slotKey">[],
  moving: readonly Pick<EntryDto, "id" | "slotKey" | "label">[],
): Record<string, string[]> {
  const movingIds = new Set(moving.map(({ id }) => id));
  const alreadyOn: Record<string, string[]> = {};
  for (const entry of entries) {
    if (movingIds.has(entry.id)) continue;
    for (const { slotKey, label } of moving) {
      if (entry.slotKey !== slotKey) continue;
      const labels = alreadyOn[entry.date] ?? [];
      if (!labels.includes(label)) alreadyOn[entry.date] = [...labels, label];
    }
  }
  return alreadyOn;
}

/**
 * A moving entry that can't go to a day. "existing" means an entry already
 * on the day holds its slot. "moving" means another moving entry would take
 * the same slot there.
 */
export type DayClash = { label: string; kind: "existing" | "moving" };

/**
 * The first moving entry that can't go to date, and why; undefined when
 * every one can go.
 */
export function duplicateOnDay(
  entries: readonly Pick<EntryDto, "id" | "date" | "slotKey">[],
  moving: readonly Pick<EntryDto, "id" | "slotKey" | "label">[],
  date: string,
): DayClash | undefined {
  const movingIds = new Set(moving.map(({ id }) => id));
  const existing = new Set(
    entries
      .filter((entry) => entry.date === date && !movingIds.has(entry.id))
      .map(({ slotKey }) => slotKey),
  );
  const claimed = new Set<string>();
  for (const { slotKey, label } of moving) {
    if (existing.has(slotKey)) return { label, kind: "existing" };
    if (claimed.has(slotKey)) return { label, kind: "moving" };
    claimed.add(slotKey);
  }
  return undefined;
}

/**
 * entries, in the server's date order, with each one in ids moved to date.
 * The day sorts as the server sorts it: kind sortOrder, then resource
 * sortOrder, from config.get. An entry whose kind config.get doesn't list
 * goes last on the day, and one whose resource it doesn't list, such as an
 * inactive facility's, after the rest of its kind. Other days keep their
 * order.
 */
export function placeEntriesOn(
  entries: readonly EntryDto[],
  ids: ReadonlySet<string>,
  date: string,
  { kinds, resources }: Pick<CalendarApiConfig, "kinds" | "resources">,
): EntryDto[] {
  const kindOrder = new Map(kinds.map((kind) => [kind.code, kind.sortOrder]));
  const resourceOrder = new Map(
    resources.map((resource) => [resource.id, resource.sortOrder]),
  );
  const rank = (order: Map<string, number>, key: string | undefined) =>
    (key === undefined ? undefined : order.get(key)) ?? Number.MAX_SAFE_INTEGER;
  const staying = entries.filter((entry) => !ids.has(entry.id));
  const day = [
    ...staying.filter((entry) => entry.date === date),
    ...entries
      .filter((entry) => ids.has(entry.id))
      .map((entry) => ({ ...entry, date })),
  ].sort(
    (a, b) =>
      rank(kindOrder, a.kind.code) - rank(kindOrder, b.kind.code) ||
      rank(resourceOrder, a.resource?.id) - rank(resourceOrder, b.resource?.id),
  );
  return [
    ...staying.filter((entry) => entry.date < date),
    ...day,
    ...staying.filter((entry) => entry.date > date),
  ];
}

/**
 * Moves entries of the shown month to another day of it, for both the drag
 * and "Move to…", so they behave the same. One entries.move request carries
 * every entry with the version the caller captured, and the server moves all
 * of them or none (Spec D). useMoveEntries puts the month the server returns
 * in the cache, or refetches it after a stale-copy error, before the outcome
 * below runs, so the grid already shows the server's state and nothing needs
 * reverting.
 *
 * - A move that would put two entries in one slot on the day sends nothing.
 *   It toasts "CCF is already on September 16." when an entry already on
 *   the day holds the slot, and "Only one CCF can be on September 21." when
 *   two of the moving entries share it.
 * - Success sends one trackPbPublicCalendarHearingMoved per moved entry and
 *   toasts "Moved CCF to September 21", or "Moved 3 hearings to September
 *   21". A drag then clears the selection, as the design does; "Move to…"
 *   keeps it, so the action bar follows the moved hearings.
 * - A failed drag toasts the server's message. A failed "Move to…" toasts it
 *   when the editor's copy of the month is stale (STALE_CALENDAR_CODES), and
 *   otherwise throws the error for the dialog to show, since trying again
 *   might work. After a PRECONDITION_FAILED, the refetched month is
 *   PUBLISHED, so the view turns dragging and "Move to…" off.
 *
 * While a drag's request runs, its entries show on the target day already,
 * and the drag's days and entries are busy, for the grid to mark them and
 * ignore clicks on them. "Move to…" has its own waiting state in its dialog,
 * so it marks nothing. When the request settles, the entries show where the
 * month from the server has them: on the target day after a success, and
 * back on their days after a refusal.
 *
 * The outcome runs even if the calling component unmounts first, since it
 * reads mutateAsync's promise rather than mutate's callbacks.
 *
 * Args:
 *   month: The month shown, with its entries, for the slot check and the
 *     analytics events.
 *   clearSelection: Clears the month's selection.
 *
 * Returns whether a move is running; move, which takes the entries as
 * captured when the editor started the move, the target "YYYY-MM-DD" and the
 * method; the month's entries for the grid, with a running drag's entries on
 * its target day; the ids of those entries and their days, source and
 * target, as busyEntryIds and busyDates; and pendingStatus, "Moving CCF to
 * September 21…" while a drag runs and "" otherwise.
 */
export function useMoveEntryFlow({
  month,
  clearSelection,
}: {
  month: YearMonthOption & { entries: readonly EntryDto[] };
  clearSelection: () => void;
}) {
  const moveEntries = useMoveEntries();
  const { analyticsStore } = useParoleBoardHost();
  const reportError = useReportError();
  const { data: config } = useCalendarConfig();
  const [pending, setPending] = useState<PendingMove | null>(null);

  const entries = useMemo(
    () =>
      pending
        ? placeEntriesOn(month.entries, pending.ids, pending.date, config)
        : month.entries,
    [month.entries, pending, config],
  );
  const busy = useMemo(
    () => ({
      busyEntryIds: pending?.ids ?? NO_IDS,
      busyDates: pending ? new Set([...pending.from, pending.date]) : NO_IDS,
    }),
    [pending],
  );

  const move = async (
    targets: readonly EntryDto[],
    date: string,
    method: MoveMethod,
  ): Promise<MoveOutcome> => {
    // An entry already on the day stays where it is.
    const moving = targets.filter((entry) => entry.date !== date);
    if (moving.length === 0 || moveEntries.isPending) {
      return { status: "blocked" };
    }
    const day = formatMonthDay(date);

    const clash = duplicateOnDay(month.entries, moving, date);
    if (clash !== undefined) {
      toast.error(
        clash.kind === "existing"
          ? `${clash.label} is already on ${day}.`
          : `Only one ${clash.label} can be on ${day}.`,
        { id: MOVE_TOAST_ID },
      );
      return { status: "blocked" };
    }

    if (method === "drag") {
      setPending({
        ids: new Set(moving.map(({ id }) => id)),
        labels: moving.map(({ label }) => label),
        from: moving.map((entry) => entry.date),
        date,
      });
    }
    try {
      await moveEntries.mutateAsync({
        entries: moving.map((entry) => ({
          entryId: entry.id,
          expectedVersion: entry.version,
        })),
        newDate: date,
      });
    } catch (error: unknown) {
      const code = getCalendarErrorCode(error);
      if (method === "move_to" && !(code && STALE_CALENDAR_CODES.has(code))) {
        throw error;
      }
      toast.error(getCalendarErrorMessage(error), { id: MOVE_TOAST_ID });
      return { status: "failed" };
    } finally {
      // The month the server returned, or refetched after a failure, reaches
      // the page through React Query's notifications on a later tick.
      // notifyManager.schedule queues the clear behind them, so the entries
      // leave the target day only once that month has arrived and never
      // flash back to their old days first.
      notifyManager.schedule(() => setPending(null));
    }

    // The move has succeeded, so a throw here is reported rather than shown
    // as a failed move, which trying again would turn into a CONFLICT.
    try {
      for (const entry of moving) {
        analyticsStore.trackPbPublicCalendarHearingMoved({
          year: month.year,
          month: month.month,
          kind: entry.kind.code,
          method,
          dayDelta: dayDelta(entry.date, date),
        });
      }
    } catch (error) {
      reportError(error);
    }
    const what =
      moving.length === 1
        ? moving[0].label
        : pluralize(moving.length, "hearing");
    toast(`Moved ${what} to ${day}`, { id: MOVE_TOAST_ID });
    if (method === "drag") clearSelection();
    return { status: "moved" };
  };

  return {
    moving: moveEntries.isPending,
    move,
    entries,
    ...busy,
    pendingStatus: pending
      ? `Moving ${joinLabels(pending.labels)} to ${formatMonthDay(pending.date)}…`
      : "",
  };
}
