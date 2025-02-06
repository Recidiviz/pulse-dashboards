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

import { configure, flowResult } from "mobx";

import {
  InsightsConfigFixture,
  supervisionOfficerFixture,
  supervisionOfficerOutcomesFixture,
  supervisionOfficerSupervisorsFixture,
} from "~datatypes";
import { hydrationFailure, unpackAggregatedErrors } from "~hydration-utils";

import { RootStore } from "../../../RootStore";
import UserStore from "../../../RootStore/UserStore";
import { InsightsOfflineAPIClient } from "../../api/InsightsOfflineAPIClient";
import { InsightsSupervisionStore } from "../../stores/InsightsSupervisionStore";
import { SupervisionOfficerOutcomesPresenter } from "../SupervisionOfficerOutcomesPresenter";
import * as utils from "../utils";
import { getOfficerOutcomesData, isExcludedSupervisionOfficer } from "../utils";

let store: InsightsSupervisionStore;
let rootStore: RootStore;

const stateCode = "US_ID";
const pseudoId = "hashed-mavis123";
const testOfficerWithOutcomes = supervisionOfficerFixture[0];
const testOutcomes = supervisionOfficerOutcomesFixture[0];
const testSupervisor = supervisionOfficerSupervisorsFixture[0];
// Officer where includeInOutcomes is false
const testExcludedOfficer = supervisionOfficerFixture[8];

let presenter: SupervisionOfficerOutcomesPresenter;

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

  presenter = new SupervisionOfficerOutcomesPresenter(
    store,
    testOfficer.pseudonymizedId,
  );
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
