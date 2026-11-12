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

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { createTRPCClient } from "@trpc/client";
import { observable } from "@trpc/server/observable";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { Suspense } from "react";

import { useRootStore } from "~@jii/data";
import type { JiiResidentAppRouter } from "~@jii/trpc-types";

import type { ResourceSummary } from "../../types";
import { useResources } from "../useResources";
import { makeResource } from "./testUtils";

vi.mock("~@jii/data", async (importOriginal) => ({
  ...(await importOriginal()),
  useRootStore: vi.fn(),
}));

const QUERY_KEY = ["resources"];

const mockResources = [
  makeResource(1, [
    { category: "Housing", subcategory: "" },
    { category: "Veterans", subcategory: "" },
  ]),
  makeResource(2, [{ category: "Housing", subcategory: "" }]),
  makeResource(3, [{ category: "Education", subcategory: "" }]),
];

let queryClient: QueryClient;

beforeEach(() => {
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: 0 } } });
  queryClient.setQueryData(QUERY_KEY, mockResources);

  vi.mocked(useRootStore).mockReturnValue({
    apiClient: {
      trpcQuerier: {
        resident: {
          resources: {
            getResources: {
              queryOptions: vi.fn().mockReturnValue({
                queryKey: QUERY_KEY,
                queryFn: vi.fn(),
              }),
            },
          },
        },
      },
    },
  } as unknown as ReturnType<typeof useRootStore>);
});

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={null}>{children}</Suspense>
    </QueryClientProvider>
  );
}

test("doesn't reuse another state's cached resources", async () => {
  const resourcesByState: Record<string, ResourceSummary[]> = {
    US_NYC: [makeResource(1)],
    US_MA: [makeResource(2)],
  };
  // Answers like the server, returning the list for the requested state
  const client = createTRPCClient<JiiResidentAppRouter>({
    links: [
      () =>
        ({ op }) =>
          observable((observer) => {
            const { stateCode } = op.input as { stateCode: string };
            observer.next({
              result: { type: "data", data: resourcesByState[stateCode] },
            });
            observer.complete();
          }),
    ],
  });
  const trpcQuerier = createTRPCOptionsProxy({ client, queryClient });
  vi.mocked(useRootStore).mockReturnValue({
    apiClient: { trpcQuerier },
  } as unknown as ReturnType<typeof useRootStore>);

  // A staff user browsed US_MA's resources first
  await queryClient.fetchQuery(
    trpcQuerier.resident.resources.getResources.queryOptions({
      stateCode: "US_MA",
    }),
  );

  const { result } = renderHook(() => useResources(), { wrapper });

  await waitFor(() =>
    expect(result.current?.data).toEqual(resourcesByState["US_NYC"]),
  );
});

test("getSimilarResources filters against the fetched data", () => {
  const { result } = renderHook(() => useResources(), { wrapper });

  const similar = result.current.getSimilarResources("Housing", 0);

  expect(similar).toHaveLength(2);
  expect(similar[0]).toBe(mockResources[0]);
  expect(similar[1]).toBe(mockResources[1]);
});

test("hasResources is true when data is non-empty", () => {
  const { result } = renderHook(() => useResources(), { wrapper });

  expect(result.current.hasResources).toBe(true);
});

test("hasResources is false when data is empty", () => {
  queryClient.setQueryData(QUERY_KEY, []);

  const { result } = renderHook(() => useResources(), { wrapper });

  expect(result.current.hasResources).toBe(false);
});

test("hasResources is false when resources have no categories", () => {
  queryClient.setQueryData(QUERY_KEY, [makeResource(1)]);

  const { result } = renderHook(() => useResources(), { wrapper });

  expect(result.current.hasResources).toBe(false);
});
