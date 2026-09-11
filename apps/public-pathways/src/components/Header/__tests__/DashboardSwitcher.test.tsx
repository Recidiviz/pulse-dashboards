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

import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ThemeProvider } from "styled-components";
import { Mock } from "vitest";

import { defaultPathwaysTheme, PATHWAYS_PAGES } from "~shared-pathways";

import { PublicPathwaysDashboardPage } from "../../../datastores/dashboards";
import { useRootStore } from "../../StoreProvider";
import { DashboardSwitcher } from "../DashboardSwitcher";

vi.mock("../../StoreProvider");

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockTrackDashboardSelected = vi.fn();
const mockUseRootStore = useRootStore as Mock;

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>
    <ThemeProvider theme={defaultPathwaysTheme}>{children}</ThemeProvider>
  </MemoryRouter>
);

function renderSwitcher(page: PublicPathwaysDashboardPage) {
  mockUseRootStore.mockReturnValue({
    currentTenantId: "US_NY",
    page,
    analyticsStore: { trackDashboardSelected: mockTrackDashboardSelected },
  });
  render(<DashboardSwitcher />, { wrapper });
  fireEvent.click(screen.getByRole("button"));
}

describe("DashboardSwitcher", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("labels the toggle with the current dashboard and its cadence", () => {
    renderSwitcher(PATHWAYS_PAGES.admissionsAndReleases);

    expect(screen.getByRole("button")).toHaveTextContent(
      "Admissions & Releases · Annual",
    );
  });

  it("lists both dashboards, marking the current one as selected", () => {
    renderSwitcher(PATHWAYS_PAGES.prison);

    expect(
      within(
        screen.getByRole("menuitem", { name: /Population Under Custody/ }),
      ).getByText("Selected"),
    ).toBeInTheDocument();
    expect(
      within(
        screen.getByRole("menuitem", { name: /Admissions & Releases/ }),
      ).queryByText("Selected"),
    ).not.toBeInTheDocument();
  });

  it("navigates to the dashboard that was picked", () => {
    renderSwitcher(PATHWAYS_PAGES.prison);

    fireEvent.click(
      screen.getByRole("menuitem", { name: /Admissions & Releases/ }),
    );

    expect(mockNavigate).toHaveBeenCalledWith("/admissionsAndReleases");
    expect(mockTrackDashboardSelected).toHaveBeenCalledWith({
      pageId: "admissionsAndReleases",
    });
  });

  it("does not navigate when the current dashboard is picked again", () => {
    renderSwitcher(PATHWAYS_PAGES.prison);

    fireEvent.click(
      screen.getByRole("menuitem", { name: /Population Under Custody/ }),
    );

    expect(mockNavigate).not.toHaveBeenCalled();
    expect(mockTrackDashboardSelected).not.toHaveBeenCalled();
  });

  it("shows each dashboard's refresh cadence", () => {
    renderSwitcher(PATHWAYS_PAGES.prison);

    expect(
      within(
        screen.getByRole("menuitem", { name: /Population Under Custody/ }),
      ).getByText(/Monthly/),
    ).toBeInTheDocument();
    expect(
      within(
        screen.getByRole("menuitem", { name: /Admissions & Releases/ }),
      ).getByText(/Annual/),
    ).toBeInTheDocument();
  });
});
