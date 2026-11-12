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

import { captureMessage } from "@sentry/node";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { daysInMonth, IsoDate } from "~@modules/Calendar/rules";

import { fromDbDate } from "../db/dates";
import type { PublicDay, PublicMonth } from "../types";
import { compareEntries, entryLabel, formatYearMonth, pad2 } from "./helpers";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const yearMonth = z.string().regex(/^\d{4}-\d{2}$/);

/**
 * The public read's output. Every level is strict, so a field outside this
 * allowlist, such as an id or an email, fails the parse instead of reaching
 * the public site.
 */
export const publicMonthSchema = z
  .object({
    month: yearMonth,
    title: z.string().min(1),
    days: z.array(
      z
        .object({
          date: isoDate,
          holidayName: z.string().nullable(),
          entries: z.array(
            z
              .object({
                label: z.string().min(1),
                /** The kind code, such as "HEARING". */
                kind: z.string().min(1),
                cancelled: z.boolean(),
              })
              .strict(),
          ),
        })
        .strict(),
    ),
    previous: yearMonth.nullable(),
    next: yearMonth.nullable(),
    notPublishedYet: z.string().nullable(),
  })
  .strict();

/**
 * The entry columns and relations buildPublicDays reads. kind is the entry's
 * kind with its entry type's behaviour, which says whether it's public.
 */
export interface PublicDayEntry<Kind extends string = string> {
  date: Date;
  slotKey: string;
  cancelledAt: Date | null;
  kind: { code: Kind; label: string; sortOrder: number; isPublic: boolean };
  resource: { label: string; sortOrder: number } | null;
}

/**
 * Builds a month's public days: one element per date, in order, with the
 * day's holiday and its entries whose kind isPublic, sorted by
 * compareEntries. It copies only allowlisted fields, so ids, emails, times,
 * source and version never reach it. For example, two days of September 2026:
 *
 *   { date: "2026-09-07", holidayName: "Labor Day", entries: [
 *       { label: "Site A", kind: "SESSION", cancelled: false } ] },
 *   { date: "2026-09-08", holidayName: null, entries: [] },
 *
 * entries are the month's, in any order; holidays are the month's, keyed by
 * "YYYY-MM-DD", from getHolidaysInMonth.
 */
export function buildPublicDays<Kind extends string>({
  year,
  month,
  entries,
  holidays,
}: {
  year: number;
  /** 1 (January) to 12. */
  month: number;
  entries: PublicDayEntry<Kind>[];
  holidays: Map<IsoDate, string>;
}): PublicDay<Kind>[] {
  const entriesByDate = new Map<IsoDate, PublicDay<Kind>["entries"]>();
  for (const entry of [...entries].sort(compareEntries)) {
    if (!entry.kind.isPublic) continue;
    const date = fromDbDate(entry.date);
    const dayEntries = entriesByDate.get(date) ?? [];
    dayEntries.push({
      label: entryLabel(entry),
      kind: entry.kind.code,
      cancelled: entry.cancelledAt !== null,
    });
    entriesByDate.set(date, dayEntries);
  }

  return Array.from({ length: daysInMonth({ year, month }) }, (_, i) => {
    const date = `${formatYearMonth({ year, month })}-${pad2(i + 1)}`;
    return {
      date,
      holidayName: holidays.get(date) ?? null,
      entries: entriesByDate.get(date) ?? [],
    };
  });
}

/**
 * Checks a public month against publicMonthSchema before it's returned.
 * One that fails, say with an id or email added by mistake, is
 * INTERNAL_SERVER_ERROR, and Sentry gets only the month and the failing
 * paths, never the values.
 */
export function assertPublicMonth(value: PublicMonth): void {
  const parsed = publicMonthSchema.safeParse(value);
  if (parsed.success) return;
  captureMessage(
    `Public calendar month ${value.month} failed the public schema`,
    {
      level: "error",
      extra: {
        paths: parsed.error.issues.map((issue) => issue.path.join(".")),
      },
    },
  );
  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: "A published month is invalid",
  });
}
