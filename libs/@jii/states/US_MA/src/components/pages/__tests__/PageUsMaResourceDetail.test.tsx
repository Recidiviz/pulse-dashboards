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
import { fireEvent, render, screen } from "@testing-library/react";
import { i18n as I18n } from "i18next";
import { I18nextProvider } from "react-i18next";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";

import { useRootStore } from "~@jii/data";
import { State } from "~@jii/paths";

import { loadUsMaI18n } from "../../Reentry/Resources/__tests__/testUtils";
import { PageUsMaResourceDetail } from "../PageUsMaResourceDetail";

vi.mock("~@jii/data", async (importOriginal) => ({
  ...(await importOriginal()),
  useRootStore: vi.fn(),
}));

const LIST_PATH = "/massachusetts/abc/reentry/resources/categories/housing";
const DETAIL_PATH = `${LIST_PATH}/7`;

const resource = {
  organizationId: 7,
  name: "Cape Cod Transitional Residence",
  categories: [
    { category: "Housing", subcategory: "Transitional Housing" },
    { category: "Food", subcategory: "Pantry" },
  ],
  tags: [],
};

let i18n: I18n;

beforeAll(async () => {
  i18n = await loadUsMaI18n();
});

function mockGetResource(queryFn: () => Promise<unknown>) {
  vi.mocked(useRootStore).mockReturnValue({
    apiClient: {
      trpcQuerier: {
        resident: {
          resources: {
            getResource: {
              queryOptions: vi
                .fn()
                .mockReturnValue({ queryKey: ["resource"], queryFn }),
            },
          },
        },
      },
    },
  } as unknown as ReturnType<typeof useRootStore>);
}

const LocationDisplay = () => {
  const { pathname, search } = useLocation();
  return <div data-testid="location">{`${pathname}${search}`}</div>;
};

function renderPage(search = "") {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: 0 } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <MemoryRouter initialEntries={[`${DETAIL_PATH}${search}`]}>
          <Routes>
            <Route
              path={
                State.Resident.UsMaReentry.Resources.CategoryResults.Detail.path
              }
              element={<PageUsMaResourceDetail />}
            />
            <Route
              path={State.Resident.UsMaReentry.Resources.CategoryResults.path}
              element={<LocationDisplay />}
            />
          </Routes>
        </MemoryRouter>
      </I18nextProvider>
    </QueryClientProvider>,
  );
}

test("shows the name and only the subcategories in the route's category", async () => {
  mockGetResource(async () => resource);
  renderPage();

  expect(
    await screen.findByRole("heading", {
      name: "Cape Cod Transitional Residence",
    }),
  ).toBeInTheDocument();
  expect(screen.getByText("Transitional Housing")).toBeInTheDocument();
  expect(screen.queryByText("Pantry")).not.toBeInTheDocument();
});

test("both back controls return to backTarget with its filters", async () => {
  mockGetResource(async () => resource);
  const backTarget = `${LIST_PATH}?rent=free`;
  renderPage(`?backTarget=${encodeURIComponent(backTarget)}`);

  expect(screen.getByRole("link", { name: "Back" })).toHaveAttribute(
    "href",
    backTarget,
  );
  fireEvent.click(
    await screen.findByRole("button", { name: "Back to all resources" }),
  );
  expect(screen.getByTestId("location")).toHaveTextContent(backTarget);
});

test("falls back to the unfiltered list for an external backTarget", async () => {
  mockGetResource(async () => resource);
  renderPage(`?backTarget=${encodeURIComponent("https://evil.example.com")}`);

  await screen.findByRole("heading", {
    name: "Cape Cod Transitional Residence",
  });
  expect(screen.getByRole("link", { name: "Back" })).toHaveAttribute(
    "href",
    LIST_PATH,
  );
});
