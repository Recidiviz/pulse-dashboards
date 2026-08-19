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
import { renderHook } from "@testing-library/react";
import { Suspense } from "react";

import { useRootStore } from "~@jii/data";

import { useResources } from "../useResources";

vi.mock("~@jii/data", async (importOriginal) => ({
  ...(await importOriginal()),
  useRootStore: vi.fn(),
}));

const QUERY_KEY = ["resources"];

const mockResources = [
  {
    organizationId: 1,
    name: "",
    description: undefined,
    categories: [
      { category: "Housing", subcategory: "" },
      { category: "Veterans", subcategory: "" },
    ],
    tags: [],
    primaryContactMethod: undefined,
    primaryContactValue: undefined,
  },
  {
    organizationId: 2,
    name: "",
    description: undefined,
    categories: [{ category: "Housing", subcategory: "" }],
    tags: [],
    primaryContactMethod: undefined,
    primaryContactValue: undefined,
  },
  {
    organizationId: 3,
    name: "",
    description: undefined,
    categories: [{ category: "Education", subcategory: "" }],
    tags: [],
    primaryContactMethod: undefined,
    primaryContactValue: undefined,
  },
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
  queryClient.setQueryData(QUERY_KEY, [
    {
      organizationId: 1,
      name: "",
      description: undefined,
      categories: [],
      tags: [],
      primaryContactMethod: null,
      primaryContactValue: null,
    },
  ]);

  const { result } = renderHook(() => useResources(), { wrapper });

  expect(result.current.hasResources).toBe(false);
});
