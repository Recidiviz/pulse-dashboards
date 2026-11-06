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

// Copy for the notices generateMonthDraft returns.

import { MONTH_NAMES, weekdayName } from "../dateNames";
import { plainDateWeekday, toPlainDate } from "../plainDates";
import { IsoDate, YearMonth } from "../types";
import { DraftKind, OutsideMonthEntry } from "./types";

/** Returns a date as "Thursday, October 1", with no year. */
export function formatNoticeDate(date: IsoDate): string {
  const plainDate = toPlainDate(date);
  return `${weekdayName(plainDateWeekday(plainDate))}, ${MONTH_NAMES[plainDate.month - 1]} ${plainDate.day}`;
}

/** Joins labels as "A", "A and B", or "A, B, and C". */
export function joinLabels(labels: readonly string[]): string {
  if (labels.length <= 2) return labels.join(" and ");
  return `${labels.slice(0, -1).join(", ")}, and ${labels[labels.length - 1]}`;
}

/**
 * Returns the KIND_WITHOUT_PATTERN copy, e.g. "Business Mtg entries weren't
 * added because their schedule isn't set yet. Add them by hand if this month
 * needs any."
 */
export function kindWithoutPatternMessage(kind: Pick<DraftKind, "label">) {
  return `${kind.label} entries weren't added because their schedule isn't set yet. Add them by hand if this month needs any.`;
}

/**
 * Returns the ENTRIES_OUTSIDE_MONTH copy for a non-empty list, grouped by
 * date in list order, e.g. "4 hearings fall after September ends and weren't
 * added: DCC, DRDC, SCC, and ICCS/Pueblo on Thursday, October 1."
 *
 * The noun is the kind's label in lower case plus "s" when every entry has
 * one kind, and "entries" when the list mixes kinds.
 *
 * Args:
 *   yearMonth: The draft's month, named in the copy.
 *   outsideMonth: The left-out entries, sorted by date.
 *   kindLabels: Each kind's label by kind id.
 */
export function entriesOutsideMonthMessage(
  yearMonth: YearMonth,
  outsideMonth: readonly OutsideMonthEntry[],
  kindLabels: ReadonlyMap<string, string>,
): string {
  const count = outsideMonth.length;
  const kindIds = new Set(outsideMonth.map(({ kindId }) => kindId));
  const [onlyKindId] = kindIds;
  const singleKindLabel =
    kindIds.size === 1 ? kindLabels.get(onlyKindId)?.toLowerCase() : undefined;
  let noun = count === 1 ? "entry" : "entries";
  if (singleKindLabel) {
    noun = count === 1 ? singleKindLabel : `${singleKindLabel}s`;
  }

  const labelsByDate = new Map<IsoDate, string[]>();
  for (const { date, label } of outsideMonth) {
    const labels = labelsByDate.get(date);
    if (labels) {
      labels.push(label);
    } else {
      labelsByDate.set(date, [label]);
    }
  }
  const groups = [...labelsByDate].map(
    ([date, labels]) => `${joinLabels(labels)} on ${formatNoticeDate(date)}`,
  );

  return `${count} ${noun} ${count === 1 ? "falls" : "fall"} after ${MONTH_NAMES[yearMonth.month - 1]} ends and ${count === 1 ? "wasn't" : "weren't"} added: ${groups.join("; ")}.`;
}
