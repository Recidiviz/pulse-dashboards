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
import { MemoryRouter, Route, Routes } from "react-router-dom";

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

const renderWithRouter = (initialEntry: string, path: string) => {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path={path} element={<OutliersRoute>null</OutliersRoute>} />
      </Routes>
    </MemoryRouter>
  );
};

test("handles params for supervision home page", () => {
  renderWithRouter(outliersUrl("supervision"), OUTLIERS_PATHS.supervision);

  /* eslint-disable @typescript-eslint/no-non-null-assertion */
  // making non-null assertions here because we don't want false positives if supervisionStore is undefined
  expect(supervisionStore!.supervisorPseudoId).toBeUndefined();
  expect(supervisionStore!.officerPseudoId).toBeUndefined();
  expect(supervisionStore!.metricId).toBeUndefined();
  /* eslint-enable @typescript-eslint/no-non-null-assertion */
});

test("handles params for supervision supervisor page", () => {
  const mockSupervisorPseudoId = "123abc";

  renderWithRouter(
    outliersUrl("supervisionSupervisor", {
      supervisorPseudoId: mockSupervisorPseudoId,
    }),
    OUTLIERS_PATHS.supervisionSupervisor
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

  renderWithRouter(
    outliersUrl("supervisionSupervisor", {
      supervisorPseudoId: "456xyz",
    }),
    OUTLIERS_PATHS.supervisionSupervisor
  );

  expect(
    screen.getByText("Page Not Found", { exact: false })
  ).toBeInTheDocument();
});

test("handles params for supervision officer page", () => {
  const mockOfficerPseudoId = "123abc";
  renderWithRouter(
    outliersUrl("supervisionStaff", {
      officerPseudoId: mockOfficerPseudoId,
    }),
    OUTLIERS_PATHS.supervisionStaff
  );

  expect(supervisionStore?.supervisorPseudoId).toBeUndefined();
  expect(supervisionStore?.officerPseudoId).toBe(mockOfficerPseudoId);
});

test("handles params for supervision officer metric page", () => {
  const mockOfficerPseudoId = "123abc";
  const mockMetricId = ADVERSE_METRIC_IDS.enum.incarceration_starts;

  renderWithRouter(
    outliersUrl("supervisionStaffMetric", {
      officerPseudoId: mockOfficerPseudoId,
      metricId: mockMetricId,
    }),
    OUTLIERS_PATHS.supervisionStaffMetric
  );

  expect(supervisionStore?.supervisorPseudoId).toBeUndefined();
  expect(supervisionStore?.officerPseudoId).toBe(mockOfficerPseudoId);
  expect(supervisionStore?.metricId).toBe(mockMetricId);
});

test("handles params for supervision supervisors list page", async () => {
  renderWithRouter(
    outliersUrl("supervisionSupervisorsList"),
    OUTLIERS_PATHS.supervisionSupervisorsList
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

  renderWithRouter(
    outliersUrl("supervisionSupervisorsList"),
    OUTLIERS_PATHS.supervisionSupervisorsList
  );

  expect(
    screen.getByText("Page Not Found", { exact: false })
  ).toBeInTheDocument();
});

test("handles params for client detail page", () => {
  const mockOfficerPseudoId = "123abc";
  const mockMetricId = ADVERSE_METRIC_IDS.enum.incarceration_starts;
  const mockClientPseudoId = "hashed-client123";
  const mockOutcomeDate = "2023-05-14";

  renderWithRouter(
    outliersUrl("supervisionClientDetail", {
      officerPseudoId: mockOfficerPseudoId,
      metricId: mockMetricId,
      clientPseudoId: mockClientPseudoId,
      outcomeDate: mockOutcomeDate,
    }),
    OUTLIERS_PATHS.supervisionClientDetail
  );

  expect(supervisionStore?.supervisorPseudoId).toBeUndefined();
  expect(supervisionStore?.officerPseudoId).toBe(mockOfficerPseudoId);
  expect(supervisionStore?.metricId).toBe(mockMetricId);
  expect(supervisionStore?.clientPseudoId).toBe(mockClientPseudoId);
});
