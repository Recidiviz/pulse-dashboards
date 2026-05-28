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

import * as StoreProvider from "../../../components/StoreProvider";
import { CaseloadTasksHydrator } from "../TasksHydrator";

vi.mock("../../../components/StoreProvider");

// The hydrator imports <Loading /> from @recidiviz/design-system. Stub it so
// we can identify it by a stable testid in the DOM regardless of internal
// styling/animation.
vi.mock("@recidiviz/design-system", async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    Loading: () => <div data-testid="generic-loading" />,
  };
});

type WorkflowsStoreMock = {
  searchStore: { selectedSearchIds: string[] };
  caseloadPersons: Array<unknown>;
  supervisionTasksLoaded: () => boolean;
  hasSupervisionTasks: boolean;
};

function setupRootStore({
  selectedSearchIds = ["officer-1"],
  caseloadPersons = [],
  supervisionTasksLoaded = true,
  hasSupervisionTasks = true,
}: Partial<{
  selectedSearchIds: string[];
  caseloadPersons: Array<unknown>;
  supervisionTasksLoaded: boolean;
  hasSupervisionTasks: boolean;
}> = {}) {
  const workflowsStore: WorkflowsStoreMock = {
    searchStore: { selectedSearchIds },
    caseloadPersons,
    supervisionTasksLoaded: () => supervisionTasksLoaded,
    hasSupervisionTasks,
  };
  vi.mocked(StoreProvider.useRootStore).mockReturnValue({
    workflowsStore,
  } as never);
}

describe("CaseloadTasksHydrator", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the initial node when no caseload is selected", () => {
    setupRootStore({ selectedSearchIds: [] });
    render(
      <CaseloadTasksHydrator
        initial={<div data-testid="initial" />}
        empty={<div data-testid="empty" />}
        loading={<div data-testid="custom-loading" />}
        hydrated={<div data-testid="hydrated" />}
      />,
    );
    expect(screen.getByTestId("initial")).toBeInTheDocument();
    expect(screen.queryByTestId("custom-loading")).not.toBeInTheDocument();
    expect(screen.queryByTestId("generic-loading")).not.toBeInTheDocument();
    expect(screen.queryByTestId("hydrated")).not.toBeInTheDocument();
  });

  describe("loading branch", () => {
    it("renders the generic <Loading /> spinner when no loading prop is provided", () => {
      setupRootStore({ supervisionTasksLoaded: false });
      render(
        <CaseloadTasksHydrator
          initial={<div data-testid="initial" />}
          empty={<div data-testid="empty" />}
          hydrated={<div data-testid="hydrated" />}
        />,
      );
      expect(screen.getByTestId("generic-loading")).toBeInTheDocument();
      expect(screen.queryByTestId("hydrated")).not.toBeInTheDocument();
    });

    it("renders the custom loading node when provided (Tasks-page generic spinner is replaced)", () => {
      setupRootStore({ supervisionTasksLoaded: false });
      render(
        <CaseloadTasksHydrator
          initial={<div data-testid="initial" />}
          empty={<div data-testid="empty" />}
          loading={<div data-testid="custom-loading" />}
          hydrated={<div data-testid="hydrated" />}
        />,
      );
      expect(screen.getByTestId("custom-loading")).toBeInTheDocument();
      expect(screen.queryByTestId("generic-loading")).not.toBeInTheDocument();
      expect(screen.queryByTestId("hydrated")).not.toBeInTheDocument();
    });
  });

  it("renders the empty node when nothing matches and loading is done", () => {
    setupRootStore({
      supervisionTasksLoaded: true,
      hasSupervisionTasks: false,
    });
    render(
      <CaseloadTasksHydrator
        initial={<div data-testid="initial" />}
        empty={<div data-testid="empty" />}
        loading={<div data-testid="custom-loading" />}
        hydrated={<div data-testid="hydrated" />}
      />,
    );
    expect(screen.getByTestId("empty")).toBeInTheDocument();
    expect(screen.queryByTestId("custom-loading")).not.toBeInTheDocument();
  });

  it("renders the hydrated node when data is available, regardless of loading prop presence", () => {
    setupRootStore({
      supervisionTasksLoaded: true,
      hasSupervisionTasks: true,
    });
    render(
      <CaseloadTasksHydrator
        initial={<div data-testid="initial" />}
        empty={<div data-testid="empty" />}
        loading={<div data-testid="custom-loading" />}
        hydrated={<div data-testid="hydrated" />}
      />,
    );
    expect(screen.getByTestId("hydrated")).toBeInTheDocument();
    expect(screen.queryByTestId("custom-loading")).not.toBeInTheDocument();
    expect(screen.queryByTestId("generic-loading")).not.toBeInTheDocument();
  });
});
