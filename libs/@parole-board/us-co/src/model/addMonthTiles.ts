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

import { ADD_MONTHS_AHEAD, addMonths } from "~@modules/Calendar/rules";
import type { YearMonthOption } from "~@parole-board/common";
import { formatDate } from "~utils";

import { compareYearMonth, toYearMonthParam } from "./month";

/** One month tile in the Add a month dialog. */
export type AddMonthTile = YearMonthOption & {
  /** The month's name, such as "October". */
  label: string;
  /** True when the month already exists, so its tile can't be selected. */
  alreadyAdded: boolean;
};

/** The month's name, such as "October", as its tile and Generate show it. */
export function monthLabel({ year, month }: YearMonthOption): string {
  return formatDate(new Date(year, month - 1, 1), "MMMM");
}

function tile(yearMonth: YearMonthOption, alreadyAdded: boolean): AddMonthTile {
  return {
    year: yearMonth.year,
    month: yearMonth.month,
    label: monthLabel(yearMonth),
    alreadyAdded,
  };
}

/**
 * Returns the Add a month tiles in date order, from the server's add options
 * and the current month in the calendar's timezone.
 *
 * Each of the next 12 months gets a tile; one that options leave out already
 * exists, so its tile is marked already added and can't be selected. Every
 * option gets a selectable tile, so the current month shows only while the
 * server offers it (it does so until the month exists), and an option outside
 * the window, which a clock that disagrees with the server's could produce,
 * still shows.
 */
export function addMonthTiles(
  options: YearMonthOption[],
  currentYm: YearMonthOption,
): AddMonthTile[] {
  const offered = new Set(options.map(toYearMonthParam));
  const tiles = new Map<string, AddMonthTile>();
  for (let ahead = 1; ahead <= ADD_MONTHS_AHEAD; ahead += 1) {
    const yearMonth = addMonths(currentYm, ahead);
    const key = toYearMonthParam(yearMonth);
    tiles.set(key, tile(yearMonth, !offered.has(key)));
  }
  for (const option of options) {
    tiles.set(toYearMonthParam(option), tile(option, false));
  }
  return [...tiles.values()].sort(compareYearMonth);
}

/**
 * Returns the keys the dialog starts with selected: the earliest selectable
 * tile's, or none when every tile is disabled.
 */
export function initialSelection(tiles: AddMonthTile[]): string[] {
  const first = tiles.find(({ alreadyAdded }) => !alreadyAdded);
  return first ? [toYearMonthParam(first)] : [];
}
