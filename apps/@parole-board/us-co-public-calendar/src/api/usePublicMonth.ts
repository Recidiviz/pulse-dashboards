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

import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";

import {
  type CalendarRouterOutputs,
  getCalendarErrorCode,
} from "~@parole-board/common";

import { usePublicCalendarServices } from "../services";
import type { PublicCalendarTrpc } from "./client";

/** One published month, or null when the landing read finds none. */
export type PublicMonth = CalendarRouterOutputs["public"]["months"]["get"];

/**
 * What the page shows for a month address: "ready" with the month (null when
 * nothing is published), or "unavailable" when the month isn't published or
 * doesn't exist.
 */
export type PublicMonthResult =
  | { status: "ready"; month: PublicMonth }
  | { status: "unavailable"; month: null };

/** How often an open page checks its month again, in milliseconds. */
export const PUBLIC_MONTH_REFETCH_INTERVAL = 60_000;

// React Query's default retry count.
const MAX_RETRIES = 3;

export function publicMonthQueryKey(month?: string) {
  return ["publicCalendar", "months", "get", month ?? null] as const;
}

/**
 * The query for one month address, or for the landing page when month is
 * undefined. It polls every minute and on window focus, so an open page sees
 * a month an editor takes off the public calendar, and it never retries
 * NOT_FOUND.
 *
 * NOT_FOUND becomes the "unavailable" result rather than an error until a
 * month has loaded, since the error boundary would show it as a failed load.
 * Once a month has loaded, a later NOT_FOUND stays an error, so the query
 * keeps the month and returns the error beside it.
 */
export function publicMonthQueryOptions(
  { client, queryClient }: PublicCalendarTrpc,
  month?: string,
) {
  const queryKey = publicMonthQueryKey(month);
  return queryOptions({
    queryKey,
    queryFn: async ({ signal }): Promise<PublicMonthResult> => {
      try {
        const result = await client.public.months.get.query(
          month ? { month } : {},
          { signal },
        );
        return { status: "ready", month: result };
      } catch (error) {
        if (
          getCalendarErrorCode(error) === "NOT_FOUND" &&
          queryClient.getQueryData<PublicMonthResult>(queryKey)?.status !==
            "ready"
        ) {
          return { status: "unavailable", month: null };
        }
        throw error;
      }
    },
    refetchInterval: PUBLIC_MONTH_REFETCH_INTERVAL,
    refetchOnWindowFocus: true,
    retry: (failureCount, error) =>
      getCalendarErrorCode(error) !== "NOT_FOUND" && failureCount < MAX_RETRIES,
  });
}

/**
 * Loads a month address with Suspense, or the landing page's month when
 * month is undefined. Returns the last result and the latest error together:
 * an error after a result, such as NOT_FOUND once an editor takes the month
 * off the public calendar, leaves data in place.
 *
 * noLongerLive is true while a month that loaded gets NOT_FOUND, so the page
 * keeps it greyed under a banner. The next successful poll clears the error
 * and with it noLongerLive.
 */
export function usePublicMonth(month?: string): {
  data: PublicMonthResult;
  error: Error | null;
  noLongerLive: boolean;
} {
  const { trpc } = usePublicCalendarServices();
  const { data, error } = useSuspenseQuery(
    publicMonthQueryOptions(trpc, month),
  );
  const noLongerLive =
    data.month !== null && getCalendarErrorCode(error) === "NOT_FOUND";
  return { data, error, noLongerLive };
}
