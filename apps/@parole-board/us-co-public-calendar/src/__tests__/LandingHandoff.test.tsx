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

import { act, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, useLocation, useNavigationType } from "react-router-dom";

import { publicNovember2026 } from "~@parole-board/common/fixtures";

import { publicMonthQueryKey } from "../api/usePublicMonth";
import { App } from "../App";
import { createTestServices } from "./testUtils";

// Holds the month page's code back until a test lets it load, the way a slow
// network would. In its own file, since a module loads once per file.
const monthPageCode = vi.hoisted(() => {
  let load = () => undefined as void;
  const loaded = new Promise<void>((resolve) => {
    load = resolve;
  });
  return { loaded, load: () => load() };
});

vi.mock("../pages/MonthPage", async (importOriginal) => {
  await monthPageCode.loaded;
  return importOriginal();
});

function LocationProbe() {
  const { pathname } = useLocation();
  const navigationType = useNavigationType();
  return (
    <output aria-label="location">{`${navigationType} ${pathname}`}</output>
  );
}

test("shows the skeleton, not an empty page, while the landing page hands off to a month page that's still loading", async () => {
  const services = createTestServices(() => publicNovember2026);
  render(
    <MemoryRouter initialEntries={["/"]} future={{ v7_startTransition: true }}>
      <App services={services} />
      <LocationProbe />
    </MemoryRouter>,
  );
  // The landing page has rendered once it hands its result to the month page.
  await waitFor(() =>
    expect(
      services.trpc.queryClient.getQueryData(publicMonthQueryKey("2026-11")),
    ).toBeDefined(),
  );
  expect(
    screen.getByRole("status", { name: "Loading the month" }),
  ).toBeInTheDocument();

  await act(async () => monthPageCode.load());
  expect(
    await screen.findByRole("heading", { name: "November 2026" }),
  ).toBeInTheDocument();
  expect(screen.getByLabelText("location")).toHaveTextContent(
    "REPLACE /2026-11",
  );
  expect(
    screen.queryByRole("status", { name: "Loading the month" }),
  ).not.toBeInTheDocument();
});
