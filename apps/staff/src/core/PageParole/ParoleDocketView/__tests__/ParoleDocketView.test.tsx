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

import * as StoreProvider from "../../../../components/StoreProvider";
import useIsMobile from "../../../../hooks/useIsMobile";
import { ParoleStore } from "../../../../ParoleStore/ParoleStore";
import { RootStore } from "../../../../RootStore";
import { ParoleDocketView } from "../ParoleDocketView";

vi.mock("../../../../components/StoreProvider");
vi.mock("../../../../hooks/useIsMobile");

const useRootStoreMock = vi.mocked(StoreProvider.useRootStore);

function mockCurrentTenant(tenantId: "US_CO" | "US_ID") {
  const rootStore = new RootStore();
  rootStore.tenantStore.currentTenantId = tenantId;
  useRootStoreMock.mockReturnValue({
    paroleStore: new ParoleStore(rootStore),
  } as never);
}

beforeEach(() => {
  vi.mocked(useIsMobile).mockReturnValue({ isMobile: false, isTablet: false });
  mockCurrentTenant("US_CO");
});

describe("ParoleDocketView row links", () => {
  it("links each row to that individual's case profile by DOC ID", async () => {
    render(
      <MemoryRouter>
        <ParoleDocketView />
      </MemoryRouter>,
    );

    const links = await screen.findAllByRole("link");
    expect(links.length).toBeGreaterThan(0);
    links.forEach((link) => {
      expect(link.getAttribute("href")).toMatch(/^\/parole\/case\/.+$/);
    });
  });
});

describe("ParoleDocketView docket subheading and search", () => {
  it("shows the subheading and search input for a tenant that configures them", async () => {
    mockCurrentTenant("US_CO");
    render(
      <MemoryRouter>
        <ParoleDocketView />
      </MemoryRouter>,
    );

    expect(
      await screen.findByText("Hearings in the next two weeks"),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Search by name or DOC ID"),
    ).toBeInTheDocument();
  });

  it("hides the subheading and search input for a tenant that doesn't configure them", async () => {
    mockCurrentTenant("US_ID");
    render(
      <MemoryRouter>
        <ParoleDocketView />
      </MemoryRouter>,
    );

    await screen.findAllByRole("link");
    expect(
      screen.queryByText("Hearings in the next two weeks"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText("Search by name or DOC ID"),
    ).not.toBeInTheDocument();
  });
});
