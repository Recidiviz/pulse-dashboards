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

import type { CalendarPrismaClient, Prisma } from "~@modules/Calendar/prisma";
import {
  CalendarRulesError,
  CalendarSettings,
  daysInMonth,
  getHolidays,
  IsoDate,
  parsePatternRules,
  PatternRule,
  YearMonth,
} from "~@modules/Calendar/rules";
import { getDefaultHolidaySource } from "~@modules/Calendar/rules/holidays/defaultHolidaySource";

import { fromDbDate } from "../db/dates";
import type { CalendarKind } from "../procedures";
import type { EntryDto, MonthCounts, MonthSummary } from "../types";

/**
 * The engine's shared helpers. Every function here takes the calendar's id
 * or its rules, never a state or a calendar code, so each state's API calls
 * them with its own fixed calendar.
 */

/** A calendar's kinds with their entry-type behaviour, by kind id. */
export function kindsById<Kind extends string>(
  kinds: readonly CalendarKind<Kind>[],
): Map<string, CalendarKind<Kind>> {
  return new Map(kinds.map((kind) => [kind.id, kind]));
}

/**
 * Looks up an entry's kind in the calendar's kinds. Every kind row has one,
 * since the procedure checked them all against the rules.
 */
export function kindOf<Kind extends string>(
  kinds: ReadonlyMap<string, CalendarKind<Kind>>,
  kindId: string,
): CalendarKind<Kind> {
  const kind = kinds.get(kindId);
  if (!kind) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Calendar settings are invalid",
    });
  }
  return kind;
}

/**
 * Loads an entry's kind row and its resource with the resource's type code,
 * the relations toEntryDto and compareEntries read. The kind's behaviour
 * comes from the calendar's rules, not the row.
 */
export const entryInclude = {
  kind: true,
  resource: { include: { type: { select: { code: true } } } },
} satisfies Prisma.CalendarEntryInclude;

export type EntryWithRelations = Prisma.CalendarEntryGetPayload<{
  include: typeof entryInclude;
}>;

/**
 * Loads a month's newest PUBLISHED status event, the source of its
 * latestPublication. revision breaks a createdAt tie, since it rises with
 * every status change.
 */
export const latestPublishedEventInclude = {
  statusEvents: {
    where: { type: "PUBLISHED" },
    select: { createdAt: true, actorEmail: true },
    orderBy: [{ createdAt: "desc" }, { revision: "desc" }],
    take: 1,
  },
} satisfies Prisma.CalendarMonthInclude;

type MonthRow = Prisma.CalendarMonthGetPayload<true>;

type MonthWithLatestPublishedEvent = Prisma.CalendarMonthGetPayload<{
  include: typeof latestPublishedEventInclude;
}>;

/** The MonthSummary fields that come from the month row alone. */
export function monthFields(
  month: MonthRow,
): Omit<MonthSummary, "latestPublication"> {
  return {
    id: month.id,
    year: month.year,
    month: month.month,
    status: month.status,
    revision: month.revision,
    lastEditedAt: month.updatedAt,
    lastEditedByEmail: month.updatedByEmail,
  };
}

/**
 * Maps a month row and its newest PUBLISHED status event to a MonthSummary.
 * latestPublication stays set after months.unpublish moves the month back to
 * DRAFT, which is how the editor tells a month back in draft from one never
 * published.
 */
export function toMonthSummary(
  month: MonthWithLatestPublishedEvent,
): MonthSummary {
  const [latest] = month.statusEvents;
  return {
    ...monthFields(month),
    latestPublication: latest
      ? { publishedAt: latest.createdAt, publishedByEmail: latest.actorEmail }
      : null,
  };
}

/** The resource's label, or the kind's label when the entry has no resource. */
export function entryLabel(entry: {
  kind: { label: string };
  resource: { label: string } | null;
}): string {
  return entry.resource?.label ?? entry.kind.label;
}

interface SortableEntry {
  date: Date;
  slotKey: string;
  kind: { sortOrder: number };
  resource: { sortOrder: number } | null;
}

/**
 * Orders entries by date, then kind sortOrder, then resource sortOrder,
 * so a kind's entries on one day sit together, by resource. slotKey breaks
 * ties, so two resources that share a sortOrder always come back in the same
 * order. The editor's month view and the public read both sort with it.
 */
export function compareEntries(a: SortableEntry, b: SortableEntry): number {
  return (
    a.date.getTime() - b.date.getTime() ||
    a.kind.sortOrder - b.kind.sortOrder ||
    (a.resource?.sortOrder ?? 0) - (b.resource?.sortOrder ?? 0) ||
    a.slotKey.localeCompare(b.slotKey)
  );
}

/**
 * Counts the uncancelled entries whose kind has countsTowardTotal, and the
 * distinct dates they fall on (Spec D, Counts). A month with 3 counted entries
 * on 2 dates, 1 cancelled entry and 2 entries of a kind that doesn't count has
 * entryDays 2 and entryCount 3. Cancelled entries don't count, since they
 * won't take place (Spec D, Counts).
 */
export function computeMonthCounts(
  entries: { date: Date; cancelledAt: Date | null; kindId: string }[],
  kinds: ReadonlyMap<string, { countsTowardTotal: boolean }>,
): MonthCounts {
  const counted = entries.filter(
    (entry) =>
      kinds.get(entry.kindId)?.countsTowardTotal && entry.cancelledAt === null,
  );
  const days = new Set(counted.map((entry) => fromDbDate(entry.date)));
  return { entryDays: days.size, entryCount: counted.length };
}

