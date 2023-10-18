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

import { RootStore } from "../../../RootStore";
import { OutliersOfflineAPIClient } from "../../api/OutliersOfflineAPIClient";
import { OutliersConfigFixture } from "../../models/offlineFixtures/OutliersConfigFixture";
import { OutliersStore } from "../../OutliersStore";
import { OutliersSupervisionStore } from "../../stores/OutliersSupervisionStore";
import { getOutlierOfficerData } from "../getOutlierOfficerData";

let store: OutliersSupervisionStore;

jest.mock("../getOutlierOfficerData", () => {
  const original = jest.requireActual(
    "../getOutlierOfficerData"
  ).getOutlierOfficerData;
  return {
    getOutlierOfficerData: jest.fn().mockImplementation(original),
  };
});

const getOutlierOfficerDataMock = getOutlierOfficerData as jest.MockedFunction<
  typeof getOutlierOfficerData
>;

beforeEach(() => {
  jest.resetModules();
  store = new OutliersSupervisionStore(
    new OutliersStore(new RootStore()),
    OutliersConfigFixture
  );
});

afterEach(() => {
  jest.restoreAllMocks();
});

test("outlierOfficersData", async () => {
  store.setSupervisorId("mdavis123");
  const presenter = store.supervisionOfficersPresenter;
  expect(presenter).toBeDefined();
  await presenter?.hydrate();

  const outlierOfficersData = presenter?.outlierOfficersData;
  expect(outlierOfficersData).toMatchSnapshot();
});

test("supervisorInfo", async () => {
  store.setSupervisorId("mdavis123");
  const presenter = store.supervisionOfficersPresenter;
  expect(presenter).toBeDefined();
  await presenter?.hydrate();

  const outlierOfficersData = presenter?.supervisorInfo;
  expect(outlierOfficersData).toMatchSnapshot();
});

test("hydration error in dependency", async () => {
  const err = new Error("fake error");
  jest
    .spyOn(OutliersSupervisionStore.prototype, "hydrateMetricConfigs")
    .mockImplementation(() => {
      throw err;
    });

  store.setSupervisorId("mdavis123");
  const presenter = store.supervisionOfficersPresenter;
  expect(presenter).toBeDefined();
  await presenter?.hydrate();
  expect(presenter?.error).toEqual(err);
});

test("supervisorId not found in supervisionOfficerSupervisors", async () => {
  store.setSupervisorId("nonExistentId");
  const presenter = store.supervisionOfficersPresenter;
  await presenter?.hydrate();
  expect(presenter?.isHydrated).toBeFalse();
  expect(presenter?.error).toEqual(
    new Error("Data for supervisor nonExistentId is not available.")
  );
});

test("supervisorId not found in officersBySupervisor", async () => {
  const supervisorId = "mdavis123";

  jest
    .spyOn(OutliersOfflineAPIClient.prototype, "officersForSupervisor")
    .mockResolvedValue([]);

  store.setSupervisorId(supervisorId);
  const presenter = store.supervisionOfficersPresenter;
  await presenter?.hydrate();

  expect(presenter?.isHydrated).toBeFalse();
  expect(presenter?.error).toEqual(
    new Error("Supervisor mdavis123 does not have any assigned officers")
  );
});

test("error assembling metrics data", async () => {
  const err = new Error("oops");
  getOutlierOfficerDataMock.mockImplementation(() => {
    throw err;
  });

  store.setSupervisorId("mdavis123");
  const presenter = store.supervisionOfficersPresenter;
  expect(presenter).toBeDefined();
  await presenter?.hydrate();

  expect(presenter?.error).toBeUndefined();

  expect(presenter?.outlierOfficersData).toBeUndefined();
  expect(presenter?.error).toEqual(err);
});
