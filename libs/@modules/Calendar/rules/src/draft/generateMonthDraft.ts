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

import { weekdayOf } from "../dates";
import { CalendarRulesError } from "../errors";
import { getHolidays } from "../holidays/getHolidays";
import { staticHolidaySource } from "../holidays/staticHolidaySource";
import { Holiday } from "../holidays/types";
import { assertYearMonth, firstOfMonth, TIME_PATTERN } from "../plainDates";
import { expandPatternRules } from "../recurring";
import { assertEntryShape, entrySlotKey } from "../storage/entries";
import { parsePatternRules } from "../storage/patternRules";
import { PatternRule, YearMonth } from "../types";
import {
  entriesOutsideMonthMessage,
  kindWithoutPatternMessage,
} from "./notices";
import {
  DraftEntry,
  DraftKind,
  DraftNotice,
  DraftResource,
  GenerateMonthDraftInput,
  MonthDraft,
  OutsideMonthEntry,
} from "./types";

/** A kind row with its entry type's requiresResource. */
type TypedKind = DraftKind & { requiresResource: boolean };

/** A pattern after validation, with its kind, resource, slotKey and parsed rules. */
interface CheckedPattern {
  kind: TypedKind;
  resource: DraftResource | null;
  slotKey: string;
  rules: PatternRule[];
  startTime: string | null;
  endTime: string | null;
}

function invalidInput(message: string): CalendarRulesError {
  return new CalendarRulesError("INVALID_DRAFT_INPUT", message);
}

/** Runs check, rethrowing any CalendarRulesError as INVALID_DRAFT_INPUT with context in front. */
function asDraftInput<T>(context: string, check: () => T): T {
  try {
    return check();
  } catch (error) {
    if (error instanceof CalendarRulesError) {
      throw invalidInput(`${context}: ${error.message}`);
    }
    throw error;
  }
}

/** Returns rows by id, throwing INVALID_DRAFT_INPUT when two rows share an id or a code. */
function indexById<T extends { id: string; code: string }>(
  rows: readonly T[],
  listName: string,
): Map<string, T> {
  const byId = new Map<string, T>();
  const codes = new Set<string>();
  for (const row of rows) {
    if (byId.has(row.id)) {
      throw invalidInput(`Two ${listName} have id ${row.id}`);
    }
    if (codes.has(row.code)) {
      throw invalidInput(`Two ${listName} have code ${row.code}`);
    }
    byId.set(row.id, row);
    codes.add(row.code);
  }
  return byId;
}

function assertTimes(
  slotKey: string,
  startTime: string | null,
  endTime: string | null,
): void {
  for (const time of [startTime, endTime]) {
    if (time !== null && !TIME_PATTERN.test(time)) {
      throw invalidInput(
        `Pattern ${slotKey}: expected an HH:mm time, got ${JSON.stringify(time)}`,
      );
    }
  }
  if (endTime !== null && (startTime === null || startTime >= endTime)) {
    throw invalidInput(
      `Pattern ${slotKey}: endTime needs a startTime that comes before it`,
    );
  }
}

/** Validates every pattern and returns those on active resources, or on no resource. */
function checkPatterns(
  input: GenerateMonthDraftInput,
  kindsById: ReadonlyMap<string, TypedKind>,
  resourcesById: ReadonlyMap<string, DraftResource>,
): CheckedPattern[] {
  const slotKeys = new Set<string>();
  const checked: CheckedPattern[] = [];
  input.patterns.forEach((pattern, index) => {
    const kind = kindsById.get(pattern.kindId);
    if (!kind) {
      throw invalidInput(
        `Pattern ${index} names unknown kind ${pattern.kindId}`,
      );
    }
    const resource =
      pattern.resourceId === null
        ? null
        : resourcesById.get(pattern.resourceId);
    if (resource === undefined) {
      throw invalidInput(
        `Pattern ${index} names unknown resource ${pattern.resourceId}`,
      );
    }
    const slotKey = asDraftInput(`Pattern ${index}`, () =>
      entrySlotKey({
        kindCode: kind.code,
        resourceCode: resource?.code ?? null,
      }),
    );
    if (slotKeys.has(slotKey)) {
      throw invalidInput(`Two patterns have slotKey ${slotKey}`);
    }
    slotKeys.add(slotKey);
    const rules = asDraftInput(`Pattern ${slotKey}`, () =>
      parsePatternRules(pattern.rules),
    );
    assertTimes(slotKey, pattern.startTime, pattern.endTime);

    // An inactive resource keeps its pattern but gets no new entries.
    if (resource && !resource.isActive) return;
    asDraftInput(`Pattern ${slotKey}`, () =>
      assertEntryShape({
        calendarId: input.calendarId,
        kind,
        resource,
        isNew: true,
      }),
    );
    checked.push({
      kind,
      resource,
      slotKey,
      rules,
      startTime: pattern.startTime,
      endTime: pattern.endTime,
    });
  });
  return checked;
}

