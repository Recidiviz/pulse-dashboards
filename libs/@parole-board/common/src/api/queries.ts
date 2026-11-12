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

import {
  useQueryClient,
  useSuspenseInfiniteQuery,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { useCallback, useEffect } from "react";

import { calendarRetry } from "./errors";
import type { YearMonthOption } from "./types";
import { useCalendarTrpc } from "./useCalendarTrpc";

/**
 * How often an open month refetches, so editors see each other's changes
 * (Spec D, Edit conflicts). It's also how long a fetched month stays fresh,
 * so a month prefetched moments before it opens isn't fetched again, and
 * regaining focus refetches only a month older than this.
 */
export const MONTH_REFETCH_INTERVAL_MS = 30_000;

/** The retry option every calendar query takes; see calendarRetry. */
function useCalendarRetry() {
  return calendarRetry(useQueryClient());
}

/**
 * The query options for one month, for a component that reads it without
 * suspending, such as one that keeps showing while the month loads. Pass
 * them to useQuery; useMonth reads the same query with Suspense.
 */
export function useMonthQueryOptions({ year, month }: YearMonthOption) {
  const { querier } = useCalendarTrpc();
  return querier.admin.months.get.queryOptions(
    { year, month },
    {
      staleTime: MONTH_REFETCH_INTERVAL_MS,
      refetchInterval: MONTH_REFETCH_INTERVAL_MS,
      refetchOnWindowFocus: true,
      retry: useCalendarRetry(),
    },
  );
}

/**
 * Reads one month with its entries, holidays and counts. The data is null
 * when the month doesn't exist yet.
 */
export function useMonth(yearMonth: YearMonthOption) {
  return useSuspenseQuery(useMonthQueryOptions(yearMonth));
}

/**
 * Loads a month into the cache before the editor opens it, such as the
 * months either side of the open one, so opening it shows no skeleton. It
 * prefetches whenever yearMonth changes, and returns a function that
 * prefetches again, for a link's hover and focus. A month fetched in the last
 * MONTH_REFETCH_INTERVAL_MS isn't fetched again. Pass null or undefined when
 * there's no month, such as past the last one.
 */
export function usePrefetchMonth(
  yearMonth: YearMonthOption | null | undefined,
) {
  const { querier } = useCalendarTrpc();
  const queryClient = useQueryClient();
  const year = yearMonth?.year;
  const month = yearMonth?.month;
  const prefetch = useCallback(() => {
    if (year === undefined || month === undefined) return;
    void queryClient.prefetchQuery(
      querier.admin.months.get.queryOptions(
        { year, month },
        {
          staleTime: MONTH_REFETCH_INTERVAL_MS,
          retry: calendarRetry(queryClient),
        },
      ),
    );
  }, [querier, queryClient, year, month]);
  useEffect(prefetch, [prefetch]);
  return prefetch;
}

/**
 * Reads the months for the month picker, a page at a time. The first page is
 * centred on around (or starts at the current month without it), and
 * fetchNextPage and fetchPreviousPage load later and earlier months. search
 * is free text such as "Oct 2026"; the server reads a year and a month from
 * it, and text it can't read matches no months. A new search suspends, so
 * pass a deferred or debounced value while the user types.
 */
export function useMonthsList({
  around,
  search,
}: {
  around?: YearMonthOption;
  search?: string;
}) {
  const { querier } = useCalendarTrpc();
  return useSuspenseInfiniteQuery(
    querier.admin.months.list.infiniteQueryOptions(
      { around, search },
      {
        getNextPageParam: (page) => page.nextCursor,
        getPreviousPageParam: (page) => page.prevCursor,
        retry: useCalendarRetry(),
      },
    ),
  );
}

/**
 * Reads the months Add month can offer: the current month when it's missing,
 * and the next 12 that don't exist yet.
 */
export function useAddMonthOptions() {
  const { querier } = useCalendarTrpc();
  return useSuspenseQuery(
    querier.admin.months.addOptions.queryOptions(undefined, {
      retry: useCalendarRetry(),
    }),
  );
}

/**
 * Reads what publishing the month would publish, for the publish dialog. The
 * preview holds still while the editor reviews it: no timer, focus or
 * staleness refetch. Only a failed publish refetches it, when the server
 * answers CONFLICT (see usePublishMonth); a successful one doesn't, because a
 * published month's preview throws PRECONDITION_FAILED. React Query keeps a
 * Suspense query cached for at least a second after its last reader
 * unmounts, so the dialog clears it with useRemovePublishPreview when it
 * closes, and each opening reads it again.
 */
export function usePublishPreview({ monthId }: { monthId: string }) {
  const { querier } = useCalendarTrpc();
  return useSuspenseQuery(
    querier.admin.months.publishPreview.queryOptions(
      { monthId },
      {
        refetchInterval: false,
        refetchOnWindowFocus: false,
        staleTime: Infinity,
        gcTime: 0,
        retry: useCalendarRetry(),
      },
    ),
  );
}

/**
 * Returns a function that drops a month's publish preview from the cache.
 * Call it once nothing reads the preview, such as after the publish dialog
 * unmounts its body, so the next usePublishPreview fetches it again.
 */
export function useRemovePublishPreview() {
  const { querier } = useCalendarTrpc();
  const queryClient = useQueryClient();
  return useCallback(
    (monthId: string) =>
      queryClient.removeQueries({
        queryKey: querier.admin.months.publishPreview.queryKey({ monthId }),
      }),
    [querier, queryClient],
  );
}

/**
 * Returns a function that reads one month from the server, and stores the
 * answer for useMonth. It's for checks that need the server's current state,
 * such as whether a publish whose response was lost went through. It reads
 * the server whatever the cache holds, unless since is given: then a month
 * the cache read from the server at or after since, a time in milliseconds,
 * counts as current, such as one a failed write has just refetched.
 */
export function useFetchMonth() {
  const { querier } = useCalendarTrpc();
  const queryClient = useQueryClient();
  return useCallback(
    ({ year, month }: YearMonthOption, since?: number) =>
      queryClient.fetchQuery(
        querier.admin.months.get.queryOptions(
          { year, month },
          {
            staleTime:
              since === undefined ? 0 : Math.max(0, Date.now() - since + 1),
          },
        ),
      ),
    [querier, queryClient],
  );
}

/**
 * Reads the calendar's settings, entry types and resources, such as
 * calendar.allowedWeekdays. They change only with a deploy or a data
 * migration, so one read per session is enough.
 */
export function useCalendarConfig() {
  const { querier } = useCalendarTrpc();
  return useSuspenseQuery(
    querier.admin.config.get.queryOptions(undefined, {
      staleTime: Infinity,
      retry: useCalendarRetry(),
    }),
  );
}

/** Reads each pattern slot with its newest pattern, for Add month. */
export function useCurrentPatterns() {
  const { querier } = useCalendarTrpc();
  return useSuspenseQuery(
    querier.admin.patterns.listCurrent.queryOptions(undefined, {
      retry: useCalendarRetry(),
    }),
  );
}
