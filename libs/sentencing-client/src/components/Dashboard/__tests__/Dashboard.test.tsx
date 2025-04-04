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

import {
  StaffInfoFixture,
  SupervisorInfoFixture,
} from "../../../api/offlineFixtures";
import { PSIStore } from "../../../datastores/PSIStore";
import { StaffPresenter } from "../../../presenters/StaffPresenter";
import { SupervisorPresenter } from "../../../presenters/SupervisorPresenter";
import { createMockPSIStore } from "../../../utils/test";
import { StoreProvider } from "../../StoreProvider/StoreProvider";
import { StaffDashboard } from "../StaffDashboard";
import { SupervisorDashboard } from "../SupervisorDashboard";

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
    <StoreProvider store={psiStore}>
      <MemoryRouter
        initialEntries={[`/psi/dashboard/${psiStore.staffPseudoId}`]}
      >
        <StaffDashboard psiStore={psiStore} />
      </MemoryRouter>
    </StoreProvider>,
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
    <StoreProvider store={psiStore}>
      <MemoryRouter
        initialEntries={[`/psi/dashboard/staff/${psiStore.staffPseudoId}`]}
      >
        <StaffDashboard psiStore={psiStore} />
      </MemoryRouter>
    </StoreProvider>,
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
    <StoreProvider store={psiStore}>
      <MemoryRouter
        initialEntries={[`/psi/dashboard/staff/${psiStore.staffPseudoId}`]}
      >
        <StaffDashboard psiStore={psiStore} />
      </MemoryRouter>
    </StoreProvider>,
  );

  // Blanda Furman
  const client1 = await screen.findByText(
    data[0].client!.fullName.toLocaleLowerCase(),
  );
  // Xavier Smith
  const client2 = await screen.findByText(
    data[1].client!.fullName.toLocaleLowerCase(),
  );
  // Bob Thornburg
  const client3 = await screen.findByText(
    data[3].client!.fullName.toLocaleLowerCase(),
  );

  expect(client1).toBeInTheDocument();
  expect(client2).toBeInTheDocument();
  expect(client3).toBeInTheDocument();

  expect(client1.compareDocumentPosition(client2)).toBe(4);
  expect(client2.compareDocumentPosition(client3)).toBe(4);
  expect(client3.compareDocumentPosition(client1)).toBe(2);
});

test("SupervisorDashboard displays PSI Team Dashboard header and performance highlights", async () => {
  // Mock the API to return fixture data for supervisor info
  vi.spyOn(psiStore.apiClient, "getSupervisorInfo").mockResolvedValue(
    SupervisorInfoFixture,
  );

  // Create and hydrate the supervisor presenter
  const supervisorPresenter = new SupervisorPresenter(psiStore.supervisorStore);
  await supervisorPresenter.hydrate();

  const screen = render(
    <StoreProvider store={psiStore}>
      <MemoryRouter
        initialEntries={[`/psi/dashboard/supervisor/${psiStore.staffPseudoId}`]}
      >
        <SupervisorDashboard psiStore={psiStore} />
      </MemoryRouter>
    </StoreProvider>,
  );

  const headerText = await screen.findByText(/PSI Team Dashboard/i);
  expect(headerText).toBeInTheDocument();

  const performanceHighlightsText = await screen.findByText(
    /Performance Highlights/i,
  );
  expect(performanceHighlightsText).toBeInTheDocument();

  const staffName =
    SupervisorInfoFixture.supervisorDashboardStats?.staffStats[0].fullName ??
    "";
  const janeDoeStaff = await screen.findByText(staffName);
  expect(janeDoeStaff).toBeInTheDocument();
});
