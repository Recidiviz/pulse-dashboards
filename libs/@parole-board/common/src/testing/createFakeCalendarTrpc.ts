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
import { createTRPCClient, TRPCClientError, TRPCLink } from "@trpc/client";
import { observable } from "@trpc/server/observable";

import { CalendarTrpc, failingLink, toCalendarTrpc } from "../api/client";
import type { UsCoParoleBoardCalendarRouter } from "../api/types";

/**
 * Answers a calendar procedure in place of the server, by its path under
 * Calendar.usCo.paroleBoard, such as "admin.months.get". A thrown error fails the
 * request, as a server error would.
 */
export type FakeCalendarProcedures = Partial<
  Record<string, (input: unknown) => unknown>
>;

function proceduresLink(
  procedures: FakeCalendarProcedures,
): TRPCLink<UsCoParoleBoardCalendarRouter> {
  return () =>
    ({ op }) =>
      observable((observer) => {
        const procedure = procedures[op.path];
        Promise.resolve()
          .then(() => {
            if (!procedure) {
              throw new TRPCClientError(`No fake for ${op.path}`);
            }
            return procedure(op.input);
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
      });
}

/**
 * Builds a calendar client that never reaches the network. Without
 * procedures every request fails, so a data hook an example or test forgot
 * to inject or fake fails loudly instead of waiting forever. Render the hooks
 * under a QueryClientProvider with its queryClient, which by default has
 * query retries off. Imports nothing from Vitest, so examples can use it too.
 */
export function createFakeCalendarTrpc({
  procedures,
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  }),
}: {
  procedures?: FakeCalendarProcedures;
  queryClient?: QueryClient;
} = {}): CalendarTrpc {
  const link = procedures
    ? proceduresLink(procedures)
    : failingLink(
        "This fake calendar client has no procedures: inject the data hook or pass procedures",
      );
  return toCalendarTrpc(
    createTRPCClient<UsCoParoleBoardCalendarRouter>({ links: [link] }),
    queryClient,
  );
}
