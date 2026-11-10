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

import type { OnChangeFn, SortingState } from "@tanstack/react-table";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import React from "react";

import {
  AlertType,
  APPLICATION_LAST_UPDATED_STATUS,
  USER_ROLE,
} from "~@idaho-th/shared";

import type { PaginationProps } from "../../../../hooks/usePagination";
import type { HousingApplication } from "../../../../interfaces/common";
import { ApplicationsTable } from "../ApplicationsTable";
import type { ApplicationsTableFilters } from "../applicationsTable.filters";
import {
  EMPTY_APPLICATIONS_TABLE_FILTERS,
  STAFF_STATUS_FILTER_OPTIONS,
  STAGE_FILTER_OPTIONS,
} from "../applicationsTable.filters";

vi.mock("../ApplicationsFilterDropdown", () => ({
  ApplicationsFilterDropdown: ({
    onClose,
  }: {
    filters: ApplicationsTableFilters;
    onChange: (f: ApplicationsTableFilters) => void;
    onClose: () => void;
  }) => (
    <div role="dialog" aria-label="Filters">
      <button type="button" onClick={onClose}>
        Close
      </button>
      <div>Filters panel</div>
    </div>
  ),
}));

vi.mock("../../../assets/Filter.svg?react", () => ({
  default: () => <svg />,
}));
vi.mock("../../../assets/sort-icon.svg?react", () => ({
  default: () => <svg />,
}));
vi.mock("../../../assets/tabler-icon-corner-down-right.svg?react", () => ({
  default: () => <svg />,
}));
vi.mock("../../../assets/chevron-left.svg?react", () => ({
  default: () => <svg />,
}));
vi.mock("../../../assets/chevron-right.svg?react", () => ({
  default: () => <svg />,
}));
vi.mock("../../../assets/arrow-sm-right.svg?react", () => ({
  default: () => <svg />,
}));

const mockUseIdahoTHStore = vi.fn(() => ({
  rootStore: {
    userStore: { user: undefined as { role?: string } | undefined },
  },
}));
vi.mock("../../../../datastores/IdahoTHStoreContext", () => ({
  useIdahoTHStore: () => mockUseIdahoTHStore(),
}));

