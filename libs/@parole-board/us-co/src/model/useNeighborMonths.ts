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

import { useEffect } from "react";

import type { YearMonthOption } from "~@parole-board/common";
import { useMonthsList } from "~@parole-board/common";

import { compareYearMonth, monthOptions, neighborMonths } from "./month";

/**
 * The nearest stored months before and after viewed, for the month arrows.
 * It reads the month picker's list, the pages centred on current, so
 * changing month reuses the cached list and never suspends. When viewed is
 * at or past either end of the loaded pages, it loads the next or previous
 * page, and until that page arrives the neighbour it could change is null,
 * so the arrow is disabled rather than pointing at the wrong month.
 */
export function useNeighborMonths(
  viewed: YearMonthOption,
  current: YearMonthOption,
): { previous: YearMonthOption | null; next: YearMonthOption | null } {
  const {
    data,
    hasNextPage,
    hasPreviousPage,
    fetchNextPage,
    fetchPreviousPage,
    isFetchingNextPage,
    isFetchingPreviousPage,
    isFetchNextPageError,
    isFetchPreviousPageError,
  } = useMonthsList({ around: current });

  const stored = monthOptions(data.pages, null);
  const first = stored.at(0);
  const last = stored.at(-1);
  // Loaded pages are contiguous, so a stored month between viewed and the
  // nearest loaded one can only be on a page that hasn't loaded.
  const nextUnloaded =
    hasNextPage && (!last || compareYearMonth(last, viewed) <= 0);
  const previousUnloaded =
    hasPreviousPage && (!first || compareYearMonth(first, viewed) >= 0);

  // A page that failed to load isn't asked for again, so a server error
  // can't start a loop; the arrow at that end stays disabled.
  useEffect(() => {
    if (nextUnloaded && !isFetchingNextPage && !isFetchNextPageError) {
      void fetchNextPage();
    }
  }, [nextUnloaded, isFetchingNextPage, isFetchNextPageError, fetchNextPage]);
  useEffect(() => {
    if (
      previousUnloaded &&
      !isFetchingPreviousPage &&
      !isFetchPreviousPageError
    ) {
      void fetchPreviousPage();
    }
  }, [
    previousUnloaded,
    isFetchingPreviousPage,
    isFetchPreviousPageError,
    fetchPreviousPage,
  ]);

  const { previous, next } = neighborMonths(data.pages, viewed);
  // Past the last loaded month, the months between it and viewed haven't
  // loaded, so the previous month isn't known either; the same holds the
  // other way round.
  const viewedPastLast =
    hasNextPage && !!last && compareYearMonth(viewed, last) > 0;
  const viewedBeforeFirst =
    hasPreviousPage && !!first && compareYearMonth(viewed, first) < 0;
  return {
    previous: previousUnloaded || viewedPastLast ? null : previous,
    next: nextUnloaded || viewedBeforeFirst ? null : next,
  };
}
