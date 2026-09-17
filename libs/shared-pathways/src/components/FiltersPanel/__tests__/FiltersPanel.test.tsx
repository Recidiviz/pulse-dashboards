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

const calendarYearFilter = {
  type: "calendarYear",
  title: "Calendar year",
  description:
    "Bar charts show a single calendar year at a time. The Overview chart shows all years.",
  isSingleSelect: true,
  options: [
    { label: "All", value: "ALL" },
    { label: "2024", value: "2024" },
    { label: "2025", value: "2025" },
  ],
  setFilters: mockSetFilters,
  defaultOption: { label: "All", value: "ALL" },
  defaultValue: "ALL",
};

function createMockFiltersStore({
  enabledFilters = ["race", "gender"],
  filterValues = {},
  multiSelectFilters = [],
}: {
  enabledFilters?: string[];
  filterValues?: Record<string, string[]>;
  multiSelectFilters?: readonly string[];
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
    calendarYear: calendarYearFilter,
  } as unknown as PopulationFilters;

  return {
    filters,
    filterOptions,
    metric: {
      filters: { enabledFilters },
      hydrationState: { status: "hydrated" },
      dynamicFilterOptions: {},
      multiSelectFilters,
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

  it("renders time period filter as a dropdown, not checkbox groups", () => {
    const store = createMockFiltersStore({
      enabledFilters: ["race", "timePeriod"],
    });
    render(
      <FiltersPanel isOpen={true} onClose={onClose} filtersStore={store} />,
      { wrapper },
    );

    // Race should render as a checkbox group
    expect(screen.getByText("Race")).toBeInTheDocument();
    expect(screen.getByTestId("checkbox-BLACK")).toBeInTheDocument();

    // Time Period should render as a dropdown label, not checkboxes
    expect(screen.getByText("Time Period")).toBeInTheDocument();
    expect(screen.queryByTestId("checkbox-6")).not.toBeInTheDocument();
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

  it("calls trackApplyFilters with current filters when Apply is clicked", () => {
    const store = createMockFiltersStore({
      filterValues: { race: ["BLACK"], gender: ["ALL"] },
    });
    const trackApplyFilters = vi.fn();
    render(
      <FiltersPanel
        isOpen={true}
        onClose={onClose}
        filtersStore={store}
        trackApplyFilters={trackApplyFilters}
      />,
      { wrapper },
    );

    fireEvent.click(screen.getByRole("button", { name: /apply/i }));

    expect(trackApplyFilters).toHaveBeenCalledWith({
      race: ["BLACK"],
      gender: ["ALL"],
      timePeriod: ["6"],
    });
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

describe("FiltersPanel per-metric multi-select", () => {
  const onClose = vi.fn();

  it("renders a single-select filter as radios by default", () => {
    const store = createMockFiltersStore({
      enabledFilters: ["calendarYear"],
      filterValues: { calendarYear: ["ALL"] },
    });
    render(<FiltersPanel isOpen onClose={onClose} filtersStore={store} />, {
      wrapper,
    });

    expect(screen.getByText("Calendar year")).toBeInTheDocument();
    expect(screen.getAllByRole("radio").length).toBeGreaterThan(0);
    expect(screen.queryAllByRole("checkbox")).toHaveLength(0);
  });

  it("renders the same filter as checkboxes when the metric lists it as multi-select", () => {
    const store = createMockFiltersStore({
      enabledFilters: ["calendarYear"],
      filterValues: { calendarYear: ["ALL"] },
      multiSelectFilters: ["calendarYear"],
    });
    render(<FiltersPanel isOpen onClose={onClose} filtersStore={store} />, {
      wrapper,
    });

    expect(screen.getAllByRole("checkbox").length).toBeGreaterThan(0);
    expect(screen.queryAllByRole("radio")).toHaveLength(0);
  });

  it("shows the filter's description only where it renders as radios", () => {
    const single = createMockFiltersStore({
      enabledFilters: ["calendarYear"],
      filterValues: { calendarYear: ["ALL"] },
    });
    const { unmount } = render(
      <FiltersPanel isOpen onClose={onClose} filtersStore={single} />,
      { wrapper },
    );
    expect(
      screen.getByText(/Bar charts show a single calendar year/),
    ).toBeInTheDocument();
    unmount();

    const multi = createMockFiltersStore({
      enabledFilters: ["calendarYear"],
      filterValues: { calendarYear: ["ALL"] },
      multiSelectFilters: ["calendarYear"],
    });
    render(<FiltersPanel isOpen onClose={onClose} filtersStore={multi} />, {
      wrapper,
    });
    expect(
      screen.queryByText(/Bar charts show a single calendar year/),
    ).not.toBeInTheDocument();
  });
});

describe("FiltersPanel grouped options", () => {
  const onClose = vi.fn();

  const admissionTypeFilter = {
    type: "admissionType",
    title: "Latest Admission Type",
    options: [
      { label: "All", value: "ALL" },
      {
        label: "Court Commitment",
        value: "Incarcerated Individual|Court Commitment",
        group: "Incarcerated Individuals",
      },
      {
        label: "Other",
        value: "Incarcerated Individual|Other",
        group: "Incarcerated Individuals",
      },
      {
        label: "Other",
        value: "Incarcerated Parolee|Other",
        group: "Incarcerated Parolees",
      },
    ],
    setFilters: mockSetFilters,
    defaultOption: { label: "All", value: "ALL" },
    defaultValue: "ALL",
  };

  function groupedStore(disabledFilters?: Record<string, string>) {
    const store = createMockFiltersStore({
      enabledFilters: ["admissionType"],
      filterValues: { admissionType: ["ALL"] },
    });
    store.filterOptions.admissionType = admissionTypeFilter;
    return { store, disabledFilters };
  }

  it("renders one titled section per group", () => {
    const { store } = groupedStore();
    render(<FiltersPanel isOpen onClose={onClose} filtersStore={store} />, {
      wrapper,
    });

    expect(
      screen.getByText("Latest Admission Type — Incarcerated Individuals"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Latest Admission Type — Incarcerated Parolees"),
    ).toBeInTheDocument();
  });

  it("keeps one group's Other selected when the other group's is cleared", async () => {
    const { store } = groupedStore();
    render(<FiltersPanel isOpen onClose={onClose} filtersStore={store} />, {
      wrapper,
    });

    // Clear the Individuals group wholesale via its select-all control.
    fireEvent.click(
      screen.getByLabelText(
        "Select all Latest Admission Type — Incarcerated Individuals",
      ),
    );
    fireEvent.click(screen.getByText("Apply"));

    const applied = store.setFilters.mock.calls[0][0].admissionType as string[];

    expect(applied).toContain("Incarcerated Parolee|Other");
    expect(applied).not.toContain("Incarcerated Individual|Other");
  });

  it("disables a filter the caller marked unavailable", () => {
    const { store } = groupedStore();
    render(
      <FiltersPanel
        isOpen
        onClose={onClose}
        filtersStore={store}
        disabledFilters={{ admissionType: "Releases only" }}
      />,
      { wrapper },
    );

    screen.getAllByRole("checkbox").forEach((box) => {
      expect(box).toBeDisabled();
    });
  });
});

describe("FiltersPanel ordering", () => {
  const onClose = vi.fn();

  // calendarYear is a radio and race is checkboxes, so the radios-first
  // default and the declared order disagree — which makes the choice visible.
  const setup = (renderInDeclaredOrder: boolean) => {
    const store = createMockFiltersStore({
      enabledFilters: ["race", "calendarYear"],
      filterValues: { calendarYear: ["ALL"] },
    });
    const { unmount } = render(
      <FiltersPanel
        isOpen
        onClose={onClose}
        filtersStore={store}
        renderInDeclaredOrder={renderInDeclaredOrder}
      />,
      { wrapper },
    );
    const titles = screen
      .getAllByText(/^(Race|Calendar year)$/)
      .map((n) => n.textContent);
    unmount();
    return titles;
  };

  it("puts every radio ahead of every checkbox by default", () => {
    expect(setup(false)).toEqual(["Calendar year", "Race"]);
  });

  it("keeps the metric's own order when asked", () => {
    expect(setup(true)).toEqual(["Race", "Calendar year"]);
  });
});

describe("FiltersPanel select-all round trip", () => {
  const onClose = vi.fn();

  const applyAfter = (
    store: ReturnType<typeof createMockFiltersStore>,
    clicks: string[],
  ) => {
    render(<FiltersPanel isOpen onClose={onClose} filtersStore={store} />, {
      wrapper,
    });
    clicks.forEach((label) => fireEvent.click(screen.getByLabelText(label)));
    fireEvent.click(screen.getByText("Apply"));
    return store.setFilters.mock.calls[0][0];
  };

  it("reports ALL again once every option is reselected", () => {
    const store = createMockFiltersStore({ enabledFilters: ["race"] });
    const selectAll = "Select all Race";

    // Clear the group, then restore it. Ending where it started must read as
    // ALL, not as every value spelled out.
    const applied = applyAfter(store, [selectAll, selectAll]);

    expect(applied.race).toEqual(["ALL"]);
  });

  it("keeps an explicit list while the selection is partial", () => {
    const store = createMockFiltersStore({ enabledFilters: ["race"] });
    const applied = applyAfter(store, ["Select all Race"]);

    expect(applied.race).toEqual([]);
  });
});
