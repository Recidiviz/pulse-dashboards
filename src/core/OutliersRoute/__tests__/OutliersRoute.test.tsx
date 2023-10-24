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
import { configure } from "mobx";
import { StaticRouter } from "react-router-dom";

import { useRootStore } from "../../../components/StoreProvider";
import { ADVERSE_METRIC_IDS } from "../../../OutliersStore/models/offlineFixtures/constants";
import { OutliersConfigFixture } from "../../../OutliersStore/models/offlineFixtures/OutliersConfigFixture";
import { OutliersStore } from "../../../OutliersStore/OutliersStore";
import { OutliersSupervisionStore } from "../../../OutliersStore/stores/OutliersSupervisionStore";
import { RootStore } from "../../../RootStore";
import { OUTLIERS_PATHS, outliersUrl } from "../../views";
import { OutliersRoute } from "../OutliersRoute";

jest.mock("../../../components/StoreProvider");

const useRootStoreMock = useRootStore as jest.Mock;

let supervisionStore: OutliersSupervisionStore;

beforeEach(() => {
  configure({ safeDescriptors: false });
  const outliersStore = new OutliersStore(new RootStore());

  supervisionStore = new OutliersSupervisionStore(
    outliersStore,
    OutliersConfigFixture
  );
  outliersStore.supervisionStore = supervisionStore;

  useRootStoreMock.mockReturnValue({ outliersStore });
});

afterEach(() => {
  jest.restoreAllMocks();
  configure({ safeDescriptors: true });
});

test("handles params for supervision home page", () => {
  render(
    <StaticRouter location={outliersUrl("supervision", {})}>
      <OutliersRoute path={OUTLIERS_PATHS.supervision}>null</OutliersRoute>
    </StaticRouter>
  );

  /* eslint-disable @typescript-eslint/no-non-null-assertion */
  // making non-null assertions here because we don't want false positives if supervisionStore is undefined
  expect(supervisionStore!.supervisorId).toBeUndefined();
  expect(supervisionStore!.officerId).toBeUndefined();
  expect(supervisionStore!.metricId).toBeUndefined();
  /* eslint-enable @typescript-eslint/no-non-null-assertion */
});

test("handles params for supervision supervisor page", () => {
  const mockSupervisorId = "123abc";

  render(
    <StaticRouter
      location={outliersUrl("supervisionSupervisor", {
        supervisorId: mockSupervisorId,
      })}
    >
      <OutliersRoute path={OUTLIERS_PATHS.supervisionSupervisor}>
        null
      </OutliersRoute>
    </StaticRouter>
  );

  expect(supervisionStore?.supervisorId).toBe(mockSupervisorId);
});

test("supervisor restricted from another supervisor's page", () => {
  jest.spyOn(supervisionStore, "currentSupervisorUser", "get").mockReturnValue({
    displayName: "",
    fullName: {},
    externalId: "abc123",
    supervisionDistrict: null,
  });

  render(
    <StaticRouter
      location={outliersUrl("supervisionSupervisor", {
        supervisorId: "456xyz",
      })}
    >
      <OutliersRoute path={OUTLIERS_PATHS.supervisionSupervisor}>
        null
      </OutliersRoute>
    </StaticRouter>
  );

  expect(
    screen.getByText("Page Not Found", { exact: false })
  ).toBeInTheDocument();
});

test("handles params for supervision officer page", () => {
  const mockOfficerId = "123abc";

  render(
    <StaticRouter
      location={outliersUrl("supervisionStaff", {
        officerId: mockOfficerId,
      })}
    >
      <OutliersRoute path={OUTLIERS_PATHS.supervisionStaff}>null</OutliersRoute>
    </StaticRouter>
  );

  expect(supervisionStore?.supervisorId).toBeUndefined();
  expect(supervisionStore?.officerId).toBe(mockOfficerId);
});

test("handles params for supervision officer metric page", () => {
  const mockOfficerId = "123abc";
  const mockMetricId = ADVERSE_METRIC_IDS.enum.incarceration_starts;

  render(
    <StaticRouter
      location={outliersUrl("supervisionStaffMetric", {
        officerId: mockOfficerId,
        metricId: mockMetricId,
      })}
    >
      <OutliersRoute path={OUTLIERS_PATHS.supervisionStaffMetric}>
        null
      </OutliersRoute>
    </StaticRouter>
  );

  expect(supervisionStore?.supervisorId).toBeUndefined();
  expect(supervisionStore?.officerId).toBe(mockOfficerId);
  expect(supervisionStore?.metricId).toBe(mockMetricId);
});

test("handles params for supervision supervisors list page", async () => {
  render(
    <StaticRouter location={outliersUrl("supervisionSupervisorsList", {})}>
      <OutliersRoute path={OUTLIERS_PATHS.supervisionSupervisorsList}>
        null
      </OutliersRoute>
    </StaticRouter>
  );

  /* eslint-disable @typescript-eslint/no-non-null-assertion */
  // making non-null assertions here because we don't want false positives if supervisionStore is undefined
  expect(supervisionStore!.supervisorId).toBeUndefined();
  expect(supervisionStore!.officerId).toBeUndefined();
  expect(supervisionStore!.metricId).toBeUndefined();
  /* eslint-enable @typescript-eslint/no-non-null-assertion */
});

test("supervisors restricted from supervisors list page", () => {
  jest.spyOn(supervisionStore, "currentSupervisorUser", "get").mockReturnValue({
    displayName: "",
    fullName: {},
    externalId: "abc123",
    supervisionDistrict: null,
  });

  render(
    <StaticRouter location={outliersUrl("supervisionSupervisorsList", {})}>
      <OutliersRoute path={OUTLIERS_PATHS.supervisionSupervisorsList}>
        null
      </OutliersRoute>
    </StaticRouter>
  );

  expect(
    screen.getByText("Page Not Found", { exact: false })
  ).toBeInTheDocument();
});
