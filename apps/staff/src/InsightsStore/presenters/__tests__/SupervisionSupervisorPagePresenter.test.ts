// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { subDays } from "date-fns";
import { configure } from "mobx";

import {
  InsightsConfigFixture,
  SupervisionOfficer,
  supervisionOfficerSupervisorsFixture,
} from "~datatypes";
import { unpackAggregatedErrors } from "~hydration-utils";

import { RootStore } from "../../../RootStore";
import UserStore from "../../../RootStore/UserStore";
import { InsightsOfflineAPIClient } from "../../api/InsightsOfflineAPIClient";
import { InsightsStore } from "../../InsightsStore";
import { InsightsSupervisionStore } from "../../stores/InsightsSupervisionStore";
import { SupervisionSupervisorPagePresenter } from "../SupervisionSupervisorPagePresenter";

const testSupervisor = supervisionOfficerSupervisorsFixture[0];

let store: InsightsSupervisionStore;
let presenter: SupervisionSupervisorPagePresenter;
let rootStore: RootStore;

beforeEach(async () => {
  configure({ safeDescriptors: false });

  // USER STORE =========================================================
  vi.spyOn(UserStore.prototype, "userPseudoId", "get").mockImplementation(
    () => testSupervisor.pseudonymizedId,
  );

  vi.spyOn(UserStore.prototype, "isRecidivizUser", "get").mockImplementation(
    () => false,
  );

  vi.spyOn(UserStore.prototype, "stateCode", "get").mockImplementation(
    () => "US_ID",
  );

  // SUPERVISION STORE =================================================
  store = new InsightsSupervisionStore(
    new InsightsStore(new RootStore()),
    InsightsConfigFixture,
  );

  vi.spyOn(store, "userCanAccessAllSupervisors", "get").mockReturnValue(true);
  rootStore = store.insightsStore.rootStore;

  rootStore.workflowsRootStore.opportunityConfigurationStore.mockHydrated();

  presenter = new SupervisionSupervisorPagePresenter(
    store,
    testSupervisor.pseudonymizedId,
  );
});

afterEach(() => {
  vi.restoreAllMocks();
  configure({ safeDescriptors: true });
});

test("supervisorInfo", async () => {
  await presenter.hydrate();

  const { supervisorInfo } = presenter;
  expect(supervisorInfo).toMatchSnapshot();
});

test("supervisorLocationInfo", async () => {
  await presenter.hydrate();

  const { supervisionLocationInfo } = presenter;
  expect(supervisionLocationInfo).toMatchSnapshot();
});

test("returns the officers without outcomes data", async () => {
  await presenter.hydrate();

  expect(presenter.officersExcludedFromOutcomes).toMatchSnapshot();
});

test("returns the officers with outcomes data", async () => {
  await presenter.hydrate();

  expect(presenter.officersIncludedInOutcomes).toMatchSnapshot();
});

test("supervisorId not found in supervisionOfficerSupervisors", async () => {
  presenter = new SupervisionSupervisorPagePresenter(store, "nonExistentId");
  await presenter.hydrate();
  expect(presenter.hydrationState).toMatchInlineSnapshot(`
    {
      "error": [AggregateError: Expected data failed to populate],
      "status": "failed",
    }
  `);
  expect(unpackAggregatedErrors(presenter)).toMatchInlineSnapshot(`
    [
      [Error: failed to populate supervisor],
    ]
  `);
});

test("supervisorId not found in officersBySupervisor", async () => {
  vi.spyOn(store, "officersBySupervisorPseudoId", "get").mockImplementation(
    () => new Map(),
  );

  await presenter.hydrate();

  expect(
    store.officersBySupervisorPseudoId.has(testSupervisor.pseudonymizedId),
  ).toBeFalse();
  expect(presenter.hydrationState).toMatchInlineSnapshot(`
    {
      "error": [AggregateError: Expected data failed to populate],
      "status": "failed",
    }
  `);

  expect(unpackAggregatedErrors(presenter)).toMatchInlineSnapshot(`
    [
      [Error: failed to populate officers with outliers],
    ]
  `);
});

test("supervisor has no officer outcomes", async () => {
  vi.spyOn(
    InsightsOfflineAPIClient.prototype,
    "outcomesForSupervisor",
  ).mockResolvedValue([]);

  await presenter.hydrate();

  expect(presenter.hydrationState).toMatchInlineSnapshot(`
    {
      "status": "hydrated",
    }
  `);
});

describe("last login module / numOfficersWithNoLoginActivityInLastXDays", () => {
  const today = new Date(2025, 2, 25);
  beforeEach(() => {
    vi.setSystemTime(today);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("counts people who never logged in", () => {
    vi.spyOn(presenter, "allOfficers", "get").mockReturnValue([
      { latestLoginDate: null },
      { latestLoginDate: null },
      { latestLoginDate: null },
    ] as SupervisionOfficer[]);
    vi.spyOn(presenter, "insightsNumDaysWithoutLogin", "get").mockReturnValue(
      14,
    );
    expect(presenter.numOfficersWithNoLoginActivityInLastXDays).toBe(3);
  });

  it("counts logins depending on whether or not they fall within the threshold", () => {
    vi.spyOn(presenter, "allOfficers", "get").mockReturnValue([
      { latestLoginDate: today },
      { latestLoginDate: subDays(today, 1) },
      { latestLoginDate: subDays(today, 20) },
      { latestLoginDate: subDays(today, 3) },
      { latestLoginDate: subDays(today, 29) },
      { latestLoginDate: subDays(today, 15) },
      { latestLoginDate: subDays(today, 15) },
      { latestLoginDate: subDays(today, 13) },
      { latestLoginDate: subDays(today, 6) },
      { latestLoginDate: subDays(today, 8) },
      { latestLoginDate: subDays(today, 22) },
      { latestLoginDate: subDays(today, 1) },
    ] as SupervisionOfficer[]);

    vi.spyOn(presenter, "insightsNumDaysWithoutLogin", "get").mockReturnValue(
      30,
    );
    expect(presenter.numOfficersWithNoLoginActivityInLastXDays).toBe(0);

    vi.spyOn(presenter, "insightsNumDaysWithoutLogin", "get").mockReturnValue(
      21,
    );
    expect(presenter.numOfficersWithNoLoginActivityInLastXDays).toBe(2);

    vi.spyOn(presenter, "insightsNumDaysWithoutLogin", "get").mockReturnValue(
      14,
    );
    expect(presenter.numOfficersWithNoLoginActivityInLastXDays).toBe(5);

    vi.spyOn(presenter, "insightsNumDaysWithoutLogin", "get").mockReturnValue(
      7,
    );
    expect(presenter.numOfficersWithNoLoginActivityInLastXDays).toBe(7);
  });

  it("counts someone who logged in exactly at the threshold as having logged in", () => {
    vi.spyOn(presenter, "allOfficers", "get").mockReturnValue([
      { latestLoginDate: subDays(today, 14) },
    ] as SupervisionOfficer[]);

    vi.spyOn(presenter, "insightsNumDaysWithoutLogin", "get").mockReturnValue(
      14,
    );
    expect(presenter.numOfficersWithNoLoginActivityInLastXDays).toBe(0);
  });
});
