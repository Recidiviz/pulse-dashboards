// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import { StaffInfoFixture } from "../../../api/offlineFixtures";
import { PSIStore } from "../../../datastores/PSIStore";
import { StaffPresenter } from "../../../presenters/StaffPresenter";
import { createMockPSIStore } from "../../../utils/test";
import { Dashboard } from "../Dashboard";

let psiStore: PSIStore;
let presenter: StaffPresenter;

beforeEach(() => {
  psiStore = createMockPSIStore();
  presenter = new StaffPresenter(psiStore.staffStore);
});

afterEach(() => {
  vi.restoreAllMocks();
});

test("welcome message shows on first login", async () => {
  vi.spyOn(psiStore.staffStore, "loadStaffInfo");
  vi.spyOn(psiStore.apiClient, "getStaffInfo").mockResolvedValue(
    StaffInfoFixture,
  );

  const screen = render(
    <MemoryRouter initialEntries={[`/psi/dashboard/${psiStore.staffPseudoId}`]}>
      <Dashboard psiStore={psiStore} />
    </MemoryRouter>,
  );

  const welcomeMessage = await screen.findByText(
    "Welcome to your case dashboard!",
  );

  expect(welcomeMessage).toBeInTheDocument();
});

test("welcome message no longer shows after user closes it", async () => {
  vi.spyOn(psiStore.staffStore, "loadStaffInfo");
  vi.spyOn(psiStore.apiClient, "getStaffInfo").mockResolvedValue(
    StaffInfoFixture,
  );

  if (psiStore.staffStore.staffInfo) {
    psiStore.staffStore.staffInfo = {
      ...psiStore.staffStore.staffInfo,
      hasLoggedIn: true,
    };
  }

  const screen = render(
    <MemoryRouter initialEntries={[`/psi/dashboard/${psiStore.staffPseudoId}`]}>
      <Dashboard psiStore={psiStore} />
    </MemoryRouter>,
  );

  const welcomeMessage = await screen.queryByText(
    "Welcome to your case dashboard!",
  );

  expect(welcomeMessage).toBeNull();
});

test("shows cases default sorted by last name", async () => {
  vi.spyOn(psiStore.staffStore, "loadStaffInfo");
  vi.spyOn(psiStore.apiClient, "getStaffInfo").mockResolvedValue(
    StaffInfoFixture,
  );

  await presenter.hydrate();
  const data = presenter.caseTableData;

  if (!data) return;

  const screen = render(
    <MemoryRouter initialEntries={[`/psi/dashboard/${psiStore.staffPseudoId}`]}>
      <Dashboard psiStore={psiStore} />
    </MemoryRouter>,
  );

  // Blanda Furman
  const client1 = await screen.findByText(
    data[0].Client!.fullName.toLocaleLowerCase(),
  );
  // Xavier Smith
  const client2 = await screen.findByText(
    data[1].Client!.fullName.toLocaleLowerCase(),
  );
  // Bob Thornburg
  const client3 = await screen.findByText(
    data[3].Client!.fullName.toLocaleLowerCase(),
  );

  expect(client1).toBeInTheDocument();
  expect(client2).toBeInTheDocument();
  expect(client3).toBeInTheDocument();

  expect(client1.compareDocumentPosition(client2)).toBe(4);
  expect(client2.compareDocumentPosition(client3)).toBe(4);
  expect(client3.compareDocumentPosition(client1)).toBe(2);
});
