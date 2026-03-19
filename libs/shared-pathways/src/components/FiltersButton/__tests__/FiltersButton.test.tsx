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

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { observable } from "mobx";
import { ThemeProvider } from "styled-components";

import { PopulationFilter, PopulationFilters } from "../../../filters";
import { defaultPathwaysTheme } from "../../PathwaysTheme";
import FiltersButton from "../FiltersButton";

const raceFilter: PopulationFilter = {
  type: "race",
  title: "Race",
  options: [
    { label: "All", value: "ALL" },
    { label: "Black", value: "BLACK" },
    { label: "White", value: "WHITE" },
  ],
  setFilters: vi.fn(),
  defaultOption: { label: "All", value: "ALL" },
  defaultValue: "ALL",
};

function createMockFiltersStore() {
  const filters = observable({ race: ["ALL"] });
  const filterOptions: PopulationFilters = {
    race: raceFilter,
  } as unknown as PopulationFilters;

  return {
    filters,
    filterOptions,
    metric: {
      filters: { enabledFilters: ["race"] },
      hydrationState: { status: "hydrated" },
      dynamicFilterOptions: {},
    },
    setFilters: vi.fn(),
    resetFilters: vi.fn(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider theme={defaultPathwaysTheme}>{children}</ThemeProvider>
);

describe("FiltersButton", () => {
  it("renders the Filters button", () => {
    render(<FiltersButton filtersStore={createMockFiltersStore()} />, {
      wrapper,
    });

    expect(
      screen.getByRole("button", { name: /filters/i }),
    ).toBeInTheDocument();
  });

  it("has aria-haspopup dialog attribute", () => {
    render(<FiltersButton filtersStore={createMockFiltersStore()} />, {
      wrapper,
    });

    const button = screen.getByRole("button", { name: /filters/i });
    expect(button).toHaveAttribute("aria-haspopup", "dialog");
  });

  it("opens the filters panel when clicked", () => {
    render(<FiltersButton filtersStore={createMockFiltersStore()} />, {
      wrapper,
    });

    const button = screen.getByRole("button", { name: /filters/i });
    expect(button).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(button);

    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Select Filters")).toBeInTheDocument();
  });

  it("returns focus to the button when the modal is closed", async () => {
    render(<FiltersButton filtersStore={createMockFiltersStore()} />, {
      wrapper,
    });

    const button = screen.getByRole("button", { name: /filters/i });
    fireEvent.click(button);

    // Close the modal
    fireEvent.click(screen.getByLabelText("Close modal"));

    await waitFor(() => {
      expect(button).toHaveFocus();
    });
  });
});
