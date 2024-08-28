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

import { render, screen } from "@testing-library/react";
import { configure, runInAction } from "mobx";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { Mock } from "vitest";

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

function addPathToRouter(path: string) {
  const router = createMemoryRouter(
    [
      {
        path: "/insights/supervision",
        element: <InsightsSupervisionHome />,
      },
      {
        path,
        element: <div>test element</div>,
      },
    ],
    {
      initialEntries: [insightsUrl("supervision")],
      initialIndex: 0,
    },
  );
  render(<RouterProvider router={router} />);
  return router;
}

beforeEach(async () => {
  configure({ safeDescriptors: false });
  insightsStore = new RootStore().insightsStore;

  supervisionStore = new InsightsSupervisionStore(
    insightsStore,
    InsightsConfigFixture,
  );
  insightsStore.supervisionStore = supervisionStore;

  useRootStoreMock.mockReturnValue(insightsStore.rootStore);
});

afterEach(() => {
  configure({ safeDescriptors: true });
});

test("homepage redirects supervisors without the list permission to their own report", () => {
  vi.spyOn(supervisionStore, "currentSupervisorUser", "get").mockReturnValue({
    displayName: "",
    fullName: {},
    externalId: "abc123",
    pseudonymizedId: "hashed-abc123",
    supervisionDistrict: null,
    email: "mock-email",
    hasOutliers: true,
  });
  vi.spyOn(
    supervisionStore,
    "userCanAccessAllSupervisors",
    "get",
  ).mockReturnValue(false);

  const router = addPathToRouter(INSIGHTS_PATHS.supervisionSupervisor);

  expect(router.state.location.pathname).toEqual(
    insightsUrl("supervisionSupervisor", {
      supervisorPseudoId: "hashed-abc123",
    }),
  );
});

test("homepage redirects non-supervisors to the supervisors list page", () => {
  vi.spyOn(supervisionStore, "currentSupervisorUser", "get").mockReturnValue({
    displayName: "",
    fullName: {},
    externalId: "abc123",
    pseudonymizedId: "hashed-abc123",
    supervisionDistrict: null,
    email: null,
    hasOutliers: true,
  });
  vi.spyOn(
    supervisionStore,
    "userCanAccessAllSupervisors",
    "get",
  ).mockReturnValue(true);

  const router = addPathToRouter(INSIGHTS_PATHS.supervisionSupervisorsList);

  expect(router.state.location.pathname).toBe(
    insightsUrl("supervisionSupervisorsList"),
  );
});

test("homepage redirects non-supervisors to the supervisors list page if they have the list permission", () => {
  vi.spyOn(
    supervisionStore,
    "userCanAccessAllSupervisors",
    "get",
  ).mockReturnValue(true);
  const router = addPathToRouter(insightsUrl("supervisionSupervisorsList"));

  expect(router.state.location.pathname).toBe(
    insightsUrl("supervisionSupervisorsList"),
  );
});

test("homepage errors for non-supervisors without the list permission", () => {
  vi.spyOn(
    supervisionStore,
    "userCanAccessAllSupervisors",
    "get",
  ).mockReturnValue(false);

  addPathToRouter(INSIGHTS_PATHS.supervision);

  expect(
    screen.getByText("Sorry, we’re having trouble loading this page"),
  ).toBeInTheDocument();
});

test("redirect waits for supervision store to be hydrated", async () => {
  vi.spyOn(
    supervisionStore,
    "userCanAccessAllSupervisors",
    "get",
  ).mockReturnValue(false);
  vi.spyOn(supervisionStore, "currentSupervisorUser", "get").mockReturnValue({
    displayName: "",
    fullName: {},
    externalId: "abc123",
    supervisionDistrict: null,
    pseudonymizedId: "hashed-abc123",
    email: "mock-email",
    hasOutliers: true,
  });

  runInAction(() => {
    insightsStore.supervisionStore = undefined;
  });

  let router;

  router = addPathToRouter(INSIGHTS_PATHS.supervisionSupervisor);

  expect(router.state.location.pathname).toBe(insightsUrl("supervision"));

  runInAction(() => {
    insightsStore.supervisionStore = supervisionStore;
  });

  router = addPathToRouter(INSIGHTS_PATHS.supervisionSupervisor);

  expect(router.state.location.pathname).toBe(
    insightsUrl("supervisionSupervisor", {
      supervisorPseudoId: "hashed-abc123",
    }),
  );
});
