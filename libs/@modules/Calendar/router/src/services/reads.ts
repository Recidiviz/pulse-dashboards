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
import { currentYearMonth, entrySlotKey } from "~@modules/Calendar/rules";

import type { ResolvedCalendar } from "../procedures";
import type {
  CalendarConfig,
  CurrentPatternRow,
  MonthDetail,
  MonthListPage,
} from "../types";
import {
  compareEntries,
  computeMonthCounts,
  CurrentPattern,
  entryInclude,
  findCurrentPatterns,
  getHolidaysInMonth,
  kindsById,
  latestPublishedEventInclude,
  toEntryDto,
  toMonthSummary,
} from "./helpers";
import { listMonths, ListMonthsOptions } from "./monthsList";

/**
 * The engine's reads. Each takes the calendar a state's procedure resolved,
 * with its rules, and scopes every query to its id.
 */

/**
 * One page of the calendar's months from the current month in its timezone
 * onwards. Editors never see past months.
 */
export function listEditorMonths(
  prisma: Pick<CalendarPrismaClient, "calendarMonth">,
  calendar: Pick<ResolvedCalendar, "id" | "rules">,
  options: Omit<ListMonthsOptions, "from">,
): Promise<MonthListPage> {
  return listMonths(prisma, calendar.id, {
    ...options,
    from: currentYearMonth(calendar.rules.settings.timezone),
  });
}

/**
 * One month as it is now: its entries in order with holiday flags, its live
 * counts and when it was last published, or null when the month doesn't
 * exist.
 */
export async function getMonth<Kind extends string>(
  prisma: Pick<CalendarPrismaClient, "calendarMonth">,
  calendar: ResolvedCalendar<Kind>,
  { year, month }: { year: number; month: number },
): Promise<MonthDetail<Kind> | null> {
  const row = await prisma.calendarMonth.findUnique({
    where: {
      calendarId_year_month: { calendarId: calendar.id, year, month },
    },
    include: {
      ...latestPublishedEventInclude,
      entries: { include: entryInclude },
    },
  });
  if (!row) return null;

  const kinds = kindsById(calendar.kinds);
  const holidays = getHolidaysInMonth(calendar.rules.settings, { year, month });
  const entries = [...row.entries].sort(compareEntries);
  return {
    ...toMonthSummary(row),
    entries: entries.map((entry) => toEntryDto(entry, holidays, kinds)),
    holidays: [...holidays].map(([date, name]) => ({ date, name })),
    counts: computeMonthCounts(entries, kinds),
  };
}

/**
 * The calendar's settings from its state's code (never editorRoute), its
 * entry types with their behaviour, its resource types, and its active
 * resources with their full names.
 */
export async function getConfig<Kind extends string>(
  prisma: Pick<CalendarPrismaClient, "calendar">,
  calendar: ResolvedCalendar<Kind>,
): Promise<CalendarConfig<Kind>> {
  const row = await prisma.calendar.findUniqueOrThrow({
    where: { id: calendar.id },
    select: {
      resourceTypes: {
        select: { code: true, label: true, sortOrder: true },
        orderBy: [{ sortOrder: "asc" }, { code: "asc" }],
      },
      resources: {
        where: { isActive: true },
        include: { type: { select: { code: true } } },
        orderBy: [{ sortOrder: "asc" }, { code: "asc" }],
      },
    },
  });
  const { settings } = calendar.rules;

  return {
    calendar: {
      code: calendar.code,
      name: calendar.name,
      timezone: settings.timezone,
      weekStartsOn: settings.weekStartsOn,
      allowedWeekdays: settings.allowedWeekdays,
      weekNumbering: settings.weekNumbering,
      holidayRegion: settings.holidayRegion,
      holidayPolicy: settings.holidayPolicy,
    },
    kinds: calendar.kinds.map((kind) => ({
      id: kind.id,
      code: kind.code,
      label: kind.label,
      requiresResource: kind.requiresResource,
      cancellable: kind.cancellable,
      deletable: kind.deletable,
      isPublic: kind.isPublic,
      countsTowardTotal: kind.countsTowardTotal,
      sortOrder: kind.sortOrder,
    })),
    resourceTypes: row.resourceTypes,
    resources: row.resources.map((resource) => ({
      id: resource.id,
      code: resource.code,
      name: resource.name,
      label: resource.label,
      typeCode: resource.type.code,
      sortOrder: resource.sortOrder,
    })),
  };
}

function toPatternDto(
  pattern: CurrentPattern | undefined,
): CurrentPatternRow["pattern"] {
  if (!pattern) return null;
  return {
    id: pattern.id,
    version: pattern.version,
    rules: pattern.rules,
    startTime: pattern.startTime,
    endTime: pattern.endTime,
    createdAt: pattern.createdAt,
    createdByEmail: pattern.createdByEmail,
  };
}

/**
 * One row per pattern slot, in kind sortOrder: a kind that requires a
 * resource has a row per active resource, in resource sortOrder, and a kind
 * with no resource has one row. A slot with no pattern has pattern null.
 */
export async function listCurrentPatterns<Kind extends string>(
  prisma: Pick<
    CalendarPrismaClient,
    "calendarResource" | "calendarEntryPattern"
  >,
  calendar: ResolvedCalendar<Kind>,
): Promise<CurrentPatternRow<Kind>[]> {
  const [resources, patterns] = await Promise.all([
    prisma.calendarResource.findMany({
      where: { calendarId: calendar.id, isActive: true },
      include: { type: { select: { code: true } } },
      orderBy: [{ sortOrder: "asc" }, { code: "asc" }],
    }),
    findCurrentPatterns(prisma, calendar.id),
  ]);

  return calendar.kinds.flatMap((kind) => {
    const row = (
      resource: CurrentPatternRow["resource"],
    ): CurrentPatternRow<Kind> => {
      const slotKey = entrySlotKey({
        kindCode: kind.code,
        resourceCode: resource?.code ?? null,
      });
      return {
        slotKey,
        kind: { code: kind.code, label: kind.label },
        resource,
        pattern: toPatternDto(patterns.get(slotKey)),
      };
    };
    if (!kind.requiresResource) return [row(null)];
    return resources.map((resource) =>
      row({
        id: resource.id,
        code: resource.code,
        label: resource.label,
        typeCode: resource.type.code,
        sortOrder: resource.sortOrder,
      }),
    );
  });
}