describe("ApplicationsTable", () => {
  const makePagination = (
    overrides?: Partial<PaginationProps>,
  ): PaginationProps =>
    ({
      pageIndex: 0,
      pageSize: 10,
      totalCount: 1,
      canNextPage: false,
      canPreviousPage: false,
      onNextPage: vi.fn(),
      onPreviousPage: vi.fn(),
      ...overrides,
    }) as PaginationProps;

  const baseCommon = {
    sorting: [] as SortingState,
    onSortingChange: vi.fn() as OnChangeFn<SortingState>,
    onFiltersChange: vi.fn(),
  };

  const baseApplication: HousingApplication = {
    id: "app-1",
    clientName: "Alice Test",
    expectedReleaseDate: null,
    stage: "APPLICATION",
    subStage: "PROVIDER_REVIEW",
    status: "ACTION_NEEDED",
    idocNumber: "12345",
    releaseTaskProgress: null,
    lastUpdatedAt: new Date("2026-01-01T00:00:00.000Z"),
    lastUpdatedStatus: null,
  };

  const releaseDateAlert = (deltaDays: number) => ({
    id: "alert-release",
    type: AlertType.RELEASE_DATE_CHANGED,
    metadata: { deltaDays },
  });

  const renderProviderRow = (overrides: Partial<HousingApplication>) => {
    mockUseIdahoTHStore.mockReturnValue({
      rootStore: { userStore: { user: { role: USER_ROLE.PROVIDER } } },
    });
    return render(
      <ApplicationsTable
        applications={[{ ...baseApplication, ...overrides }]}
        emptyState={<div data-testid="empty-state">EMPTY</div>}
        isLoading={false}
        sorting={baseCommon.sorting}
        onSortingChange={baseCommon.onSortingChange}
        filters={EMPTY_APPLICATIONS_TABLE_FILTERS}
        onFiltersChange={baseCommon.onFiltersChange}
        statusFilterOptions={STAFF_STATUS_FILTER_OPTIONS}
        onClick={vi.fn()}
        pagination={makePagination({ totalCount: 1 })}
      />,
    );
  };

  beforeEach(() => {
    mockUseIdahoTHStore.mockReturnValue({
      rootStore: { userStore: { user: undefined } },
    });
  });

  it("renders emptyState when there are no applications and no active filters", () => {
    render(
      <ApplicationsTable
        applications={[]}
        emptyState={<div data-testid="empty-state">EMPTY</div>}
        isLoading={false}
        sorting={baseCommon.sorting}
        onSortingChange={baseCommon.onSortingChange}
        filters={EMPTY_APPLICATIONS_TABLE_FILTERS}
        onFiltersChange={baseCommon.onFiltersChange}
        statusFilterOptions={STAFF_STATUS_FILTER_OPTIONS}
        onClick={vi.fn()}
        pagination={makePagination({ totalCount: 0 })}
      />,
    );

    expect(screen.getByTestId("empty-state")).toBeInTheDocument();
    expect(screen.queryByText("Filters")).not.toBeInTheDocument();
  });

  it("renders filter-empty message when there are active filters but no applications", () => {
    const filters = {
      ...EMPTY_APPLICATIONS_TABLE_FILTERS,
      stage: [STAGE_FILTER_OPTIONS[0]],
    };

    render(
      <ApplicationsTable
        applications={[]}
        emptyState={<div data-testid="empty-state">EMPTY</div>}
        isLoading={false}
        sorting={baseCommon.sorting}
        onSortingChange={baseCommon.onSortingChange}
        filters={filters}
        onFiltersChange={baseCommon.onFiltersChange}
        statusFilterOptions={STAFF_STATUS_FILTER_OPTIONS}
        onClick={vi.fn()}
        pagination={makePagination({ totalCount: 5 })}
      />,
    );

    expect(
      screen.getByText("No applications match the selected filters."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Filters" })).toBeInTheDocument();
    expect(screen.getByText("Showing 1-5 of 5")).toBeInTheDocument();
  });

  it("renders search-empty message when a search is active but no applications match", () => {
    render(
      <ApplicationsTable
        applications={[]}
        emptyState={<div data-testid="empty-state">EMPTY</div>}
        isLoading={false}
        sorting={baseCommon.sorting}
        onSortingChange={baseCommon.onSortingChange}
        filters={EMPTY_APPLICATIONS_TABLE_FILTERS}
        hasSearch
        onFiltersChange={baseCommon.onFiltersChange}
        statusFilterOptions={STAFF_STATUS_FILTER_OPTIONS}
        onClick={vi.fn()}
        pagination={makePagination({ totalCount: 0 })}
      />,
    );

    expect(
      screen.getByText("No applications found matching your search."),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("empty-state")).not.toBeInTheDocument();
  });

  it("renders loading UI when isLoading is true", () => {
    render(
      <ApplicationsTable
        applications={[]}
        emptyState={<div data-testid="empty-state">EMPTY</div>}
        isLoading
        sorting={baseCommon.sorting}
        onSortingChange={baseCommon.onSortingChange}
        filters={EMPTY_APPLICATIONS_TABLE_FILTERS}
        onFiltersChange={baseCommon.onFiltersChange}
        statusFilterOptions={STAFF_STATUS_FILTER_OPTIONS}
        onClick={vi.fn()}
        pagination={makePagination({ totalCount: 0 })}
      />,
    );

    expect(screen.getByText("Loading applications…")).toBeInTheDocument();
    expect(screen.queryByTestId("empty-state")).not.toBeInTheDocument();
  });

  it("calls onClick when a client row is clicked", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(
      <ApplicationsTable
        applications={[baseApplication]}
        emptyState={<div data-testid="empty-state">EMPTY</div>}
        isLoading={false}
        sorting={baseCommon.sorting}
        onSortingChange={baseCommon.onSortingChange}
        filters={EMPTY_APPLICATIONS_TABLE_FILTERS}
        onFiltersChange={baseCommon.onFiltersChange}
        statusFilterOptions={STAFF_STATUS_FILTER_OPTIONS}
        onClick={onClick}
        pagination={makePagination({ totalCount: 1 })}
      />,
    );

    const row = screen.getByRole("row", { name: /Alice Test/i });
    // getAvatarInitials default for two-part names: "Alice Test" => "AT"
    expect(within(row).getByText("AT")).toBeInTheDocument();

    await user.click(row);
    expect(onClick).toHaveBeenCalledWith(baseApplication);
  });

  it("shows the client name and formatted or placeholder release date", () => {
    render(
      <ApplicationsTable
        applications={[
          {
            ...baseApplication,
            expectedReleaseDate: new Date(2026, 7, 15),
          },
          {
            ...baseApplication,
            id: "app-2",
            clientName: "Bob Empty",
            expectedReleaseDate: null,
          },
        ]}
        emptyState={<div data-testid="empty-state">EMPTY</div>}
        isLoading={false}
        sorting={baseCommon.sorting}
        onSortingChange={baseCommon.onSortingChange}
        filters={EMPTY_APPLICATIONS_TABLE_FILTERS}
        onFiltersChange={baseCommon.onFiltersChange}
        statusFilterOptions={STAFF_STATUS_FILTER_OPTIONS}
        onClick={vi.fn()}
        pagination={makePagination({ totalCount: 2 })}
      />,
    );

    expect(screen.getByText("Alice Test")).toBeInTheDocument();
    expect(screen.getByText("Bob Empty")).toBeInTheDocument();
    expect(screen.getByText("Aug 15")).toBeInTheDocument();
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("shows the Moved-days annotation to a provider when the Release Date changed", () => {
    mockUseIdahoTHStore.mockReturnValue({
      rootStore: { userStore: { user: { role: USER_ROLE.PROVIDER } } },
    });

    render(
      <ApplicationsTable
        applications={[
          {
            ...baseApplication,
            expectedReleaseDate: new Date(2026, 7, 20),
            alerts: [releaseDateAlert(7)],
          },
        ]}
        emptyState={<div data-testid="empty-state">EMPTY</div>}
        isLoading={false}
        sorting={baseCommon.sorting}
        onSortingChange={baseCommon.onSortingChange}
        filters={EMPTY_APPLICATIONS_TABLE_FILTERS}
        onFiltersChange={baseCommon.onFiltersChange}
        statusFilterOptions={STAFF_STATUS_FILTER_OPTIONS}
        onClick={vi.fn()}
        pagination={makePagination({ totalCount: 1 })}
      />,
    );

    expect(screen.getByText("Aug 20")).toBeInTheDocument();
    expect(screen.getByText("Moved 7 days later")).toBeInTheDocument();
  });

  it("shows the earlier direction and singular day for a provider's Moved annotation", () => {
    mockUseIdahoTHStore.mockReturnValue({
      rootStore: { userStore: { user: { role: USER_ROLE.PROVIDER } } },
    });

    render(
      <ApplicationsTable
        applications={[
          {
            ...baseApplication,
            expectedReleaseDate: new Date(2026, 7, 20),
            alerts: [releaseDateAlert(-1)],
          },
        ]}
        emptyState={<div data-testid="empty-state">EMPTY</div>}
        isLoading={false}
        sorting={baseCommon.sorting}
        onSortingChange={baseCommon.onSortingChange}
        filters={EMPTY_APPLICATIONS_TABLE_FILTERS}
        onFiltersChange={baseCommon.onFiltersChange}
        statusFilterOptions={STAFF_STATUS_FILTER_OPTIONS}
        onClick={vi.fn()}
        pagination={makePagination({ totalCount: 1 })}
      />,
    );

    expect(screen.getByText("Moved 1 day earlier")).toBeInTheDocument();
  });

  it("never shows the Moved-days annotation to staff even when a release-date alert is present", () => {
    mockUseIdahoTHStore.mockReturnValue({
      rootStore: { userStore: { user: { role: USER_ROLE.STAFF } } },
    });

    render(
      <ApplicationsTable
        applications={[
          {
            ...baseApplication,
            expectedReleaseDate: new Date(2026, 7, 20),
            alerts: [releaseDateAlert(7)],
          },
        ]}
        emptyState={<div data-testid="empty-state">EMPTY</div>}
        isLoading={false}
        sorting={baseCommon.sorting}
        onSortingChange={baseCommon.onSortingChange}
        filters={EMPTY_APPLICATIONS_TABLE_FILTERS}
        onFiltersChange={baseCommon.onFiltersChange}
        statusFilterOptions={STAFF_STATUS_FILTER_OPTIONS}
        onClick={vi.fn()}
        pagination={makePagination({ totalCount: 1 })}
      />,
    );

    expect(screen.getByText("Aug 20")).toBeInTheDocument();
    expect(screen.queryByText(/Moved/)).not.toBeInTheDocument();
  });

  it("shows New application instead of New Updates for a NEW_APPLICATION alert", () => {
    renderProviderRow({
      lastUpdatedStatus: APPLICATION_LAST_UPDATED_STATUS.NEW_UPDATES,
      alerts: [
        { id: "alert-new", type: AlertType.NEW_APPLICATION, metadata: null },
      ],
    });

    expect(screen.getByText("New application")).toBeInTheDocument();
    expect(screen.queryByText("New Updates")).not.toBeInTheDocument();
  });

  it("shows a release-date alert only in the Release Date column", () => {
    renderProviderRow({
      expectedReleaseDate: new Date(2026, 7, 20),
      alerts: [releaseDateAlert(7)],
    });

    expect(screen.getByText("Moved 7 days later")).toBeInTheDocument();
    expect(screen.queryByText("New application")).not.toBeInTheDocument();
    expect(screen.queryByText("New Updates")).not.toBeInTheDocument();
  });

  it("shows no marker for an alert type the table does not display", () => {
    renderProviderRow({
      alerts: [
        {
          id: "alert-home-plan",
          type: AlertType.SELECTED_AS_HOME_PLAN,
          metadata: null,
        },
      ],
    });

    expect(screen.queryByText("New application")).not.toBeInTheDocument();
    expect(screen.queryByText(/Moved/)).not.toBeInTheDocument();
  });

  // Scoped to the table: the pagination controls are out of this change.
  it("has no accessibility violations in the alert-marker cells", async () => {
    renderProviderRow({
      expectedReleaseDate: new Date(2026, 7, 20),
      alerts: [
        { id: "alert-new", type: AlertType.NEW_APPLICATION, metadata: null },
        releaseDateAlert(7),
      ],
    });

    expect(await axe(screen.getByRole("table"))).toHaveNoViolations();
  });

  it("opens filter dropdown and closes it on Escape and outside clicks", async () => {
    const user = userEvent.setup();

    render(
      <ApplicationsTable
        applications={[baseApplication]}
        emptyState={<div data-testid="empty-state">EMPTY</div>}
        isLoading={false}
        sorting={baseCommon.sorting}
        onSortingChange={baseCommon.onSortingChange}
        filters={EMPTY_APPLICATIONS_TABLE_FILTERS}
        onFiltersChange={baseCommon.onFiltersChange}
        statusFilterOptions={STAFF_STATUS_FILTER_OPTIONS}
        onClick={vi.fn()}
        pagination={makePagination({ totalCount: 1 })}
      />,
    );

    await act(async () => {
      await user.click(screen.getByRole("button", { name: "Filters" }));
    });
    expect(screen.getByRole("dialog", { name: "Filters" })).toBeInTheDocument();

    act(() => {
      fireEvent.keyDown(document, { key: "Escape" });
    });
    expect(
      screen.queryByRole("dialog", { name: "Filters" }),
    ).not.toBeInTheDocument();

    await act(async () => {
      await user.click(screen.getByRole("button", { name: "Filters" }));
    });
    expect(screen.getByRole("dialog", { name: "Filters" })).toBeInTheDocument();

    act(() => {
      fireEvent.mouseDown(document.body);
    });
    expect(
      screen.queryByRole("dialog", { name: "Filters" }),
    ).not.toBeInTheDocument();
  });
});
