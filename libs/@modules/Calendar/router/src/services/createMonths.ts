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
import {
  CalendarRulesError,
  currentYearMonth,
  generateMonthDraft,
  MonthDraft,
  YearMonth,
} from "~@modules/Calendar/rules";

import {
  invalidDraftInputError,
  monthCreatedConcurrentlyError,
  monthOutsideAddWindowError,
  monthsAlreadyExistError,
} from "../calendar.errors";
import { isUniqueViolationOn } from "../errors";
import type { ResolvedCalendar } from "../procedures";
import type { CreateMonthsResult } from "../types";
import { addMonthOptions, addMonthWindow } from "./addMonthOptions";
import { findCurrentPatterns, getHolidaysInMonth, kindsById } from "./helpers";
import { writeDraftMonth } from "./writeDraftMonth";

function monthKey({ year, month }: YearMonth): number {
  return year * 12 + month;
}

function findExistingMonths(
  prisma: Pick<CalendarPrismaClient, "calendarMonth">,
  calendarId: string,
  months: readonly YearMonth[],
): Promise<YearMonth[]> {
  return prisma.calendarMonth.findMany({
    where: {
      calendarId,
      OR: months.map(({ year, month }) => ({ year, month })),
    },
    select: { year: true, month: true },
    orderBy: [{ year: "asc" }, { month: "asc" }],
  });
}

/**
 * Returns the months the Add month modal can offer: the current month in the
 * calendar's timezone and the next 12, minus the calendar's existing months.
 */
export async function listAddMonthOptions(
  prisma: Pick<CalendarPrismaClient, "calendarMonth">,
  calendar: Pick<ResolvedCalendar, "id" | "rules">,
): Promise<YearMonth[]> {
  const current = currentYearMonth(calendar.rules.settings.timezone);
  const existing = await findExistingMonths(
    prisma,
    calendar.id,
    addMonthWindow(current),
  );
  return addMonthOptions(current, existing);
}

/**
 * Generates each requested month's draft from the calendar's current
 * patterns. Runs before any write, so bad reference data fails the request
 * with nothing written.
 */
async function generateDrafts(
  prisma: Pick<
    CalendarPrismaClient,
    "calendarEntryPattern" | "calendarResource"
  >,
  calendar: ResolvedCalendar,
  months: readonly YearMonth[],
): Promise<MonthDraft[]> {
  const [patterns, resources] = await Promise.all([
    findCurrentPatterns(prisma, calendar.id),
    prisma.calendarResource.findMany({ where: { calendarId: calendar.id } }),
  ]);

  return months.map((yearMonth) => {
    const holidays = getHolidaysInMonth(calendar.rules.settings, yearMonth);
    try {
      // The calendar's rules carry its settings, its entry types and its
      // state's adjustDraftMonth, which the generator runs last.
      return generateMonthDraft({
        calendarId: calendar.id,
        yearMonth,
        rules: calendar.rules,
        kinds: calendar.kinds.map(
          ({ id, calendarId, code, label, sortOrder }) => ({
            id,
            calendarId,
            code,
            label,
            sortOrder,
          }),
        ),
        resources,
        patterns: [...patterns.values()],
        holidays: [...holidays].map(([date, name]) => ({ date, name })),
      });
    } catch (e) {
      if (
        e instanceof CalendarRulesError &&
        (e.code === "INVALID_DRAFT_INPUT" || e.code === "INVALID_RULE")
      ) {
        // The calendar id only: the error's text names slots, and no emails
        // belong in logs.
        console.error("Calendar draft input is invalid", {
          calendarId: calendar.id,
          year: yearMonth.year,
          month: yearMonth.month,
        });
        throw invalidDraftInputError(e);
      }
      throw e;
    }
  });
}

/**
 * Creates the requested months as DRAFT, each filled from the calendar's
 * current patterns and its state's rules, with no entries on holidays or on
 * weekdays its settings don't allow, and returns them in ascending order with the
 * generator's notices. Every month, entry and status event is written in one
 * transaction, so a request creates all its months or none.
 *
 * Throws BAD_REQUEST for a month outside the Add month window, CONFLICT for a
 * month that exists or that another editor creates meanwhile, and
 * INTERNAL_SERVER_ERROR when the stored patterns are invalid.
 */
export async function createMonths(
  prisma: CalendarPrismaClient,
  calendar: ResolvedCalendar,
  email: string,
  requested: readonly YearMonth[],
): Promise<CreateMonthsResult> {
  const addWindow = addMonthWindow(
    currentYearMonth(calendar.rules.settings.timezone),
  );
  const allowed = new Set(addWindow.map(monthKey));
  if (requested.some((ym) => !allowed.has(monthKey(ym)))) {
    throw monthOutsideAddWindowError(
      addWindow[0],
      addWindow[addWindow.length - 1],
    );
  }
  const months = [...requested].sort((a, b) => monthKey(a) - monthKey(b));

  const existing = await findExistingMonths(prisma, calendar.id, months);
  if (existing.length > 0) throw monthsAlreadyExistError(existing);

  const drafts = await generateDrafts(prisma, calendar, months);

  let monthIds: string[];
  try {
    monthIds = await prisma.$transaction(async (tx) => {
      const ids: string[] = [];
      for (const draft of drafts) {
        // One month at a time, so a failure stops the rest before the
        // rollback.
        // eslint-disable-next-line no-await-in-loop
        const monthId = await writeDraftMonth(tx, {
          calendarId: calendar.id,
          draft,
          email,
        });
        ids.push(monthId);
      }
      return ids;
    });
  } catch (e) {
    // The unique (calendarId, year, month) index rejects a month another
    // editor created after the existence check above. Any other unique
    // violation, such as two drafted entries in one slot, is a bug in the
    // draft, so it fails as itself rather than as a race.
    if (isUniqueViolationOn(e, ["calendarId", "year", "month"])) {
      throw monthCreatedConcurrentlyError();
    }
    throw e;
  }

  const kinds = kindsById(calendar.kinds);
  const created = drafts.map((draft, i) => ({
    id: monthIds[i],
    ...draft.yearMonth,
    // Counted the way months.get counts entryCount. A new entry is never
    // cancelled, so only the kind decides.
    entryCount: draft.entries.filter(
      (entry) => kinds.get(entry.kindId)?.countsTowardTotal,
    ).length,
    notices: draft.notices,
  }));

  // Ids and counts only: no emails in logs.
  console.info("Calendar months created", {
    months: created.map(({ id, entryCount }) => ({ id, entryCount })),
  });
  return { created };
}
