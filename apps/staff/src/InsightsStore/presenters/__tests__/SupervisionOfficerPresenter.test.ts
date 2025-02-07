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

import { configure, flowResult } from "mobx";

import {
  ClientRecord,
  InsightsConfigFixture,
  supervisionOfficerFixture,
  supervisionOfficerOutcomesFixture,
  supervisionOfficerSupervisorsFixture,
} from "~datatypes";
import { hydrationFailure, unpackAggregatedErrors } from "~hydration-utils";

import { RootStore } from "../../../RootStore";
import UserStore from "../../../RootStore/UserStore";
import { mockIneligibleClient } from "../../../WorkflowsStore/__fixtures__";
import { JusticeInvolvedPersonsStore } from "../../../WorkflowsStore/JusticeInvolvedPersonsStore";
import { mockFirestoreStoreClientsForOfficerId } from "../../../WorkflowsStore/subscriptions/__tests__/testUtils";
import { InsightsOfflineAPIClient } from "../../api/InsightsOfflineAPIClient";
import { InsightsSupervisionStore } from "../../stores/InsightsSupervisionStore";
import { SupervisionOfficerPagePresenter } from "../SupervisionOfficerPagePresenter";
import * as utils from "../utils";
import { getOfficerOutcomesData, isExcludedSupervisionOfficer } from "../utils";

let store: InsightsSupervisionStore;
let rootStore: RootStore;
let jiiStore: JusticeInvolvedPersonsStore;
const stateCode = "US_ID";
const pseudoId = "hashed-mavis123";
const testOfficerWithOutcomes = supervisionOfficerFixture[0];
const testOutcomes = supervisionOfficerOutcomesFixture[0];
const testSupervisor = supervisionOfficerSupervisorsFixture[0];
// Officer where includeInOutcomes is false
const testExcludedOfficer = supervisionOfficerFixture[8];

let presenter: SupervisionOfficerPagePresenter;

beforeEach(() => {
  configure({ safeDescriptors: false });
  vi.spyOn(UserStore.prototype, "userPseudoId", "get").mockImplementation(
    () => pseudoId,
  );
  vi.spyOn(UserStore.prototype, "isRecidivizUser", "get").mockImplementation(
    () => false,
  );
  vi.spyOn(UserStore.prototype, "stateCode", "get").mockImplementation(
    () => "US_ID",
  );

  rootStore = new RootStore();
  rootStore.tenantStore.currentTenantId = stateCode;
  rootStore.workflowsRootStore.opportunityConfigurationStore.mockHydrated();
  store = new InsightsSupervisionStore(
    rootStore.insightsStore,
    InsightsConfigFixture,
  );

  vi.spyOn(store, "userCanAccessAllSupervisors", "get").mockReturnValue(true);
});

const initPresenter = async (
  testOfficer: typeof testExcludedOfficer | typeof testOfficerWithOutcomes,
) => {
  store.setOfficerPseudoId(testOfficer.pseudonymizedId);

  const lsuClient = {
    ...mockIneligibleClient,
    officerId: testOfficer.externalId,
    allEligibleOpportunities: ["LSU"],
  } as ClientRecord;

  const ftrdClient = {
    ...mockIneligibleClient,
    officerId: testOfficer.externalId,
    allEligibleOpportunities: ["pastFTRD"],
  } as ClientRecord;

  store.setOfficerPseudoId(testOfficer.pseudonymizedId);

  const { workflowsRootStore } = rootStore;
  workflowsRootStore.populateJusticeInvolvedPersonsStore();
  if (workflowsRootStore.justiceInvolvedPersonsStore) {
    jiiStore = workflowsRootStore.justiceInvolvedPersonsStore;
    presenter = new SupervisionOfficerPagePresenter(
      store,
      testOfficer.pseudonymizedId,
      jiiStore,
    );
  }

  await mockFirestoreStoreClientsForOfficerId(
    rootStore.firestoreStore,
    [lsuClient, ftrdClient],
    true, // return all clients
    undefined,
  );

  vi.spyOn(presenter, "isWorkflowsEnabled", "get").mockReturnValue(true);
};

afterEach(() => {
  vi.restoreAllMocks();
  configure({ safeDescriptors: true });
});

const officerCases = [
  ["with outlier data", testOfficerWithOutcomes],
  ["WITHOUT outlier data", testExcludedOfficer],
] as const;

