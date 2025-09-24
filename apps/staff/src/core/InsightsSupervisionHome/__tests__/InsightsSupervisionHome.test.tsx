// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { act, render, screen } from "@testing-library/react";
import { configure, observable, runInAction } from "mobx";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { Mock, vi } from "vitest";

import { InsightsConfigFixture } from "~datatypes";

import { useRootStore } from "../../../components/StoreProvider";
import { InsightsStore } from "../../../InsightsStore/InsightsStore";
import { InsightsSupervisionStore } from "../../../InsightsStore/stores/InsightsSupervisionStore";
import { RootStore } from "../../../RootStore";
import { INSIGHTS_PATHS, insightsUrl } from "../../views";
import { InsightsSupervisionHome } from "../InsightsSupervisionHome";

vi.mock("../../../components/StoreProvider");

const useRootStoreMock = useRootStore as Mock;

let insightsStore: InsightsStore;
let supervisionStore: InsightsSupervisionStore;

function createTestRouter(initialPath = "/insights/supervision") {
  const router = createMemoryRouter(
    [
      {
        path: "/insights/supervision",
        element: <InsightsSupervisionHome />,
      },
      {
        path: INSIGHTS_PATHS.supervisionSupervisorsList,
        element: <div data-testid="supervisors-list">Supervisors List</div>,
      },
      {
        path: INSIGHTS_PATHS.supervisionSupervisor,
        element: <div data-testid="supervisor-page">Supervisor Page</div>,
      },
      {
        path: INSIGHTS_PATHS.supervisionStaff,
        element: <div data-testid="staff-page">Staff Page</div>,
      },
    ],
    {
      initialEntries: [initialPath],
      initialIndex: 0,
    },
  );
  render(<RouterProvider router={router} />);
  return router;
}

function setupBasicMocks() {
  configure({ safeDescriptors: false });
  insightsStore = new RootStore().insightsStore;

  supervisionStore = new InsightsSupervisionStore(
    insightsStore,
    InsightsConfigFixture,
  );
  insightsStore.supervisionStore = supervisionStore;

  // Always mock userAppMetadata to prevent "No state code set for user" error
  vi.spyOn(insightsStore.rootStore.userStore, "userAppMetadata", "get").mockReturnValue({
    pseudonymizedId: "hashed-user123",
    stateCode: "us_mi",
    routes: observable({}),
  });

  useRootStoreMock.mockReturnValue(insightsStore.rootStore);
}

beforeEach(() => {
  setupBasicMocks();
});

afterEach(() => {
  configure({ safeDescriptors: true });
  vi.restoreAllMocks();
});

