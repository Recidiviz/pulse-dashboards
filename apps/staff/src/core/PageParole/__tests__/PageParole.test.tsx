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
import { ReactNode } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import { useRootStore } from "../../../components/StoreProvider";
import useIsMobile from "../../../hooks/useIsMobile";
import { DASHBOARD_PATHS } from "../../views";
import PageParole from "../PageParole";

vi.mock("../../../hooks/useIsMobile");
vi.mock("../../../components/StoreProvider", () => ({
  useRootStore: vi.fn(),
}));
vi.mock("../../NavigationLayout", () => ({
  NAV_BAR_HEIGHT: 64,
  NavigationLayout: ({ children }: { children: ReactNode }) => (
    <header data-testid="navigation-layout">{children}</header>
  ),
  OverviewNavLinks: () => <nav data-testid="overview-nav-links" />,
}));
vi.mock("../ParoleDocketView", () => ({
  ParoleDocketView: () => <div data-testid="docket" />,
}));
vi.mock("../ParoleResidentsView", () => ({
  ParoleResidentsView: () => <div data-testid="residents" />,
}));
vi.mock("../ParoleCaseProfile", () => ({
  ParoleCaseProfile: () => <div data-testid="case-profile" />,
}));
vi.mock("../ParolePublicCalendar", () => ({
  ParolePublicCalendar: () => <div data-testid="public-calendar" />,
}));
vi.mock("../../../components/NotFound", () => ({
  default: () => <div data-testid="not-found" />,
}));

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path={`${DASHBOARD_PATHS.parole}/*`} element={<PageParole />} />
      </Routes>
    </MemoryRouter>,
  );
}

function allowParolePages(parole: string[]) {
  vi.mocked(useRootStore).mockReturnValue({
    userStore: { userAllowedNavigation: { parole } },
  } as unknown as ReturnType<typeof useRootStore>);
}

beforeEach(() => {
  allowParolePages(["docket", "residents", "publicCalendar"]);
  vi.mocked(useIsMobile).mockReturnValue({ isMobile: false, isTablet: false });
  window.scrollTo = vi.fn();
});

describe("PageParole", () => {
  it("renders the Public Calendar subpage under the staff header", () => {
    renderAt("/parole/public-calendar");

    expect(screen.getByTestId("navigation-layout")).toContainElement(
      screen.getByTestId("overview-nav-links"),
    );
    expect(screen.getByTestId("public-calendar")).toBeInTheDocument();
    expect(screen.queryByTestId("docket")).not.toBeInTheDocument();
  });

  it("leaves the paths below /parole/public-calendar to the Public Calendar", () => {
    renderAt("/parole/public-calendar/2026-10");

    expect(screen.getByTestId("public-calendar")).toBeInTheDocument();
    expect(screen.queryByTestId("not-found")).not.toBeInTheDocument();
  });

  it("still renders the docket at /parole/docket", () => {
    renderAt("/parole/docket");

    expect(screen.getByTestId("docket")).toBeInTheDocument();
    expect(screen.queryByTestId("public-calendar")).not.toBeInTheDocument();
  });

  it("gives the Public Calendar no padding, since the state's Public Calendar lays out its own page", () => {
    renderAt("/parole/public-calendar");

    expect(screen.getByRole("main")).toHaveStyleRule("padding", "0");
  });

  it("keeps the padding on the other parole pages", () => {
    renderAt("/parole/residents");

    expect(screen.getByRole("main")).toHaveStyleRule(
      "padding",
      "2rem 1.5rem 5rem",
    );
  });

  it("renders a case profile for a user with the docket", () => {
    renderAt("/parole/case/PSEUDO-1");

    expect(screen.getByTestId("case-profile")).toBeInTheDocument();
  });

  it("doesn't render a case profile for a user granted only the Public Calendar", () => {
    allowParolePages(["publicCalendar"]);

    renderAt("/parole/case/PSEUDO-1");

    expect(screen.getByTestId("not-found")).toBeInTheDocument();
    expect(screen.queryByTestId("case-profile")).not.toBeInTheDocument();
  });
});
