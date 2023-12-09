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
import { StaticRouter, StaticRouterProps } from "react-router-dom";

import { useRootStore } from "../../../components/StoreProvider";
import { OutliersConfigFixture } from "../../../OutliersStore/models/offlineFixtures/OutliersConfigFixture";
import { OutliersStore } from "../../../OutliersStore/OutliersStore";
import { OutliersSupervisionStore } from "../../../OutliersStore/stores/OutliersSupervisionStore";
import { RootStore } from "../../../RootStore";
import { outliersUrl } from "../../views";
import { OutliersSupervisionHome } from "../OutliersSupervisionHome";

jest.mock("../../../components/StoreProvider");

const useRootStoreMock = useRootStore as jest.Mock;

let outliersStore: OutliersStore;
let supervisionStore: OutliersSupervisionStore;

let routerContext: NonNullable<StaticRouterProps["context"]>;

beforeEach(() => {
  configure({ safeDescriptors: false });
  outliersStore = new RootStore().outliersStore;

  supervisionStore = new OutliersSupervisionStore(
    outliersStore,
    OutliersConfigFixture
  );
  outliersStore.supervisionStore = supervisionStore;

  useRootStoreMock.mockReturnValue(outliersStore.rootStore);

  routerContext = {};
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
  });
  jest
    .spyOn(supervisionStore, "userCanAccessAllSupervisors", "get")
    .mockReturnValue(false);

  render(
    <StaticRouter location={outliersUrl("supervision")} context={routerContext}>
      <OutliersSupervisionHome>null</OutliersSupervisionHome>
    </StaticRouter>
  );

  expect(routerContext.url).toBe(
    outliersUrl("supervisionSupervisor", {
      supervisorPseudoId: "hashed-abc123",
    })
  );
});

test("homepage redirects supervisors to the supervisors list page if they have the list permission", () => {
  jest.spyOn(supervisionStore, "currentSupervisorUser", "get").mockReturnValue({
    displayName: "",
    fullName: {},
    externalId: "abc123",
    pseudonymizedId: "hashed-abc123",
    supervisionDistrict: null,
  });
  jest
    .spyOn(supervisionStore, "userCanAccessAllSupervisors", "get")
    .mockReturnValue(true);

  render(
    <StaticRouter location={outliersUrl("supervision")} context={routerContext}>
      <OutliersSupervisionHome>null</OutliersSupervisionHome>
    </StaticRouter>
  );

  expect(routerContext.url).toBe(outliersUrl("supervisionSupervisorsList"));
});

test("homepage redirects non-supervisors to the supervisors list page if they have the list permission", () => {
  jest
    .spyOn(supervisionStore, "userCanAccessAllSupervisors", "get")
    .mockReturnValue(true);
  render(
    <StaticRouter location={outliersUrl("supervision")} context={routerContext}>
      <OutliersSupervisionHome>null</OutliersSupervisionHome>
    </StaticRouter>
  );

  expect(routerContext.url).toBe(outliersUrl("supervisionSupervisorsList"));
});

test("homepage errors for non-supervisors without the list permission", () => {
  jest
    .spyOn(supervisionStore, "userCanAccessAllSupervisors", "get")
    .mockReturnValue(false);
  render(
    <StaticRouter location={outliersUrl("supervision")} context={routerContext}>
      <OutliersSupervisionHome>null</OutliersSupervisionHome>
    </StaticRouter>
  );
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
  });

  runInAction(() => {
    outliersStore.supervisionStore = undefined;
  });

  render(
    <StaticRouter location={outliersUrl("supervision")} context={routerContext}>
      <OutliersSupervisionHome>null</OutliersSupervisionHome>
    </StaticRouter>
  );

  expect(routerContext.url).toBeUndefined();

  runInAction(() => {
    outliersStore.supervisionStore = supervisionStore;
  });
  expect(routerContext.url).toBe(
    outliersUrl("supervisionSupervisor", {
      supervisorPseudoId: "hashed-abc123",
    })
  );
});
