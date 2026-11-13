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

import { QueryClient } from "@tanstack/react-query";
import { createTRPCClient, TRPCClientError } from "@trpc/client";
import { observable } from "@trpc/server/observable";

import type { UsCoParoleBoardCalendarRouter } from "~@parole-board/common";

import type { PageCounts } from "../analytics/pageCounts";
import type { PublicCalendarServices } from "../services";

/**
 * Services whose public.months.get answers with getMonth in place of the
 * server, and whose page counts are a spy. getMonth gets the request's
 * month, or undefined for the landing read; a thrown error fails the request.
 * The returned getMonth spy records each request's input, such as
 * { month: "2026-11" }, or {} for the landing read.
 */
export function createTestServices(
  getMonth: (month: string | undefined) => unknown,
): PublicCalendarServices & {
  getMonth: ReturnType<typeof vi.fn>;
  pageCounts: PageCounts & { page: ReturnType<typeof vi.fn> };
} {
  const spy = vi.fn((input: unknown) =>
    getMonth((input as { month?: string } | undefined)?.month),
  );
  // React Query's default retries, so the tests see the query's own retry rule.
  const queryClient = new QueryClient();
  const client = createTRPCClient<UsCoParoleBoardCalendarRouter>({
    links: [
      () =>
        ({ op }) =>
          observable((observer) => {
            Promise.resolve()
              .then(() => {
                if (op.path !== "public.months.get") {
                  throw new TRPCClientError(`No fake for ${op.path}`);
                }
                return spy(op.input);
              })
              .then(
                (data) => {
                  observer.next({ result: { type: "data", data } });
                  observer.complete();
                },
                (error: unknown) => {
                  observer.error(TRPCClientError.from(error as Error));
                },
              );
          }),
    ],
  });
  return {
    trpc: { client, queryClient },
    pageCounts: { page: vi.fn() },
    getMonth: spy,
  };
}