/** Pads a month or day number to two digits, as in "2026-09-07". */
export function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** Formats a month as "YYYY-MM", as in "2026-09". */
export function formatYearMonth({ year, month }: YearMonth): string {
  return `${String(year).padStart(4, "0")}-${pad2(month)}`;
}

/**
 * Returns the holidays in a month, keyed by "YYYY-MM-DD", from the default
 * holiday source for the holidayRegion in the calendar's settings. A calendar
 * with no region has none. No overrides are merged in v1.
 *
 * Throws INTERNAL_SERVER_ERROR when no holiday source covers the region, since
 * that's bad state code, not a bad request.
 */
export function getHolidaysInMonth(
  settings: Pick<CalendarSettings, "holidayRegion">,
  ym: YearMonth,
): Map<IsoDate, string> {
  const prefix = formatYearMonth(ym);
  try {
    const holidays = getHolidays(
      getDefaultHolidaySource(settings.holidayRegion),
      { start: `${prefix}-01`, end: `${prefix}-${pad2(daysInMonth(ym))}` },
    );
    return new Map(holidays.map(({ date, name }) => [date, name]));
  } catch (e) {
    if (e instanceof CalendarRulesError && e.code === "INVALID_SETTINGS") {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Calendar settings are invalid",
        cause: e,
      });
    }
    throw e;
  }
}

/**
 * Maps an entry to the API's EntryDto, with its kind's behaviour from the
 * calendar's rules, flagging it when its date is a holiday.
 */
export function toEntryDto<Kind extends string>(
  entry: EntryWithRelations,
  holidays: Map<IsoDate, string>,
  kinds: ReadonlyMap<string, CalendarKind<Kind>>,
): EntryDto<Kind> {
  const date = fromDbDate(entry.date);
  const kind = kindOf(kinds, entry.kindId);
  return {
    id: entry.id,
    date,
    kind: {
      code: kind.code,
      label: kind.label,
      cancellable: kind.cancellable,
      deletable: kind.deletable,
      countsTowardTotal: kind.countsTowardTotal,
    },
    label: entryLabel(entry),
    resource: entry.resource
      ? {
          id: entry.resource.id,
          code: entry.resource.code,
          label: entry.resource.label,
          typeCode: entry.resource.type.code,
        }
      : null,
    slotKey: entry.slotKey,
    startTime: entry.startTime,
    endTime: entry.endTime,
    source: entry.source,
    cancelled: entry.cancelledAt !== null,
    cancelledAt: entry.cancelledAt,
    cancelledByEmail: entry.cancelledByEmail,
    holidayName: holidays.get(date) ?? null,
    version: entry.version,
    updatedAt: entry.updatedAt,
    updatedByEmail: entry.updatedByEmail,
  };
}

/** A slot's current pattern, with its rules parsed. */
export interface CurrentPattern {
  id: string;
  kindId: string;
  resourceId: string | null;
  slotKey: string;
  version: number;
  rules: PatternRule[];
  startTime: string | null;
  endTime: string | null;
  createdAt: Date;
  createdByEmail: string;
}

function parseStoredRules(patternId: string, rules: unknown): PatternRule[] {
  try {
    return parsePatternRules(rules);
  } catch (e) {
    if (e instanceof CalendarRulesError && e.code === "INVALID_RULE") {
      captureMessage(`Stored calendar pattern ${patternId} has invalid rules`, {
        level: "error",
        tags: { calendarPatternId: patternId },
      });
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "A stored calendar pattern is invalid",
      });
    }
    throw e;
  }
}

/**
 * Returns each slot's highest pattern version in the calendar, keyed by
 * slotKey, with its rules parsed. Every reader of pattern rules goes
 * through this function, so callers only see PatternRule[].
 *
 * Throws INTERNAL_SERVER_ERROR when a stored row's rules don't parse, and sends
 * only the pattern id to Sentry; the rules stay out of logs.
 */
export async function findCurrentPatterns(
  prisma: Pick<CalendarPrismaClient, "calendarEntryPattern">,
  calendarId: string,
): Promise<Map<string, CurrentPattern>> {
  // Prisma applies distinct after the query, so this reads every version. A
  // calendar's pattern history is a few rows per slot, so that stays cheap.
  const rows = await prisma.calendarEntryPattern.findMany({
    where: { calendarId },
    orderBy: [{ slotKey: "asc" }, { version: "desc" }],
    distinct: ["slotKey"],
  });

  const patterns = new Map<string, CurrentPattern>();
  for (const row of rows) {
    patterns.set(row.slotKey, {
      id: row.id,
      kindId: row.kindId,
      resourceId: row.resourceId,
      slotKey: row.slotKey,
      version: row.version,
      rules: parseStoredRules(row.id, row.rules),
      startTime: row.startTime,
      endTime: row.endTime,
      createdAt: row.createdAt,
      createdByEmail: row.createdByEmail,
    });
  }
  return patterns;
}

/**
 * The months on the public calendar: the calendar's PUBLISHED months. A
 * month back in DRAFT after Edit month is off it. Every public read filters
 * with it.
 */
export function publicMonthWhere(calendarId: string) {
  return {
    calendarId,
    status: "PUBLISHED",
  } satisfies Prisma.CalendarMonthWhereInput;
}

/**
 * Returns every PUBLISHED month of the calendar, past months included, in
 * ascending order. There's no window: every published month stays
 * reachable.
 */
export async function findPublishedMonths(
  prisma: Pick<CalendarPrismaClient, "calendarMonth">,
  calendarId: string,
): Promise<{ id: string; year: number; month: number }[]> {
  return prisma.calendarMonth.findMany({
    where: publicMonthWhere(calendarId),
    select: { id: true, year: true, month: true },
    orderBy: [{ year: "asc" }, { month: "asc" }],
  });
}
