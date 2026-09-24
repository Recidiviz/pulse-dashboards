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

// This view is tested against ParoleOfflineAPIClient's fixture data, and
// the tenants it mocks below are real-data tenants now. Force offline mode
// so ParoleStore keeps handing out the fixture client (see
// ParoleAPIClient.ts).
import.meta.env["VITE_IS_OFFLINE"] = "true";

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

    expect(await screen.findByText("Two Week Outlook")).toBeInTheDocument();
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
    expect(screen.queryByText("Two Week Outlook")).not.toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText("Search by name or DOC ID"),
    ).not.toBeInTheDocument();
  });
});

describe("ParoleDocketView columns", () => {
  it("heads the docket with Idaho's own id label and a month-only hearing column", async () => {
    mockCurrentTenant("US_ID");
    render(
      <MemoryRouter>
        <ParoleDocketView />
      </MemoryRouter>,
    );

    // The docket hydrates asynchronously, so wait for its rows once here
    // rather than in whichever assertion happens to come first.
    await screen.findAllByRole("link");

    expect(screen.getByText("IDOC ID")).toBeInTheDocument();
    expect(screen.getByText("Hearing Month")).toBeInTheDocument();
    expect(screen.queryByText("Hearing Date")).not.toBeInTheDocument();
    // A month-precision cell names the month alone -- no "June 2026", and
    // no "June 1, 2026".
    expect(screen.queryByText(/^\w+ \d{4}$/)).not.toBeInTheDocument();
    expect(screen.queryByText(/^\w+ \d{1,2}, \d{4}$/)).not.toBeInTheDocument();
  });

  it("keeps the generic id label and a dated hearing column elsewhere", async () => {
    render(
      <MemoryRouter>
        <ParoleDocketView />
      </MemoryRouter>,
    );

    await screen.findAllByRole("link");

    expect(screen.getByText("DOC ID")).toBeInTheDocument();
    expect(screen.getByText("Hearing Date")).toBeInTheDocument();
    expect(screen.queryByText("Hearing Month")).not.toBeInTheDocument();
  });
});
