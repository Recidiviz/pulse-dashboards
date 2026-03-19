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
import FiltersPanel from "../FiltersPanel";

const mockSetFilters = vi.fn();

const raceFilter: PopulationFilter = {
  type: "race",
  title: "Race",
  options: [
    { label: "All", value: "ALL" },
    { label: "Black", value: "BLACK" },
    { label: "Hispanic", value: "HISPANIC" },
    { label: "White", value: "WHITE" },
  ],
  setFilters: mockSetFilters,
  defaultOption: { label: "All", value: "ALL" },
  defaultValue: "ALL",
};

const genderFilter: PopulationFilter = {
  type: "gender",
  title: "Gender",
  options: [
    { label: "All", value: "ALL" },
    { label: "Female", value: "FEMALE" },
    { label: "Male", value: "MALE" },
  ],
  setFilters: mockSetFilters,
  defaultOption: { label: "All", value: "ALL" },
  defaultValue: "ALL",
};

const singleSelectFilter: PopulationFilter = {
  type: "timePeriod",
  title: "Time Period",
  isSingleSelect: true,
  options: [
    { label: "6 months", value: "6" },
    { label: "1 year", value: "12" },
  ],
  setFilters: mockSetFilters,
  defaultOption: { label: "6 months", value: "6" },
  defaultValue: "6",
};

function createMockFiltersStore({
  enabledFilters = ["race", "gender"],
  filterValues = {},
}: {
  enabledFilters?: string[];
  filterValues?: Record<string, string[]>;
} = {}) {
  const filters = observable({
    race: ["ALL"],
    gender: ["ALL"],
    timePeriod: ["6"],
    ...filterValues,
  });

  const filterOptions: PopulationFilters = {
    race: raceFilter,
    gender: genderFilter,
    timePeriod: singleSelectFilter,
  } as unknown as PopulationFilters;

  return {
    filters,
    filterOptions,
    metric: {
      filters: { enabledFilters },
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

describe("FiltersPanel", () => {
  let onClose: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onClose = vi.fn();
  });

  it("renders the modal with title when open", () => {
    const store = createMockFiltersStore();
    render(
      <FiltersPanel isOpen={true} onClose={onClose} filtersStore={store} />,
      { wrapper },
    );

    expect(screen.getByText("Select Filters")).toBeInTheDocument();
  });

  it("does not render the modal when closed", () => {
    const store = createMockFiltersStore();
    render(
      <FiltersPanel isOpen={false} onClose={onClose} filtersStore={store} />,
      { wrapper },
    );

    expect(screen.queryByText("Select Filters")).not.toBeInTheDocument();
  });

  it("renders multi-select filters as checkbox groups", () => {
    const store = createMockFiltersStore();
    render(
      <FiltersPanel isOpen={true} onClose={onClose} filtersStore={store} />,
      { wrapper },
    );

    expect(screen.getByText("Race")).toBeInTheDocument();
    expect(screen.getByText("Gender")).toBeInTheDocument();
    expect(screen.getByText("Black")).toBeInTheDocument();
    expect(screen.getByText("Female")).toBeInTheDocument();
  });

  it("excludes single-select filters from the checkbox groups", () => {
    const store = createMockFiltersStore({
      enabledFilters: ["race", "timePeriod"],
    });
    render(
      <FiltersPanel isOpen={true} onClose={onClose} filtersStore={store} />,
      { wrapper },
    );

    expect(screen.getByText("Race")).toBeInTheDocument();
    expect(screen.queryByText("Time Period")).not.toBeInTheDocument();
  });

  it("renders Apply and Reset buttons", () => {
    const store = createMockFiltersStore();
    render(
      <FiltersPanel isOpen={true} onClose={onClose} filtersStore={store} />,
      { wrapper },
    );

    expect(screen.getByRole("button", { name: /apply/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /reset filters/i }),
    ).toBeInTheDocument();
  });

  it("calls setFilters and onClose when Apply is clicked", () => {
    const store = createMockFiltersStore();
    render(
      <FiltersPanel isOpen={true} onClose={onClose} filtersStore={store} />,
      { wrapper },
    );

    // Toggle a checkbox to create pending filters
    fireEvent.click(screen.getByTestId("checkbox-BLACK"));
    fireEvent.click(screen.getByRole("button", { name: /apply/i }));

    expect(store.setFilters).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("calls resetFilters and onClose when Reset is clicked", () => {
    const store = createMockFiltersStore();
    render(
      <FiltersPanel isOpen={true} onClose={onClose} filtersStore={store} />,
      { wrapper },
    );

    fireEvent.click(screen.getByRole("button", { name: /reset filters/i }));

    expect(store.resetFilters).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onClose when modal close button is clicked", async () => {
    const store = createMockFiltersStore();
    render(
      <FiltersPanel isOpen={true} onClose={onClose} filtersStore={store} />,
      { wrapper },
    );

    fireEvent.click(screen.getByLabelText("Close modal"));

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("shows all options as selected when filter value is ALL", () => {
    const store = createMockFiltersStore({
      filterValues: { race: ["ALL"] },
    });
    render(
      <FiltersPanel isOpen={true} onClose={onClose} filtersStore={store} />,
      { wrapper },
    );

    // When ALL, every non-ALL option should be checked
    expect(screen.getByTestId("checkbox-BLACK")).toBeChecked();
    expect(screen.getByTestId("checkbox-HISPANIC")).toBeChecked();
    expect(screen.getByTestId("checkbox-WHITE")).toBeChecked();
  });

  it("shows only selected options as checked when specific values are set", () => {
    const store = createMockFiltersStore({
      filterValues: { race: ["BLACK", "WHITE"] },
    });
    render(
      <FiltersPanel isOpen={true} onClose={onClose} filtersStore={store} />,
      { wrapper },
    );

    expect(screen.getByTestId("checkbox-BLACK")).toBeChecked();
    expect(screen.getByTestId("checkbox-HISPANIC")).not.toBeChecked();
    expect(screen.getByTestId("checkbox-WHITE")).toBeChecked();
  });

  it("applies pending filter changes without mutating store until Apply", () => {
    const store = createMockFiltersStore({
      filterValues: { race: ["ALL"] },
    });
    render(
      <FiltersPanel isOpen={true} onClose={onClose} filtersStore={store} />,
      { wrapper },
    );

    // Uncheck a checkbox — this should create a pending change, not call setFilters
    fireEvent.click(screen.getByTestId("checkbox-BLACK"));

    expect(store.setFilters).not.toHaveBeenCalled();

    // Now apply
    fireEvent.click(screen.getByRole("button", { name: /apply/i }));

    expect(store.setFilters).toHaveBeenCalledOnce();
  });

  it("does not render filters that are not enabled", () => {
    const store = createMockFiltersStore({
      enabledFilters: ["race"],
    });
    render(
      <FiltersPanel isOpen={true} onClose={onClose} filtersStore={store} />,
      { wrapper },
    );

    expect(screen.getByText("Race")).toBeInTheDocument();
    expect(screen.queryByText("Gender")).not.toBeInTheDocument();
  });
});
