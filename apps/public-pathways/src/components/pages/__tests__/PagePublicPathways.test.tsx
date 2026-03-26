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

import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Mock } from "vitest";

import { usePageContent } from "~shared-pathways";

import { useRootStore } from "../../StoreProvider";
import { PagePublicPathways } from "../PagePublicPathways";

vi.mock("../../StoreProvider");
vi.mock("../../../useRouteSync", () => ({
  useRouteSync: vi.fn(),
}));
vi.mock("../../Header/Header", () => ({
  Header: () => <div data-testid="header" />,
}));
vi.mock("../../MetricVizMapper/MetricVizMapper", () => ({
  default: () => <div data-testid="metric-viz" />,
}));
vi.mock("../../Footer/Footer", () => ({
  Footer: () => <div data-testid="footer" />,
}));
vi.mock("~shared-pathways", async () => {
  const actual = await vi.importActual("~shared-pathways");
  return {
    ...actual,
    usePageContent: vi.fn(),
  };
});

const mockUseRootStore = useRootStore as Mock;
const mockUsePageContent = usePageContent as Mock;

const mockTrackMetricSelected = vi.fn();
const mockSetSection = vi.fn();

describe("PagePublicPathways", () => {
  beforeEach(() => {
    mockUsePageContent.mockReturnValue({
      title: "Prison",
      summary: "Summary",
      sections: {
        countOverTime: "Over Time",
        countByRace: "By Race",
      },
    });

    mockUseRootStore.mockReturnValue({
      currentTenantId: "US_NY",
      page: "prison",
      section: "countOverTime",
      setSection: mockSetSection,
      metricsStore: {
        current: { id: "prisonPopulationOverTime" },
        map: {
          countOverTime: { id: "prisonPopulationOverTime" },
          countByRace: { id: "prisonPopulationByRace" },
        },
      },
      analyticsStore: {
        trackMetricSelected: mockTrackMetricSelected,
        trackApplyFilters: vi.fn(),
        page: vi.fn(),
      },
      filtersStore: {
        filters: {},
        filterOptions: {},
        metric: {
          filters: { enabledFilters: [] },
          hydrationState: { status: "hydrated" },
        },
      },
    });
  });

  it("calls trackMetricSelected when a section is selected", () => {
    render(
      <MemoryRouter>
        <PagePublicPathways />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("menuitem", { name: "By Race" }));

    expect(mockSetSection).toHaveBeenCalledWith("countByRace");
    expect(mockTrackMetricSelected).toHaveBeenCalledWith({
      metricId: "prisonPopulationByRace",
    });
  });
});