describe.each(officerCases)("test officer %s", (label, testOfficer) => {
  beforeEach(() => {
    initPresenter(testOfficer);
  });

  describe("with unit data already hydrated", () => {
    beforeEach(async () => {
      await Promise.all([
        flowResult(
          store.populateOfficersForSupervisor(testSupervisor.pseudonymizedId),
        ),
        flowResult(store.populateSupervisionOfficerSupervisors()),
        flowResult(store.populateMetricConfigs()),
        flowResult(
          jiiStore.populateCaseloadForSupervisionOfficer(
            testOfficer.externalId,
          ),
        ),
        flowResult(
          store.populateOutcomesForSupervisor(testSupervisor.pseudonymizedId),
        ),
      ]);
    });

    test("is immediately hydrated", async () => {
      expect(presenter.hydrationState.status).toBe("hydrated");
    });

    test("makes no additional API calls", async () => {
      vi.spyOn(InsightsOfflineAPIClient.prototype, "metricBenchmarks");
      vi.spyOn(InsightsOfflineAPIClient.prototype, "supervisionOfficer");
      vi.spyOn(
        InsightsOfflineAPIClient.prototype,
        "supervisionOfficerSupervisors",
      );
      vi.spyOn(
        InsightsOfflineAPIClient.prototype,
        "supervisionOfficerMetricEvents",
      );
      vi.spyOn(InsightsOfflineAPIClient.prototype, "outcomesForOfficer");

      // add this expect in so that we can call the same one later in this test to ensure it didn't
      // get another call at that time
      expect(
        store.insightsStore.rootStore.firestoreStore.getClientsForOfficerId,
      ).toHaveBeenCalledTimes(1);
      await presenter.hydrate();

      expect(
        store.insightsStore.apiClient.metricBenchmarks,
      ).not.toHaveBeenCalled();
      expect(
        store.insightsStore.apiClient.supervisionOfficerSupervisors,
      ).not.toHaveBeenCalled();
      expect(
        store.insightsStore.apiClient.supervisionOfficer,
      ).not.toHaveBeenCalled();
      expect(
        store.insightsStore.apiClient.outcomesForOfficer,
      ).not.toHaveBeenCalled();
      expect(
        store.insightsStore.apiClient.supervisionOfficerMetricEvents,
      ).not.toHaveBeenCalled();
      // This 1 time is from the beforeEach, since we set up this spy earlier
      expect(
        store.insightsStore.rootStore.firestoreStore.getClientsForOfficerId,
      ).toHaveBeenCalledTimes(1);
    });

    test("officerOutcomesData is correct for the officer type", async () => {
      if (isExcludedSupervisionOfficer(testOfficer)) {
        expect(presenter.officerOutcomesData).not.toBeDefined();
      } else {
        expect(presenter.officerOutcomesData).toBeDefined();
        expect(presenter.officerOutcomesData).toStrictEqual(
          getOfficerOutcomesData(testOfficer, store, testOutcomes),
        );
      }
    });

    test("has supervisorsInfo", () => {
      expect(presenter.supervisorsInfo).toBeDefined();
      expect(
        presenter.supervisorsInfo
          ?.map((s) => s.externalId)
          .every((id) => testOfficer.supervisorExternalIds.includes(id)),
      ).toBeTrue();
    });
  });

  test("hydration", async () => {
    vi.spyOn(InsightsOfflineAPIClient.prototype, "metricBenchmarks");
    vi.spyOn(InsightsOfflineAPIClient.prototype, "supervisionOfficer");
    vi.spyOn(
      InsightsOfflineAPIClient.prototype,
      "supervisionOfficerSupervisors",
    );
    vi.spyOn(InsightsOfflineAPIClient.prototype, "outcomesForOfficer");

    expect(presenter.hydrationState.status).toBe("needs hydration");

    await presenter.hydrate();

    const officerPseudoId = testOfficer.pseudonymizedId;

    expect(presenter.hydrationState.status).toBe("hydrated");
    expect(store.insightsStore.apiClient.metricBenchmarks).toHaveBeenCalled();
    expect(
      store.insightsStore.apiClient.supervisionOfficer,
    ).toHaveBeenCalledWith(officerPseudoId);
    if (!isExcludedSupervisionOfficer(testOfficer)) {
      expect(
        store.insightsStore.apiClient.outcomesForOfficer,
      ).toHaveBeenCalledWith(officerPseudoId);
    } else {
      expect(store.insightsStore.apiClient.outcomesForOfficer).not.toBeCalled();
    }
    expect(
      store.insightsStore.apiClient.supervisionOfficerSupervisors,
    ).toHaveBeenCalled();
  });

  test("officerOutcomesData is correct for the officer type", async () => {
    await presenter.hydrate();

    if (isExcludedSupervisionOfficer(testOfficer)) {
      expect(presenter.officerOutcomesData).not.toBeDefined();
    } else {
      expect(presenter.officerOutcomesData).toBeDefined();
      expect(presenter.officerOutcomesData).toStrictEqual(
        getOfficerOutcomesData(testOfficer, store, testOutcomes),
      );
    }
  });

  test("has supervisorsInfo", async () => {
    await presenter.hydrate();

    expect(presenter.supervisorsInfo).toBeDefined();
    expect(
      presenter.supervisorsInfo
        ?.map((s) => s.externalId)
        .every((id) => testOfficer.supervisorExternalIds.includes(id)),
    ).toBeTrue();
  });

  test("has timePeriod", async () => {
    await presenter.hydrate();

    const { timePeriod } = presenter;

    expect(timePeriod).toBeDefined();
    expect(timePeriod).toMatch("12/1/20 - 12/1/21");
  });

  test("has clients", async () => {
    await presenter.hydrate();
    expect(presenter.clients).toBeDefined();
    expect(presenter.clients).toHaveLength(2);
  });

  test("has numClientsOnCaseload", async () => {
    await presenter.hydrate();

    const { numClientsOnCaseload } = presenter;

    expect(numClientsOnCaseload).toBeDefined();
    expect(numClientsOnCaseload).toEqual(2);
  });

  test("hydration error in dependency", async () => {
    const err = new Error("fake error");
    vi.spyOn(
      InsightsSupervisionStore.prototype,
      "populateMetricConfigs",
    ).mockImplementation(() => {
      throw err;
    });

    await presenter.hydrate();
    expect(presenter.hydrationState).toEqual({
      status: "failed",
      error: err,
    });
  });

  test("error assembling metrics data", async () => {
    if (!isExcludedSupervisionOfficer(testOfficer)) {
      const expectedAggregateError = new Error("oops");
      const expectedAggregateErrorMessage = "Expected data failed to populate";
      vi.spyOn(utils, "getOfficerOutcomesData").mockImplementation(() => {
        throw expectedAggregateError;
      });

      await presenter.hydrate();
      expect(hydrationFailure(presenter)?.message).toStrictEqual(
        expectedAggregateErrorMessage,
      );
      expect(unpackAggregatedErrors(presenter)).toStrictEqual([
        expectedAggregateError,
      ]);
      expect(presenter.officerOutcomesData).toBeUndefined();
    }
  });
});
