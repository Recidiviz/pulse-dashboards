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

import { configure } from "mobx";

import { RootStore } from "../../../RootStore";
import { OutliersOfflineAPIClient } from "../../api/OutliersOfflineAPIClient";
import { OutliersConfigFixture } from "../../models/offlineFixtures/OutliersConfigFixture";
import { supervisionOfficerSupervisorsFixture } from "../../models/offlineFixtures/SupervisionOfficerSupervisor";
import { OutliersStore } from "../../OutliersStore";
import { OutliersSupervisionStore } from "../../stores/OutliersSupervisionStore";
import { SupervisionOfficerSupervisorsPresenter } from "../SupervisionOfficerSupervisorsPresenter";

let store: OutliersSupervisionStore;
let presenter: SupervisionOfficerSupervisorsPresenter;

beforeEach(() => {
  configure({ safeDescriptors: false });
  store = new OutliersSupervisionStore(
    new OutliersStore(new RootStore()),
    OutliersConfigFixture
  );
  jest.spyOn(store, "userCanAccessAllSupervisors", "get").mockReturnValue(true);

  presenter = new SupervisionOfficerSupervisorsPresenter(store);
});

afterEach(() => {
  jest.restoreAllMocks();
  configure({ safeDescriptors: true });
});

test("hydrate", async () => {
  expect(presenter.hydrationState.status).toBe("needs hydration");

  await presenter.hydrate();

  expect(presenter.hydrationState.status).toBe("hydrated");
});

test("hydrated with no results", async () => {
  jest
    .spyOn(OutliersOfflineAPIClient.prototype, "supervisionOfficerSupervisors")
    .mockResolvedValue([]);

  await presenter.hydrate();

  expect(presenter.hydrationState.status).toBe("hydrated");
});

test("all supervisors data", async () => {
  await presenter.hydrate();
  expect(presenter.allSupervisors).toEqual(
    expect.arrayContaining(supervisionOfficerSupervisorsFixture)
  );
});

test("supervisors with outliers data", async () => {
  await presenter.hydrate();
  expect(presenter.supervisorsWithOutliersByDistrict).toMatchSnapshot();
  presenter.supervisorsWithOutliersByDistrict.forEach(({ supervisors }) => {
    supervisors.forEach((s) => expect(s.hasOutliers).toBeTrue());
  });
});

test("districts ordered correctly", async () => {
  await presenter.hydrate();
  presenter.allSupervisors.push(
    {
      supervisionDistrict: "REGION 7",
      externalId: "testid1",
      displayName: "Test Name",
      fullName: {
        givenNames: "Test",
        surname: "Name",
      },
      hasOutliers: true,
      pseudonymizedId: "hashed-testid1",
    },
    {
      supervisionDistrict: "REGION 4B",
      externalId: "testid2",
      displayName: "Test Name",
      fullName: {
        givenNames: "Test",
        surname: "Name",
      },
      hasOutliers: true,
      pseudonymizedId: "hashed-testid2",
    },
    {
      supervisionDistrict: "REGION 1",
      externalId: "testid3",
      displayName: "Test Name",
      fullName: {
        givenNames: "Test",
        surname: "Name",
      },
      hasOutliers: true,
      pseudonymizedId: "hashed-testid3",
    },
    {
      supervisionDistrict: "REGION 10 - CENTRAL",
      externalId: "testid4",
      displayName: "Test Name",
      fullName: {
        givenNames: "Test",
        surname: "Name",
      },
      hasOutliers: true,
      pseudonymizedId: "hashed-testid4",
    },
    {
      supervisionDistrict: "REGION 4A",
      externalId: "testid5",
      displayName: "Test Name",
      fullName: {
        givenNames: "Test",
        surname: "Name",
      },
      hasOutliers: true,
      pseudonymizedId: "hashed-testid6",
    },
    {
      supervisionDistrict: "REGION 10 - WEST",
      externalId: "testid6",
      displayName: "Test Name",
      fullName: {
        givenNames: "Test",
        surname: "Name",
      },
      hasOutliers: true,
      pseudonymizedId: "hashed-testid6",
    }
  );
  const orderedDistrictList = [
    "REGION 1",
    "REGION 4A",
    "REGION 4B",
    "REGION 7",
    "REGION 10 - CENTRAL",
    "REGION 10 - WEST",
    "Region D1",
    null,
  ];
  expect(
    Array.from(
      presenter.supervisorsWithOutliersByDistrict.map(
        ({ district }) => district
      )
    )
  ).toEqual(orderedDistrictList);
});

test("supervisors with outliers count", async () => {
  await presenter.hydrate();
  expect(presenter.supervisorsWithOutliersCount).toMatchInlineSnapshot(`2`);
});

describe("outliersLeadershipPageAllDistricts feature variant not set", () => {
  const mockOutliersLeadershipPageAllDistricts = undefined;
  const launchedDistricts = ["REGION 6"];

  beforeEach(() => {
    jest
      .spyOn(
        store.outliersStore.rootStore.tenantStore,
        "outliersLaunchedDistricts",
        "get"
      )
      .mockReturnValue(launchedDistricts);

    jest.spyOn(store, "supervisionOfficerSupervisors", "get").mockReturnValue(
      supervisionOfficerSupervisorsFixture.concat({
        supervisionDistrict: launchedDistricts[0],
        externalId: "testid1",
        displayName: "Test Name",
        fullName: {
          givenNames: "Test",
          surname: "Name",
        },
        hasOutliers: true,
        pseudonymizedId: "hashed-testid1",
      })
    );

    presenter = new SupervisionOfficerSupervisorsPresenter(
      store,
      mockOutliersLeadershipPageAllDistricts
    );
  });

  it("only show supervisors from launched districts", async () => {
    await presenter.hydrate();

    expect(presenter.supervisorsWithOutliersCount).toEqual(1);
    expect(
      presenter.supervisorsWithOutliersByDistrict.map(
        ({ district }) => district
      )
    ).toEqual(launchedDistricts);
  });
});
