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

import { configure } from "mobx";

import {
  InsightsConfigFixture,
  SupervisionOfficerSupervisor,
  supervisionOfficerSupervisorsFixture,
} from "~datatypes";

import { RootStore } from "../../../RootStore";
import { InsightsOfflineAPIClient } from "../../api/InsightsOfflineAPIClient";
import { InsightsStore } from "../../InsightsStore";
import { InsightsSupervisionStore } from "../../stores/InsightsSupervisionStore";
import { SupervisionOfficerSupervisorsPresenter } from "../SupervisionOfficerSupervisorsPresenter";

let store: InsightsSupervisionStore;
let presenter: SupervisionOfficerSupervisorsPresenter;

beforeEach(() => {
  configure({ safeDescriptors: false });
  store = new InsightsSupervisionStore(
    new InsightsStore(new RootStore()),
    InsightsConfigFixture,
  );
  vi.spyOn(store, "userCanAccessAllSupervisors", "get").mockReturnValue(true);
  vi.spyOn(
    store.insightsStore,
    "shouldUseSupervisorHomepageUI",
    "get",
  ).mockReturnValue(false);

  presenter = new SupervisionOfficerSupervisorsPresenter(store);
});

afterEach(() => {
  vi.restoreAllMocks();
  configure({ safeDescriptors: true });
});

test("hydrate", async () => {
  expect(presenter.hydrationState.status).toBe("needs hydration");

  await presenter.hydrate();

  expect(presenter.hydrationState.status).toBe("hydrated");
});

test("hydrated with no results", async () => {
  vi.spyOn(
    InsightsOfflineAPIClient.prototype,
    "supervisionOfficerSupervisors",
  ).mockResolvedValue([]);

  await presenter.hydrate();

  expect(presenter.hydrationState.status).toBe("hydrated");
});

test("all supervisors data", async () => {
  await presenter.hydrate();
  expect(presenter.allSupervisors).toEqual(
    expect.arrayContaining(supervisionOfficerSupervisorsFixture),
  );
});

test("supervisors by district when homepage variant not set", async () => {
  await presenter.hydrate();
  expect(presenter.supervisorsByDistrict).toMatchSnapshot();
  presenter.supervisorsByDistrict.forEach(({ supervisors }) => {
    supervisors.forEach((s) => expect(s.hasOutliers).toBeTrue());
  });
});

test("supervisors by district when workflows variant not set", async () => {
  await presenter.hydrate();
  vi.spyOn(
    store.insightsStore,
    "shouldUseSupervisorHomepageUI",
    "get",
  ).mockReturnValue(true);
  expect(presenter.supervisorsByDistrict).toMatchSnapshot();
  presenter.supervisorsByDistrict.forEach(({ supervisors }) => {
    supervisors.forEach((s) => expect(s.hasOutliers).toBeTrue());
  });
});

test("supervisors by district when homepage and workflows variant is set", async () => {
  vi.spyOn(
    store.insightsStore,
    "shouldUseSupervisorHomepageUI",
    "get",
  ).mockReturnValue(true);

  vi.spyOn(
    store.insightsStore.rootStore.userStore,
    "activeFeatureVariants",
    "get",
  ).mockReturnValue({ supervisorHomepageWorkflows: {} });

  await presenter.hydrate();

  const testSupervisors = presenter.supervisorsByDistrict.reduce(
    (acc, { district, supervisors }) => acc.concat(supervisors),
    [] as SupervisionOfficerSupervisor[],
  );

  expect(testSupervisors).toContainAllValues(
    supervisionOfficerSupervisorsFixture,
  );
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
      email: "mock-email",
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
      email: "mock-email",
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
      email: "mock-email",
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
      email: "mock-email",
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
      email: "mock-email",
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
      email: null,
    },
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
    Array.from(presenter.supervisorsByDistrict.map(({ district }) => district)),
  ).toEqual(orderedDistrictList);
});

test("supervisors with outliers count", async () => {
  await presenter.hydrate();
  expect(presenter.supervisorsWithOutliersCount).toMatchInlineSnapshot(`3`);
});

describe("insightsLeadershipPageAllDistricts feature variant not set", () => {
  const mockInsightsLeadershipPageAllDistricts = undefined;
  const launchedDistricts = ["REGION 6"];

  beforeEach(() => {
    vi.spyOn(
      store.insightsStore.rootStore.tenantStore,
      "insightsLaunchedDistricts",
      "get",
    ).mockReturnValue(launchedDistricts);

    vi.spyOn(store, "supervisionOfficerSupervisors", "get").mockReturnValue(
      supervisionOfficerSupervisorsFixture.concat(
        {
          supervisionDistrict: launchedDistricts[0],
          externalId: "testid1",
          displayName: "Test Name",
          fullName: {
            givenNames: "Test",
            surname: "Name",
          },
          hasOutliers: true,
          pseudonymizedId: "hashed-testid1",
          email: null,
        },
        // Supervisor in launched district without outliers
        {
          supervisionDistrict: launchedDistricts[0],
          externalId: "testid2",
          displayName: "Test Name2",
          fullName: {
            givenNames: "Test",
            surname: "Name2",
          },
          hasOutliers: false,
          pseudonymizedId: "hashed-testid2",
          email: null,
        },
      ),
    );

    presenter = new SupervisionOfficerSupervisorsPresenter(
      store,
      mockInsightsLeadershipPageAllDistricts,
    );
  });

  it("only show supervisors from launched districts", async () => {
    await presenter.hydrate();

    expect(presenter.supervisorsWithOutliersCount).toEqual(1);
    expect(
      presenter.supervisorsByDistrict.map(({ district }) => district),
    ).toEqual(launchedDistricts);
  });

  it("handles supervisor homepage variant", async () => {
    vi.spyOn(
      store.insightsStore,
      "shouldUseSupervisorHomepageUI",
      "get",
    ).mockReturnValue(true);
    vi.spyOn(
      store.insightsStore.rootStore.userStore,
      "activeFeatureVariants",
      "get",
    ).mockReturnValue({ supervisorHomepageWorkflows: {} });

    await presenter.hydrate();

    expect(presenter.supervisorsWithOutliersCount).toEqual(1);
    expect(
      presenter.supervisorsByDistrict.find(
        ({ district }) => district === launchedDistricts[0],
      )?.supervisors.length,
    ).toEqual(2);
    expect(
      presenter.supervisorsByDistrict.map(({ district }) => district),
    ).toEqual(launchedDistricts);
  });
});
