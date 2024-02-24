// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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

import { useRootStore } from "../../../components/StoreProvider";
import { OutliersConfigFixture } from "../../../OutliersStore/models/offlineFixtures/OutliersConfigFixture";
import { OutliersStore } from "../../../OutliersStore/OutliersStore";
import { OutliersSupervisionStore } from "../../../OutliersStore/stores/OutliersSupervisionStore";
import { RootStore } from "../../../RootStore";
import { OUTLIERS_PATHS, outliersUrl } from "../../views";
import { OutliersSupervisionHome } from "../OutliersSupervisionHome";

jest.mock("../../../components/StoreProvider");

const useRootStoreMock = useRootStore as jest.Mock;

let outliersStore: OutliersStore;
let supervisionStore: OutliersSupervisionStore;

function addPathToRouter(path: string) {
  const router = createMemoryRouter(
    [
      {
        path: "/insights/supervision",
        element: <OutliersSupervisionHome />,
      },
      {
        path,
        element: <div>test element</div>,
      },
    ],
    {
      initialEntries: [outliersUrl("supervision")],
      initialIndex: 0,
    }
  );
  render(<RouterProvider router={router} />);
  return router;
}

beforeEach(() => {
  configure({ safeDescriptors: false });
  outliersStore = new RootStore().outliersStore;

  supervisionStore = new OutliersSupervisionStore(
    outliersStore,
    OutliersConfigFixture
  );
  outliersStore.supervisionStore = supervisionStore;

  useRootStoreMock.mockReturnValue(outliersStore.rootStore);
});

afterEach(() => {
  jest.restoreAllMocks();
  configure({ safeDescriptors: true });
});

test("homepage redirects supervisors without the list permission to their own report", () => {
  jest.spyOn(supervisionStore, "currentSupervisorUser", "get").mockReturnValue({
    displayName: "",
    fullName: {},
    externalId: "abc123",
    pseudonymizedId: "hashed-abc123",
    supervisionDistrict: null,
    email: "mock-email",
    hasOutliers: true,
  });
  jest
    .spyOn(supervisionStore, "userCanAccessAllSupervisors", "get")
    .mockReturnValue(false);

  const router = addPathToRouter(OUTLIERS_PATHS.supervisionSupervisor);

  expect(router.state.location.pathname).toEqual(
    outliersUrl("supervisionSupervisor", {
      supervisorPseudoId: "hashed-abc123",
    })
  );
});

test("homepage redirects non-supervisors to the supervisors list page", () => {
  jest.spyOn(supervisionStore, "currentSupervisorUser", "get").mockReturnValue({
    displayName: "",
    fullName: {},
    externalId: "abc123",
    pseudonymizedId: "hashed-abc123",
    supervisionDistrict: null,
    email: null,
    hasOutliers: true,
  });
  jest
    .spyOn(supervisionStore, "userCanAccessAllSupervisors", "get")
    .mockReturnValue(true);

  const router = addPathToRouter(OUTLIERS_PATHS.supervisionSupervisorsList);

  expect(router.state.location.pathname).toBe(
    outliersUrl("supervisionSupervisorsList")
  );
});

test("homepage redirects non-supervisors to the supervisors list page if they have the list permission", () => {
  jest
    .spyOn(supervisionStore, "userCanAccessAllSupervisors", "get")
    .mockReturnValue(true);
  const router = addPathToRouter(outliersUrl("supervisionSupervisorsList"));

  expect(router.state.location.pathname).toBe(
    outliersUrl("supervisionSupervisorsList")
  );
});

test("homepage errors for non-supervisors without the list permission", () => {
  jest
    .spyOn(supervisionStore, "userCanAccessAllSupervisors", "get")
    .mockReturnValue(false);

  addPathToRouter(OUTLIERS_PATHS.supervision);

  expect(
    screen.getByText("Sorry, we’re having trouble loading this page")
  ).toBeInTheDocument();
});

test("redirect waits for supervision store to be hydrated", async () => {
  jest
    .spyOn(supervisionStore, "userCanAccessAllSupervisors", "get")
    .mockReturnValue(false);
  jest.spyOn(supervisionStore, "currentSupervisorUser", "get").mockReturnValue({
    displayName: "",
    fullName: {},
    externalId: "abc123",
    supervisionDistrict: null,
    pseudonymizedId: "hashed-abc123",
    email: "mock-email",
    hasOutliers: true,
  });

  runInAction(() => {
    outliersStore.supervisionStore = undefined;
  });

  let router;

  router = addPathToRouter(OUTLIERS_PATHS.supervisionSupervisor);

  expect(router.state.location.pathname).toBe(outliersUrl("supervision"));

  runInAction(() => {
    outliersStore.supervisionStore = supervisionStore;
  });

  router = addPathToRouter(OUTLIERS_PATHS.supervisionSupervisor);

  expect(router.state.location.pathname).toBe(
    outliersUrl("supervisionSupervisor", {
      supervisorPseudoId: "hashed-abc123",
    })
  );
});