/** Returns the holidays inside ym, one per date, sorted. */
function holidaysInMonth(
  ym: YearMonth,
  holidays: readonly Holiday[],
): Holiday[] {
  const first = firstOfMonth(ym);
  const range = {
    start: first.toString(),
    end: first.with({ day: first.daysInMonth }).toString(),
  };
  return asDraftInput("Holidays", () =>
    getHolidays(staticHolidaySource(holidays), range),
  );
}

interface SortKey {
  date: string;
  kindId: string;
  resourceId: string | null;
  slotKey: string;
}

/**
 * Gives each kind row its entry type's requiresResource, throwing
 * INVALID_DRAFT_INPUT for a kind the calendar's rules don't list.
 */
function typeKinds(
  kindsById: ReadonlyMap<string, DraftKind>,
  rules: GenerateMonthDraftInput["rules"],
): Map<string, TypedKind> {
  const entryTypes = new Map(rules.entryTypes.map((type) => [type.code, type]));
  const typed = new Map<string, TypedKind>();
  for (const [id, kind] of kindsById) {
    const type = entryTypes.get(kind.code);
    if (!type) {
      throw invalidInput(
        `Kind ${kind.code} has no entry type in the calendar's rules`,
      );
    }
    typed.set(id, { ...kind, requiresResource: type.requiresResource });
  }
  return typed;
}

/**
 * Orders rows by date, kind sortOrder, resource sortOrder and slotKey, the
 * order the calendar read queries use.
 */
function compareRows(
  kindsById: ReadonlyMap<string, DraftKind>,
  resourcesById: ReadonlyMap<string, DraftResource>,
) {
  const kindOrder = (row: SortKey) => kindsById.get(row.kindId)?.sortOrder ?? 0;
  const resourceOrder = (row: SortKey) =>
    row.resourceId === null
      ? 0
      : resourcesById.get(row.resourceId)?.sortOrder ?? 0;
  return (a: SortKey, b: SortKey): number =>
    a.date.localeCompare(b.date) ||
    kindOrder(a) - kindOrder(b) ||
    resourceOrder(a) - resourceOrder(b) ||
    a.slotKey.localeCompare(b.slotKey);
}

/**
 * Returns the entries for a new draft month, from each slot's pattern, and
 * notices for what the draft leaves out. Pure: no I/O and no clock, so the
 * same input always gives the same output.
 *
 * For September 2026 with Sunday weeks and FIRST_FULL_WEEK, a visit pattern
 * for room A on the 1st and 2nd Monday at 09:00 and a staff meeting pattern
 * for every Friday give (fields abridged), with Labor Day on September 7:
 *
 *   date        slotKey        startTime
 *   2026-09-04  STAFF_MEETING  null
 *   2026-09-11  STAFF_MEETING  null
 *   2026-09-14  VISIT:A        09:00
 *   ...
 *
 * Every kind's dates come from its patterns; the generator treats no kind
 * code specially. It skips every date that is a holiday or isn't one of the
 * settings' allowedWeekdays, without moving the entry elsewhere: the editor
 * sees the holidays on the month and adds any replacement by hand.
 * A date a rule makes in the next month goes to outsideMonth, not entries,
 * with an ENTRIES_OUTSIDE_MONTH notice, and a kind with no pattern gets a
 * KIND_WITHOUT_PATTERN notice. Patterns on inactive resources make nothing.
 *
 * The settings and entry types come from input.rules, the calendar's state
 * code, and input.rules.adjustDraftMonth, when set, gets the last word.
 *
 * Throws INVALID_DRAFT_INPUT, naming the slotKey where there is one, when the
 * month, kinds, resources, patterns or holidays are invalid, or a kind has no
 * entry type in the rules. The input comes from stored rows, so this means bad
 * data, not a bad request.
 */
