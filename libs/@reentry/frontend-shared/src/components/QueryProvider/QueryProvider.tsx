// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { memo, ReactNode, useRef } from "react";

const QUERY_RETRY_LIMIT = 1;
const MUTATION_RETRY_LIMIT = 0; // because of mutations side effects.

/**
 * Provides an interface to React Query
 */
export const QueryProvider = memo(function QueryProvider({
  children,
}: {
  children: ReactNode;
}) {
  const queryClient = useRef(
    new QueryClient({
      defaultOptions: {
        queries: {
          retry: (failureCount, error) => {
            if (failureCount < QUERY_RETRY_LIMIT) {
              // eslint-disable-next-line no-console
              console.debug(
                `Query failed, retrying: attempt ${failureCount + 1}`,
                error,
              );
              return true;
            }
            return false;
          },
        },
        mutations: { retry: MUTATION_RETRY_LIMIT },
      },
    }),
  );

  return (
    <QueryClientProvider client={queryClient.current}>
      {children}
    </QueryClientProvider>
  );
});