describe("InsightsSupervisionHome routing", () => {
  const mockSupervisor = {
    displayName: "Jane Supervisor",
    fullName: { givenNames: "Jane", surname: "Supervisor" },
    externalId: "supervisor123",
    pseudonymizedId: "hashed-supervisor123",
    supervisionLocationForListPage: "District 1",
    supervisionLocationForSupervisorPage: "District 1",
    email: "jane.supervisor@example.com",
    hasOutliers: true,
  };

  const mockOfficer = {
    displayName: "John Officer",
    fullName: { givenNames: "John", surname: "Officer" },
    externalId: "officer123",
    pseudonymizedId: "hashed-officer123",
    email: "john.officer@example.com",
    district: "District 1",
    supervisorExternalIds: ["supervisor123"],
    avgDailyPopulation: 25,
    latestLoginDate: null,
  };

  const mockUserWithSupervisorsListAccess = () => {
    vi.spyOn(insightsStore.rootStore.userStore, "userAppMetadata", "get").mockReturnValue({
      pseudonymizedId: "hashed-admin123",
      stateCode: "us_mi",
      routes: observable({ "insights_supervision_supervisors-list": true }),
    });
  };

  const mockSupervisorUser = () => {
    vi.spyOn(insightsStore.rootStore.userStore, "userAppMetadata", "get").mockReturnValue({
      pseudonymizedId: "hashed-supervisor123",
      stateCode: "us_mi",
      routes: observable({ "insights_supervision_supervisors-list": false }),
    });
    vi.spyOn(supervisionStore, "currentSupervisorUser", "get").mockReturnValue(mockSupervisor);
  };

  const mockOfficerUser = () => {
    vi.spyOn(insightsStore.rootStore.userStore, "userAppMetadata", "get").mockReturnValue({
      pseudonymizedId: "hashed-officer123",
      stateCode: "us_mi",
      routes: observable({ "insights_supervision_supervisors-list": false }),
    });
    vi.spyOn(supervisionStore, "currentOfficerUser", "get").mockReturnValue(mockOfficer);
    vi.spyOn(supervisionStore, "currentSupervisorUser", "get").mockReturnValue(undefined);
  };


  describe("when user can access all supervisors", () => {
    test("redirects to supervisors list page", () => {
      mockUserWithSupervisorsListAccess();
      const router = createTestRouter();
      expect(router.state.location.pathname).toBe(insightsUrl("supervisionSupervisorsList"));
    });
  });

  describe("when user is a supervisor with supervisor page access", () => {
    test("redirects to their own supervisor page", () => {
      mockSupervisorUser();
      const router = createTestRouter();
      expect(router.state.location.pathname).toBe(
        insightsUrl("supervisionSupervisor", { supervisorPseudoId: "hashed-supervisor123" })
      );
    });
  });

  describe("when user is an officer with staff page access", () => {
    test("redirects to their own staff page", () => {
      mockOfficerUser();
      const router = createTestRouter();
      expect(router.state.location.pathname).toBe(
        insightsUrl("supervisionStaff", { officerPseudoId: "hashed-officer123" })
      );
    });
  });

  describe("when user has no access permissions", () => {
    test("shows error message for users with no permissions", async () => {
      vi.spyOn(insightsStore.rootStore.userStore, "userAppMetadata", "get").mockReturnValue({
        pseudonymizedId: "hashed-nouser123",
        stateCode: "us_mi",
        routes: observable({}),
      });

      vi.spyOn(supervisionStore, "currentOfficerUser", "get").mockReturnValue(undefined);
      vi.spyOn(supervisionStore, "currentSupervisorUser", "get").mockReturnValue(undefined);
      vi.spyOn(supervisionStore, "userCanAccessAllSupervisors", "get").mockReturnValue(false);

      // Check for the error message content using CSS class selectors
      // because screen.getByText is not working
      const { container } = render(<InsightsSupervisionHome />);
      
      expect(container.querySelector('.StatusMessage__title')).toHaveTextContent("Sorry, we’re having trouble loading this page");

    });
  });

  describe("when supervision store is not available", () => {
    test("returns null and renders nothing", () => {
      runInAction(() => {
        insightsStore.supervisionStore = undefined;
      });

      createTestRouter();

      const testIds = ["supervisors-list", "supervisor-page", "staff-page"];
      testIds.forEach(testId => {
        expect(screen.queryByTestId(testId)).not.toBeInTheDocument();
      });
      expect(screen.queryByRole("button", { name: "Reload" })).not.toBeInTheDocument();
    });
  });

  describe("redirect waits for supervision store to be hydrated", () => {
    test("waits for supervision store before redirecting", async () => {
      vi.spyOn(insightsStore.rootStore.userStore, "userAppMetadata", "get").mockReturnValue({
        pseudonymizedId: "hashed-supervisor123",
        stateCode: "us_mi",
      });

      vi.spyOn(supervisionStore, "currentSupervisorUser", "get").mockReturnValue(mockSupervisor);

      runInAction(() => {
        insightsStore.supervisionStore = undefined;
      });

      const router = createTestRouter();
      expect(router.state.location.pathname).toBe("/insights/supervision");

      await act(async () => {
        runInAction(() => {
          insightsStore.supervisionStore = supervisionStore;
        });
      });

      render(<RouterProvider router={router} />);
      expect(router.state.location.pathname).toBe(
        insightsUrl("supervisionSupervisor", { supervisorPseudoId: "hashed-supervisor123" })
      );
    });
  });
});