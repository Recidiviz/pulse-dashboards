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
import { Client } from "../../../WorkflowsStore/Client";
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
  rootStore: {
    userStore: {
      activeFeatureVariants: { customTasks?: object };
    };
  };
};

function setupRootStore({
  selectedSearchIds = ["officer-1"],
  caseloadPersons = [],
  supervisionTasksLoaded = true,
  hasSupervisionTasks = true,
  customTasksFlagOn = false,
}: Partial<{
  selectedSearchIds: string[];
  caseloadPersons: Array<unknown>;
  supervisionTasksLoaded: boolean;
  hasSupervisionTasks: boolean;
  customTasksFlagOn: boolean;
}> = {}) {
  const workflowsStore: WorkflowsStoreMock = {
    searchStore: { selectedSearchIds },
    caseloadPersons,
    supervisionTasksLoaded: () => supervisionTasksLoaded,
    hasSupervisionTasks,
    rootStore: {
      userStore: {
        activeFeatureVariants: customTasksFlagOn ? { customTasks: {} } : {},
      },
    },
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

  describe("emptyWhenNoClients (My Caseload)", () => {
    it("renders hydrated when the caseload has clients but no tasks", () => {
      // Default behavior would treat this as empty (no supervision tasks); with
      // emptyWhenNoClients the caseload-with-clients renders the table.
      setupRootStore({
        supervisionTasksLoaded: true,
        hasSupervisionTasks: false,
        caseloadPersons: [{}],
      });
      render(
        <CaseloadTasksHydrator
          emptyWhenNoClients
          initial={<div data-testid="initial" />}
          empty={<div data-testid="empty" />}
          hydrated={<div data-testid="hydrated" />}
        />,
      );
      expect(screen.getByTestId("hydrated")).toBeInTheDocument();
      expect(screen.queryByTestId("empty")).not.toBeInTheDocument();
    });

    it("renders empty when the caseload genuinely has no clients", () => {
      setupRootStore({
        supervisionTasksLoaded: true,
        hasSupervisionTasks: false,
        caseloadPersons: [],
      });
      render(
        <CaseloadTasksHydrator
          emptyWhenNoClients
          initial={<div data-testid="initial" />}
          empty={<div data-testid="empty" />}
          hydrated={<div data-testid="hydrated" />}
        />,
      );
      expect(screen.getByTestId("empty")).toBeInTheDocument();
      expect(screen.queryByTestId("hydrated")).not.toBeInTheDocument();
    });

    it("still gates on tasks (default) when the prop is omitted", () => {
      setupRootStore({
        supervisionTasksLoaded: true,
        hasSupervisionTasks: false,
        caseloadPersons: [{}],
      });
      render(
        <CaseloadTasksHydrator
          initial={<div data-testid="initial" />}
          empty={<div data-testid="empty" />}
          hydrated={<div data-testid="hydrated" />}
        />,
      );
      expect(screen.getByTestId("empty")).toBeInTheDocument();
    });
  });

  describe("custom tasks hydration", () => {
    function makePersonWithStores({
      supervisionHydrated = false,
      customHydrated = false,
      hasCustomTasks = true,
    }: {
      supervisionHydrated?: boolean;
      customHydrated?: boolean;
      hasCustomTasks?: boolean;
    } = {}) {
      const person = Object.create(Client.prototype);
      person.supervisionTasks = {
        hydrate: vi.fn(),
        hydrationState: {
          status: supervisionHydrated ? "hydrated" : "needs hydration",
        },
      };
      if (hasCustomTasks) {
        person.customTasks = {
          hydrate: vi.fn(),
          hydrationState: {
            status: customHydrated ? "hydrated" : "needs hydration",
          },
        };
      }
      return person as Client;
    }

    it("hydrates customTasks for each Client when the flag is on", () => {
      const person = makePersonWithStores();
      setupRootStore({
        caseloadPersons: [person],
        customTasksFlagOn: true,
      });
      render(
        <CaseloadTasksHydrator hydrated={<div data-testid="hydrated" />} />,
      );
      expect(person.customTasks?.hydrate).toHaveBeenCalled();
    });

    it("does NOT hydrate customTasks when the flag is off", () => {
      const person = makePersonWithStores();
      setupRootStore({
        caseloadPersons: [person],
        customTasksFlagOn: false,
      });
      render(
        <CaseloadTasksHydrator hydrated={<div data-testid="hydrated" />} />,
      );
      expect(person.customTasks?.hydrate).not.toHaveBeenCalled();
    });

    it("skips customTasks hydration when the subscription is already hydrated", () => {
      const person = makePersonWithStores({ customHydrated: true });
      setupRootStore({
        caseloadPersons: [person],
        customTasksFlagOn: true,
      });
      render(
        <CaseloadTasksHydrator hydrated={<div data-testid="hydrated" />} />,
      );
      expect(person.customTasks?.hydrate).not.toHaveBeenCalled();
    });

    it("tolerates Clients without a customTasks store (flag off at Client construction time)", () => {
      const person = makePersonWithStores({ hasCustomTasks: false });
      setupRootStore({
        caseloadPersons: [person],
        customTasksFlagOn: true,
      });
      expect(() =>
        render(
          <CaseloadTasksHydrator hydrated={<div data-testid="hydrated" />} />,
        ),
      ).not.toThrow();
    });
  });
});
