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
import { configure, observable } from "mobx";
import { Route, StaticRouter } from "react-router-dom";

import { useRootStore } from "../../../components/StoreProvider";
import { ADVERSE_METRIC_IDS } from "../../../OutliersStore/models/offlineFixtures/constants";
import { OutliersConfigFixture } from "../../../OutliersStore/models/offlineFixtures/OutliersConfigFixture";
import { OutliersSupervisionStore } from "../../../OutliersStore/stores/OutliersSupervisionStore";
import { RootStore } from "../../../RootStore";
import { OUTLIERS_PATHS, outliersUrl } from "../../views";
import { OutliersRoute } from "../OutliersRoute";

jest.mock("../../../components/StoreProvider");

const useRootStoreMock = useRootStore as jest.Mock;

let supervisionStore: OutliersSupervisionStore;

beforeEach(() => {
  configure({ safeDescriptors: false });
  const rootStore = new RootStore();
  const { outliersStore } = rootStore;

  supervisionStore = new OutliersSupervisionStore(
    outliersStore,
    OutliersConfigFixture
  );
  outliersStore.supervisionStore = supervisionStore;

  useRootStoreMock.mockReturnValue(rootStore);
  jest.spyOn(rootStore.userStore, "userAppMetadata", "get").mockReturnValue({
    pseudonymizedId: "hashed-abc123",
    routes: observable({ insights: true }),
    stateCode: "us_mi",
  });
});

afterEach(() => {
  jest.restoreAllMocks();
  configure({ safeDescriptors: true });
});

test("handles params for supervision home page", () => {
  render(
    <StaticRouter location={outliersUrl("supervision")}>
      <Route path={OUTLIERS_PATHS.supervision}>
        <OutliersRoute>null</OutliersRoute>
      </Route>
    </StaticRouter>
  );

  /* eslint-disable @typescript-eslint/no-non-null-assertion */
  // making non-null assertions here because we don't want false positives if supervisionStore is undefined
  expect(supervisionStore!.supervisorPseudoId).toBeUndefined();
  expect(supervisionStore!.officerPseudoId).toBeUndefined();
  expect(supervisionStore!.metricId).toBeUndefined();
  /* eslint-enable @typescript-eslint/no-non-null-assertion */
});

test("handles params for supervision supervisor page", () => {
  const mockSupervisorPseudoId = "123abc";

  render(
    <StaticRouter
      location={outliersUrl("supervisionSupervisor", {
        supervisorPseudoId: mockSupervisorPseudoId,
      })}
    >
      <Route path={OUTLIERS_PATHS.supervisionSupervisor}>
        <OutliersRoute>null</OutliersRoute>
      </Route>
    </StaticRouter>
  );

  expect(supervisionStore?.supervisorPseudoId).toBe(mockSupervisorPseudoId);
});

test("supervisor restricted from another supervisor's page", () => {
  jest
    .spyOn(
      supervisionStore.outliersStore.rootStore.userStore,
      "userAppMetadata",
      "get"
    )
    .mockReturnValue({
      pseudonymizedId: "hashed-abc123",
      routes: observable({ insights: true }),
      stateCode: "us_mi",
    });

  render(
    <StaticRouter
      location={outliersUrl("supervisionSupervisor", {
        supervisorPseudoId: "456xyz",
      })}
    >
      <Route path={OUTLIERS_PATHS.supervisionSupervisor}>
        <OutliersRoute>null</OutliersRoute>
      </Route>
    </StaticRouter>
  );

  expect(
    screen.getByText("Page Not Found", { exact: false })
  ).toBeInTheDocument();
});

test("handles params for supervision officer page", () => {
  const mockOfficerPseudoId = "123abc";

  render(
    <StaticRouter
      location={outliersUrl("supervisionStaff", {
        officerPseudoId: mockOfficerPseudoId,
      })}
    >
      <Route path={OUTLIERS_PATHS.supervisionStaff}>
        <OutliersRoute>null</OutliersRoute>
      </Route>
    </StaticRouter>
  );

  expect(supervisionStore?.supervisorPseudoId).toBeUndefined();
  expect(supervisionStore?.officerPseudoId).toBe(mockOfficerPseudoId);
});

test("handles params for supervision officer metric page", () => {
  const mockOfficerPseudoId = "123abc";
  const mockMetricId = ADVERSE_METRIC_IDS.enum.incarceration_starts;

  render(
    <StaticRouter
      location={outliersUrl("supervisionStaffMetric", {
        officerPseudoId: mockOfficerPseudoId,
        metricId: mockMetricId,
      })}
    >
      <Route path={OUTLIERS_PATHS.supervisionStaffMetric}>
        <OutliersRoute>null</OutliersRoute>
      </Route>
    </StaticRouter>
  );

  expect(supervisionStore?.supervisorPseudoId).toBeUndefined();
  expect(supervisionStore?.officerPseudoId).toBe(mockOfficerPseudoId);
  expect(supervisionStore?.metricId).toBe(mockMetricId);
});

test("handles params for supervision supervisors list page", async () => {
  render(
    <StaticRouter location={outliersUrl("supervisionSupervisorsList")}>
      <Route path={OUTLIERS_PATHS.supervisionSupervisorsList}>
        <OutliersRoute>null</OutliersRoute>
      </Route>
    </StaticRouter>
  );

  /* eslint-disable @typescript-eslint/no-non-null-assertion */
  // making non-null assertions here because we don't want false positives if supervisionStore is undefined
  expect(supervisionStore!.supervisorPseudoId).toBeUndefined();
  expect(supervisionStore!.officerPseudoId).toBeUndefined();
  expect(supervisionStore!.metricId).toBeUndefined();
  /* eslint-enable @typescript-eslint/no-non-null-assertion */
});

test("supervisors restricted from supervisors list page", () => {
  jest
    .spyOn(
      supervisionStore.outliersStore.rootStore.userStore,
      "userAppMetadata",
      "get"
    )
    .mockReturnValue({
      pseudonymizedId: "hashed-abc123",
      routes: observable({ insights: true }),
      stateCode: "us_mi",
    });

  render(
    <StaticRouter location={outliersUrl("supervisionSupervisorsList")}>
      <Route path={OUTLIERS_PATHS.supervisionSupervisorsList}>
        <OutliersRoute>null</OutliersRoute>
      </Route>
    </StaticRouter>
  );

  expect(
    screen.getByText("Page Not Found", { exact: false })
  ).toBeInTheDocument();
});

test("handles params for client detail page", () => {
  const mockOfficerPseudoId = "123abc";
  const mockMetricId = ADVERSE_METRIC_IDS.enum.incarceration_starts;
  const mockClientId = "client123";
  const mockOutcomeDate = "2023-05-14";

  render(
    <StaticRouter
      location={outliersUrl("supervisionClientDetail", {
        officerPseudoId: mockOfficerPseudoId,
        metricId: mockMetricId,
        clientId: mockClientId,
        outcomeDate: mockOutcomeDate,
      })}
    >
      <Route path={OUTLIERS_PATHS.supervisionClientDetail}>
        <OutliersRoute>null</OutliersRoute>
      </Route>
    </StaticRouter>
  );

  expect(supervisionStore?.supervisorPseudoId).toBeUndefined();
  expect(supervisionStore?.officerPseudoId).toBe(mockOfficerPseudoId);
  expect(supervisionStore?.metricId).toBe(mockMetricId);
  expect(supervisionStore?.clientId).toBe(mockClientId);
});
