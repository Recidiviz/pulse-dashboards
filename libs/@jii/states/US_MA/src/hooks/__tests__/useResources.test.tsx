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
import { MemoryRouter, Route, Routes } from "react-router-dom";

import { useRootStore } from "~@jii/data";
import { State } from "~@jii/paths";

import { makeResource } from "../../components/Reentry/Resources/__tests__/testUtils";
import { useResources } from "../useResources";

vi.mock("~@jii/data", async (importOriginal) => ({
  ...(await importOriginal()),
  useRootStore: vi.fn(),
}));

const QUERY_KEY = ["resources"];

// TODO(REE-179): Use the MA offline fixtures once they land.
const resources = [
  makeResource(1, {
    name: "Boston Sober House",
    county: "Suffolk",
    tags: ["Male", "Parolees Accepted"],
    categories: [{ category: "Housing", subcategory: "Sober house" }],
    categoryAttributes: {
      category: "Housing",
      weeklyRent: { min: 0, max: 0 },
      programLengthMonths: { min: 3, max: 6 },
    },
  }),
  makeResource(2, {
    name: "Worcester Transitional Residence",
    county: "Worcester",
    tags: ["Co-ed"],
    categories: [{ category: "Housing", subcategory: "Transitional" }],
    categoryAttributes: {
      category: "Housing",
      weeklyRent: { min: 160, max: 180 },
    },
  }),
  makeResource(3, {
    name: "Springfield Family Shelter",
    county: "Hampden",
    tags: ["Female", "Parolees Accepted"],
    categories: [
      { category: "Housing", subcategory: "Shelter" },
      { category: "Housing", subcategory: "Transitional" },
    ],
    categoryAttributes: { category: "Housing", rentAsIncomePercent: 30 },
  }),
  makeResource(4, {
    name: "Lowell Food Pantry",
    county: "Middlesex",
    categories: [{ category: "Food", subcategory: "Pantry" }],
  }),
];

let queryClient: QueryClient;

beforeEach(() => {
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: 0 } } });
  queryClient.setQueryData(QUERY_KEY, resources);

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

function renderResources(search = "") {
  const { result } = renderHook(() => useResources(), {
    wrapper: ({ children }) => (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter
          initialEntries={[
            `/massachusetts/abc/reentry/resources/categories/housing${search}`,
          ]}
        >
          <Routes>
            <Route
              path={State.Resident.UsMaReentry.Resources.CategoryResults.path}
              element={<Suspense fallback={null}>{children}</Suspense>}
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    ),
  });
  return result.current;
}

const namesFor = (search: string) =>
  renderResources(search).resources.map((resource) => resource.name);

test("returns every resource in the route category without filters", () => {
  expect(namesFor("")).toEqual([
    "Boston Sober House",
    "Worcester Transitional Residence",
    "Springfield Family Shelter",
  ]);
});

test.each([
  ["?rent=free&rent=basedOnIncome", [1, 3]],
  ["?rent=from151To175", [2]],
  ["?rent=over200", []],
])("%s returns only the matching resources", (search, expectedIds) => {
  expect(
    renderResources(search).resources.map(
      (resource) => resource.organizationId,
    ),
  ).toEqual(expectedIds);
});

test("ignores option IDs that aren't in the config", () => {
  expect(namesFor("?rent=cheap")).toHaveLength(3);
});
