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

/**
 * Colorado's changes to a generated Parole Board draft, the rules its patterns
 * can't express. generateMonthDraft runs them last, through
 * US_CO_PAROLE_BOARD_RULES.adjustDraftMonth. The generic draft has already
 * skipped holidays and weekends; Full Board every Friday and the Business
 * Meeting on the 3rd Friday come from patterns.
 */

import { weekdayOf } from "../../dates";
import { sortDraftEntries } from "../../draft/generateMonthDraft";
import { formatNoticeDate, joinLabels } from "../../draft/notices";
import type {
  DraftEntry,
  DraftKind,
  DraftNotice,
  GenerateMonthDraftInput,
  MonthDraft,
} from "../../draft/types";
import { expandPatternRules } from "../../recurring";
import { entrySlotKey } from "../../storage/entries";
import { parsePatternRules } from "../../storage/patternRules";
import type { IsoDate, YearMonth } from "../../types";
import { resolvePatternRule } from "../../weeks";
import type { UsCoParoleBoardKindCode } from "./entryTypes";

/** Whether kind has the given Colorado kind code. */
function isKind(
  kind: DraftKind | undefined,
  code: UsCoParoleBoardKindCode,
): kind is DraftKind {
  return kind?.code === code;
}

/** The month's 3rd Thursday, counted as the Board counts weeks. */
export function thirdThursday(ym: YearMonth): IsoDate {
  return resolvePatternRule(
    ym,
    { type: "weekOfMonth", week: 3, weekday: "THURSDAY" },
    { weekStartsOn: "MONDAY", weekNumbering: "NTH_WEEKDAY_IN_MONTH" },
  );
}

/**
 * The hearings the generic draft skipped because they fell on a Monday
 * holiday, rebuilt from the patterns the generator already checked.
 */
function hearingsOnMondayHolidays(
  draft: MonthDraft,
  input: GenerateMonthDraftInput,
): DraftEntry[] {
  const mondayHolidays = new Set(
    draft.holidays
      .map(({ date }) => date)
      .filter((date) => weekdayOf(date) === "MONDAY"),
  );
  if (mondayHolidays.size === 0) return [];
  const kindsById = new Map(input.kinds.map((kind) => [kind.id, kind]));
  const resourcesById = new Map(input.resources.map((r) => [r.id, r]));
  const skipped: DraftEntry[] = [];
  for (const pattern of input.patterns) {
    const kind = kindsById.get(pattern.kindId);
    const resource =
      pattern.resourceId === null
        ? undefined
        : resourcesById.get(pattern.resourceId);
    if (!isKind(kind, "HEARING") || !resource?.isActive) continue;
    const rules = parsePatternRules(pattern.rules);
    // Two rules of one pattern can make the same Monday, as in
    // generateMonthDraft. The slot skipped one hearing that day, so one moves.
    const seenDates = new Set<string>();
    for (const { date, inMonth } of expandPatternRules(
      draft.yearMonth,
      rules,
      input.rules.settings,
    )) {
      if (!inMonth || !mondayHolidays.has(date) || seenDates.has(date)) {
        continue;
      }
      seenDates.add(date);
      skipped.push({
        date,
        kindId: kind.id,
        kindCode: kind.code,
        resourceId: resource.id,
        slotKey: entrySlotKey({
          kindCode: kind.code,
          resourceCode: resource.code,
        }),
        startTime: pattern.startTime,
        endTime: pattern.endTime,
        source: "PATTERN",
      });
    }
  }
  return skipped;
}

/** The Full Board entry for date, with the Friday pattern's times, if the calendar has a Full Board pattern. */
function fullBoardOn(
  date: IsoDate,
  input: GenerateMonthDraftInput,
): DraftEntry | null {
  const kind = input.kinds.find((kind) => isKind(kind, "FULL_BOARD"));
  if (!kind) return null;
  const pattern = input.patterns.find(({ kindId }) => kindId === kind.id);
  if (!pattern) return null;
  return {
    date,
    kindId: kind.id,
    kindCode: kind.code,
    resourceId: null,
    slotKey: kind.code,
    startTime: pattern.startTime,
    endTime: pattern.endTime,
    source: "PATTERN",
  };
}

/** A moved entry that wasn't added, and why. */
interface NotMoved {
  entry: DraftEntry;
  /** "taken": its slot already has the new day. "holiday": the new day is one. */
  reason: "taken" | "holiday";
}

