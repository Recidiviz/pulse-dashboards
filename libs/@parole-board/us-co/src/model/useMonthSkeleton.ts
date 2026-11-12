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

import { useMemo } from "react";

import { expandPatternRules } from "~@modules/Calendar/rules";
import {
  thirdThursday,
  US_CO_PAROLE_BOARD_SETTINGS,
  US_CO_REFERENCE_DATA,
} from "~@modules/Calendar/rules/us_co/parole_board";
import type { ChipsOn, YearMonthOption } from "~@parole-board/common";

import { useIsNarrowViewport } from "../MonthCalendar/useIsNarrowViewport";

/**
 * How many entries Colorado's patterns put on each day of the month, by
 * "YYYY-MM-DD": each pattern's dates, plus the Full Board meeting Colorado's
 * rules add on the 3rd Thursday. It leaves out holidays, which the browser
 * doesn't know, so a month whose Monday holiday moves hearings to the 3rd
 * Thursday has one more entry there than this counts.
 */
export function expectedEntriesPerDay(
  yearMonth: YearMonthOption,
): ReadonlyMap<string, number> {
  const counts = new Map<string, number>();
  const add = (date: string) => counts.set(date, (counts.get(date) ?? 0) + 1);
  // One pattern at a time, since expandPatternRules merges identical rules
  // and two locations often share one.
  for (const { rules } of US_CO_REFERENCE_DATA.patterns) {
    for (const { date, inMonth } of expandPatternRules(
      yearMonth,
      rules,
      US_CO_PAROLE_BOARD_SETTINGS,
    )) {
      if (inMonth) add(date);
    }
  }
  add(thirdThursday(yearMonth));
  return counts;
}

/**
 * The props a month's skeleton takes to match the month it stands in for:
 * the month, Colorado's expected entries on each day, and the list view on a
 * narrow screen, as MonthCalendar shows it.
 */
export function useMonthSkeleton(viewed: YearMonthOption): {
  month: YearMonthOption;
  chipsOn: ChipsOn;
  view: "month" | "list";
} {
  const narrow = useIsNarrowViewport();
  const { year, month } = viewed;
  return useMemo(() => {
    const counts = expectedEntriesPerDay({ year, month });
    return {
      month: { year, month },
      chipsOn: (isoDate: string) => counts.get(isoDate) ?? 0,
      view: narrow ? "list" : "month",
    };
  }, [year, month, narrow]);
}