export function generateMonthDraft(input: GenerateMonthDraftInput): MonthDraft {
  const { yearMonth } = input;
  const { settings } = input.rules;
  asDraftInput("yearMonth", () => assertYearMonth(yearMonth));
  const kindsById = typeKinds(indexById(input.kinds, "kinds"), input.rules);
  const resourcesById = indexById(input.resources, "resources");
  const patterns = checkPatterns(input, kindsById, resourcesById);

  const holidays = holidaysInMonth(yearMonth, input.holidays);
  const holidayDates = new Set(holidays.map(({ date }) => date));
  const allowedWeekdays = new Set(settings.allowedWeekdays);

  const entries: DraftEntry[] = [];
  const outsideMonth: OutsideMonthEntry[] = [];
  for (const {
    kind,
    resource,
    slotKey,
    rules,
    startTime,
    endTime,
  } of patterns) {
    const seenDates = new Set<string>();
    for (const { date, rule, inMonth } of expandPatternRules(
      yearMonth,
      rules,
      settings,
    )) {
      // Two rules of one pattern can make the same date, e.g. every Friday
      // and the week-1 Friday. The slot gets one entry that day.
      if (seenDates.has(date)) continue;
      seenDates.add(date);
      const slot = {
        date,
        kindId: kind.id,
        kindCode: kind.code,
        resourceId: resource?.id ?? null,
        slotKey,
        startTime,
        endTime,
      };
      if (!allowedWeekdays.has(weekdayOf(date))) continue;
      if (inMonth) {
        if (holidayDates.has(date)) continue;
        entries.push({ ...slot, source: "PATTERN" });
      } else {
        outsideMonth.push({
          ...slot,
          label: resource?.label ?? kind.label,
          rule,
        });
      }
    }
  }

  const compare = compareRows(kindsById, resourcesById);
  entries.sort(compare);
  outsideMonth.sort(compare);

  const kindsWithPattern = new Set(input.patterns.map(({ kindId }) => kindId));
  const notices: DraftNotice[] = [...kindsById.values()]
    .filter(({ id }) => !kindsWithPattern.has(id))
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((kind) => ({
      code: "KIND_WITHOUT_PATTERN",
      kindCode: kind.code,
      message: kindWithoutPatternMessage(kind),
    }));
  if (outsideMonth.length > 0) {
    const kindLabels = new Map(
      [...kindsById.values()].map(({ id, label }) => [id, label]),
    );
    notices.push({
      code: "ENTRIES_OUTSIDE_MONTH",
      message: entriesOutsideMonthMessage(yearMonth, outsideMonth, kindLabels),
      count: outsideMonth.length,
    });
  }

  const draft: MonthDraft = {
    yearMonth: { year: yearMonth.year, month: yearMonth.month },
    entries,
    outsideMonth,
    holidays,
    notices,
  };
  const adjustDraftMonth =
    input.rules.adjustDraftMonth ?? ((generated: MonthDraft) => generated);
  return adjustDraftMonth(draft, input);
}

/**
 * Sorts draft entries in place by date, kind sortOrder, resource sortOrder and
 * slotKey, the order generateMonthDraft returns, and returns them. A state's
 * adjustDraftMonth calls it after adding entries.
 */
export function sortDraftEntries<T extends DraftEntry>(
  entries: T[],
  input: Pick<GenerateMonthDraftInput, "kinds" | "resources">,
): T[] {
  return entries.sort(
    compareRows(
      new Map(input.kinds.map((kind) => [kind.id, kind])),
      new Map(input.resources.map((resource) => [resource.id, resource])),
    ),
  );
}