/**
 * The ENTRIES_NOT_MOVED copy, grouped by date and reason, e.g. "2 moved
 * entries weren't added: FCF and CTCF would fall on Thursday, September 17,
 * a holiday."
 */
function entriesNotMovedMessage(
  notMoved: readonly NotMoved[],
  input: GenerateMonthDraftInput,
): string {
  const labels = new Map<string, string>([
    ...input.kinds.map(({ id, label }): [string, string] => [id, label]),
    ...input.resources.map(({ id, label }): [string, string] => [id, label]),
  ]);
  const groups = new Map<
    string,
    { date: IsoDate; reason: NotMoved["reason"]; labels: string[] }
  >();
  for (const { entry, reason } of notMoved) {
    const key = `${entry.date} ${reason}`;
    const group = groups.get(key) ?? { date: entry.date, reason, labels: [] };
    group.labels.push(labels.get(entry.resourceId ?? entry.kindId) ?? "");
    groups.set(key, group);
  }
  const parts = [...groups.values()].map(({ date, reason, labels: names }) =>
    reason === "holiday"
      ? `${joinLabels(names)} would fall on ${formatNoticeDate(date)}, a holiday`
      : `${joinLabels(names)} ${names.length === 1 ? "is" : "are"} already on ${formatNoticeDate(date)}`,
  );
  const count = notMoved.length;
  return `${count} moved ${count === 1 ? "entry wasn't" : "entries weren't"} added: ${parts.join("; ")}.`;
}

/**
 * Colorado's adjustDraftMonth: the 3rd Thursday is a Full Board day,
 * unless a Monday holiday in the month skipped generated hearings and at least
 * one of them moves to the 3rd Thursday. Then that day has no Full Board. A
 * Monday holiday with no hearings, or whose hearings all stay off the 3rd
 * Thursday, leaves the Full Board in place (Spec D, 3rd Thursday).
 *
 * Nothing moves onto a holiday, and a moved hearing whose slot already has the
 * 3rd Thursday isn't added, so (date, slotKey) stays unique. Either way the
 * draft gets an ENTRIES_NOT_MOVED notice naming the hearing, so the editor can
 * place it by hand.
 *
 * Nothing here handles dates past month end: Colorado counts weeks as the Nth
 * weekday of the month, so weeks 1 to 4 always fall inside it.
 */
export function adjustUsCoParoleBoardDraft(
  draft: MonthDraft,
  input: GenerateMonthDraftInput,
): MonthDraft {
  const holidayDates = new Set(draft.holidays.map(({ date }) => date));
  const entries = [...draft.entries];
  const taken = new Set(
    entries.map(({ date, slotKey }) => `${date} ${slotKey}`),
  );
  const notMoved: NotMoved[] = [];

  /** Adds a moved entry, or records why it can't go on its new day. */
  const add = (entry: DraftEntry) => {
    if (holidayDates.has(entry.date)) {
      notMoved.push({ entry, reason: "holiday" });
      return;
    }
    const key = `${entry.date} ${entry.slotKey}`;
    if (taken.has(key)) {
      notMoved.push({ entry, reason: "taken" });
      return;
    }
    taken.add(key);
    entries.push(entry);
  };

  const thursday = thirdThursday(draft.yearMonth);
  const entryCountBeforeMoves = entries.length;
  for (const hearing of hearingsOnMondayHolidays(draft, input)) {
    add({ ...hearing, date: thursday });
  }
  if (entries.length === entryCountBeforeMoves) {
    // No hearing moved, so the 3rd Thursday keeps its Full Board. It isn't
    // moved from anywhere, so a holiday or an existing Full Board just means
    // there isn't one.
    const fullBoard = fullBoardOn(thursday, input);
    const key = `${thursday} ${fullBoard?.slotKey}`;
    if (fullBoard && !holidayDates.has(thursday) && !taken.has(key)) {
      taken.add(key);
      entries.push(fullBoard);
    }
  }

  const notices: DraftNotice[] = [...draft.notices];
  if (notMoved.length > 0) {
    notices.push({
      code: "ENTRIES_NOT_MOVED",
      message: entriesNotMovedMessage(notMoved, input),
      count: notMoved.length,
    });
  }
  return {
    ...draft,
    entries: sortDraftEntries(entries, input),
    notices,
  };
}
