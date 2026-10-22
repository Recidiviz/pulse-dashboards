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

import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import { paroleFacilitiesFixtureByState } from "~datatypes";

import * as StoreProvider from "../../../../components/StoreProvider";
import useIsMobile from "../../../../hooks/useIsMobile";
import { ParoleOfflineAPIClient } from "../../../../ParoleStore/api/ParoleOfflineAPIClient";
import { ParoleStore } from "../../../../ParoleStore/ParoleStore";
import { RootStore } from "../../../../RootStore";
import { ParoleResidentsView } from "../ParoleResidentsView";

vi.mock("../../../../components/StoreProvider");
vi.mock("../../../../hooks/useIsMobile");

let paroleStore: ParoleStore;

beforeEach(() => {
  // See ParoleDocketView.test.tsx: tested against the offline client's fixtures.
  vi.stubEnv("VITE_IS_OFFLINE", "true");
  vi.mocked(useIsMobile).mockReturnValue({ isMobile: false, isTablet: false });
  // A full RootStore, since the DOC ID cell (PersonId) reads the tenant and
  // analytics stores.
  const rootStore = new RootStore();
  rootStore.tenantStore.currentTenantId = "US_CO";
  paroleStore = rootStore.paroleStore;
  vi.mocked(StoreProvider.useRootStore).mockReturnValue(rootStore);
});

afterEach(() => {
  vi.restoreAllMocks();
});

function renderView() {
  render(
    <MemoryRouter>
      <ParoleResidentsView />
    </MemoryRouter>,
  );
}

describe("ParoleResidentsView", () => {
  it("shows no residents and fetches none until a facility is selected", async () => {
    const residentsSpy = vi.spyOn(
      ParoleOfflineAPIClient.prototype,
      "residentsInFacilities",
    );

    renderView();

    expect(await screen.findByText("All Residents")).toBeInTheDocument();
    expect(
      screen.getByText("Search for facilities above to view their residents."),
    ).toBeInTheDocument();
    expect(screen.queryAllByRole("link")).toEqual([]);
    expect(residentsSpy).not.toHaveBeenCalled();
  });

  it("links each resident of the selected facilities to their case profile", async () => {
    const [facility] = paroleFacilitiesFixtureByState.US_CO;
    paroleStore.setSelectedFacilityIds([facility.facilityId]);

    renderView();

    const links = await screen.findAllByRole("link");
    expect(links.length).toBeGreaterThan(0);
    links.forEach((link) => {
      expect(link.getAttribute("href")).toMatch(/^\/parole\/case\/.+$/);
    });
  });

  it("shows each resident's DOC ID with the same DOC- prefix as the docket", async () => {
    const [facility] = paroleFacilitiesFixtureByState.US_CO;
    paroleStore.setSelectedFacilityIds([facility.facilityId]);

    renderView();

    const docIds = await screen.findAllByText(/^DOC-/);
    expect(docIds.length).toBeGreaterThan(0);
  });
});
