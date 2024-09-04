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

import { parseISO } from "date-fns";
import { cloneDeep } from "lodash";
import { configure, flowResult, observable } from "mobx";
import { ValuesType } from "utility-types";

import {
  CASELOAD_CATEGORY_IDS,
  InsightsConfig,
  InsightsConfigFixture,
  LATEST_END_DATE,
  metricBenchmarksFixture,
} from "~datatypes";

import { RootStore } from "../../../RootStore";
import { formatDateToISO } from "../../../utils";
import { InsightsOfflineAPIClient } from "../../api/InsightsOfflineAPIClient";
import { InsightsStore } from "../../InsightsStore";
import { excludedSupervisionOfficerFixture } from "../../models/offlineFixtures/ExcludedSupervisionOfficerFixture";
import { supervisionOfficerFixture } from "../../models/offlineFixtures/SupervisionOfficerFixture";
import { supervisionOfficerMetricEventFixture } from "../../models/offlineFixtures/SupervisionOfficerMetricEventFixture";
import { supervisionOfficerSupervisorsFixture } from "../../models/offlineFixtures/SupervisionOfficerSupervisor";
import { SupervisionPresenter } from "../../presenters/SupervisionPresenter";
import { InsightsSupervisionStore } from "../InsightsSupervisionStore";

let store: InsightsSupervisionStore;

beforeEach(async () => {
  configure({ safeDescriptors: false });
  const rootStore = new RootStore();
  const insightsStore = new InsightsStore(rootStore);
  const presenter = new SupervisionPresenter(
    insightsStore,
    rootStore.workflowsRootStore,
  );
  await presenter.hydrate();
  if (insightsStore.supervisionStore) {
    store = insightsStore.supervisionStore;
  }
});

afterEach(() => {
  vi.restoreAllMocks();
  configure({ safeDescriptors: true });
});

test("hydrate benchmarks", async () => {
  await expect(flowResult(store.populateMetricConfigs())).toResolve();
});

test("cannot hydrate benchmarks with API error", async () => {
  vi.spyOn(
    InsightsOfflineAPIClient.prototype,
    "metricBenchmarks",
  ).mockRejectedValue(new Error("something went wrong"));

  await expect(flowResult(store.populateMetricConfigs())).toReject();

  expect(store.metricConfigsById).toBeUndefined();
});

// The verification for missing metrics happens in the presenter where we
// have a more accurate idea of which metrics are necessary per supervisor/caseload type
test("can hydrate benchmarks with missing metrics", async () => {
  vi.spyOn(InsightsOfflineAPIClient.prototype, "metricBenchmarks")
    // this should include only 2 of the 3 expected metric types
    .mockResolvedValue(metricBenchmarksFixture.slice(0, 2));

  await expect(flowResult(store.populateMetricConfigs())).toResolve();

  const techsConfig = store.metricConfigsById?.get(
    "incarceration_starts_technical_violation",
  );
  expect(techsConfig).toBeDefined();
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  expect(techsConfig!.metricBenchmarksByCaseloadCategory).toBeUndefined();
});

test("configs include benchmarks", async () => {
  await flowResult(store.populateMetricConfigs());

  store.metricConfigsById?.forEach((mc) => {
    // benchmarks data should be hydrated
    expect(mc.metricBenchmarksByCaseloadCategory).toBeDefined();
    // both caseload types should be present for all
    expect(
      Array.from(mc.metricBenchmarksByCaseloadCategory?.keys() ?? []),
    ).toEqual(expect.arrayContaining(CASELOAD_CATEGORY_IDS.options));
  });

  expect.assertions(InsightsConfigFixture.metrics.length * 2);
});

test("hydrated benchmarks can be missing caseload types", async () => {
  vi.spyOn(InsightsOfflineAPIClient.prototype, "metricBenchmarks")
    // this should be missing the SEX_OFFENSE caseload type for all metrics
    .mockResolvedValue(metricBenchmarksFixture.slice(0, 4));

  await expect(flowResult(store.populateMetricConfigs())).toResolve();

  expect(store.metricConfigsById).toBeDefined();

  store.metricConfigsById?.forEach((mc) => {
    expect(
      mc.metricBenchmarksByCaseloadCategory?.get(
        CASELOAD_CATEGORY_IDS.enum.GENERAL_OR_OTHER,
      ),
    ).toBeDefined();
    expect(
      mc.metricBenchmarksByCaseloadCategory?.get(
        CASELOAD_CATEGORY_IDS.enum.SEX_OFFENSE,
      ),
    ).toBeUndefined();
  });
});

test("caseload typebreakdowns enabled", async () => {
  expect(store.areCaseloadCategoryBreakdownsEnabled).toBeFalse();

  await flowResult(store.populateMetricConfigs());
  expect(store.areCaseloadCategoryBreakdownsEnabled).toBeTrue();
});

test("caseload typebreakdowns not enabled", async () => {
  expect(store.areCaseloadCategoryBreakdownsEnabled).toBeFalse();

  vi.spyOn(InsightsOfflineAPIClient.prototype, "metricBenchmarks")
    // this should be missing the SEX_OFFENSE caseload type for all metrics
    .mockResolvedValue(metricBenchmarksFixture.slice(0, 3));

  await flowResult(store.populateMetricConfigs());

  expect(store.areCaseloadCategoryBreakdownsEnabled).toBeFalse();
});

test("adverse metric configs", async () => {
  const additionalConfigsFixture = cloneDeep(InsightsConfigFixture);
  const favorableMetricConfig: ValuesType<InsightsConfig["metrics"]> = {
    name: "transfers_to_liberty",
    bodyDisplayName: "successful discharge rate",
    titleDisplayName: "Successful discharge rate",
    eventName: "successful discharges",
    eventNameSingular: "successful discharge",
    eventNamePastTense: "successfully discharged",
    outcomeType: "FAVORABLE",
    descriptionMarkdown: "rate description",
    topXPct: null,
  };
  additionalConfigsFixture.metrics.push(favorableMetricConfig);

  store = new InsightsSupervisionStore(
    new InsightsStore(new RootStore()),
    additionalConfigsFixture,
  );

  expect(store.adverseMetricConfigsById).toBeUndefined();

  // also need to hydrate benchmark data.
  // This is not realistic for this metric but it doesn't really matter for this test
  const additionalMetricBenchmark = cloneDeep(metricBenchmarksFixture[0]);
  additionalMetricBenchmark.metricId = favorableMetricConfig.name;
  vi.spyOn(
    InsightsOfflineAPIClient.prototype,
    "metricBenchmarks",
  ).mockResolvedValue([...metricBenchmarksFixture, additionalMetricBenchmark]);

  await flowResult(store.populateMetricConfigs());

  // base config mapping should have all metrics
  additionalConfigsFixture.metrics.forEach((m) => {
    expect(store.metricConfigsById?.get(m.name)).toBeDefined();
  });
  InsightsConfigFixture.metrics.forEach((m) => {
    expect(store.metricConfigsById?.get(m.name)).toBeDefined();
  });
  // adverse config mapping should not include the additional one we injected
  expect(
    store.adverseMetricConfigsById?.get(favorableMetricConfig.name),
  ).toBeUndefined();
});

test("hydrate supervisionOfficerSupervisors", async () => {
  vi.spyOn(store, "userCanAccessAllSupervisors", "get").mockReturnValue(true);
  expect(store.supervisionOfficerSupervisors).toBeFalsy();

  await expect(
    flowResult(store.populateSupervisionOfficerSupervisors()),
  ).resolves.not.toThrow();
  expect(store.supervisionOfficerSupervisors?.length).toBe(
    supervisionOfficerSupervisorsFixture.length,
  );
});

test("hydrate supervisionOfficers for supervisor", async () => {
  const testSupervisorPseudoId =
    supervisionOfficerSupervisorsFixture[0].pseudonymizedId;
  expect(
    store.officersBySupervisorPseudoId.has(testSupervisorPseudoId),
  ).toBeFalse();

  await expect(
    flowResult(store.populateOfficersForSupervisor(testSupervisorPseudoId)),
  ).resolves.not.toThrow();

  expect(
    store.officersBySupervisorPseudoId.get(testSupervisorPseudoId),
  ).toEqual(expect.arrayContaining(supervisionOfficerFixture.slice(0, 2)));
});

test("hydrate excludedSupervisionOfficers for supervisor", async () => {
  const testSupervisorPseudoId =
    supervisionOfficerSupervisorsFixture[0].pseudonymizedId;
  expect(
    store.excludedOfficersBySupervisorPseudoId.has(testSupervisorPseudoId),
  ).toBeFalse();

  await expect(
    flowResult(
      store.populateExcludedOfficersForSupervisor(testSupervisorPseudoId),
    ),
  ).resolves.not.toThrow();

  expect(
    store.excludedOfficersBySupervisorPseudoId.get(testSupervisorPseudoId),
  ).toEqual(
    expect.arrayContaining(excludedSupervisionOfficerFixture.slice(0, 2)),
  );
});

test("userCanAccessAllSupervisors with missing route", () => {
  vi.spyOn(
    store.insightsStore.rootStore.userStore,
    "userAppMetadata",
    "get",
  ).mockReturnValue({
    pseudonymizedId: "hashed-abc123",
    routes: observable({ insights: true }),
    stateCode: "us_mi",
  });

  expect(store.userCanAccessAllSupervisors).toBeFalse();
});

test("userCanAccessAllSupervisors with false route", () => {
  vi.spyOn(
    store.insightsStore.rootStore.userStore,
    "userAppMetadata",
    "get",
  ).mockReturnValue({
    pseudonymizedId: "hashed-abc123",
    routes: observable({ "insights_supervision_supervisors-list": false }),
    stateCode: "us_mi",
  });

  expect(store.userCanAccessAllSupervisors).toBeFalse();
});

test("userCanAccessAllSupervisors with true route", () => {
  vi.spyOn(
    store.insightsStore.rootStore.userStore,
    "userAppMetadata",
    "get",
  ).mockReturnValue({
    pseudonymizedId: "hashed-abc123",
    routes: observable({ "insights_supervision_supervisors-list": true }),
    stateCode: "us_mi",
  });

  expect(store.userCanAccessAllSupervisors).toBeTrue();
});

test("current user record for supervisor", async () => {
  vi.spyOn(
    store.insightsStore.rootStore.userStore,
    "userAppMetadata",
    "get",
  ).mockReturnValue({
    externalId: "abc123",
    pseudonymizedId: "hashed-agonzalez123",
    district: "District One",
    stateCode: "us_mi",
  });
  await flowResult(store.populateUserInfo());

  expect(store.currentSupervisorUser).toBeDefined();
  expect(store.currentSupervisorUser).toMatchInlineSnapshot(`
    {
      "displayName": "Alejandro D Gonzalez",
      "email": "mock-email",
      "externalId": "agonzalez123",
      "fullName": {
        "givenNames": "Alejandro",
        "middleNames": "D",
        "surname": "Gonzalez",
      },
      "hasOutliers": true,
      "pseudonymizedId": "hashed-agonzalez123",
      "supervisionDistrict": "Region D1",
    }
  `);
});

test("hydrateUserInfo requires pseudo ID", async () => {
  vi.spyOn(
    store.insightsStore.rootStore.userStore,
    "userAppMetadata",
    "get",
  ).mockReturnValue({
    district: "District One",
    stateCode: "us_mi",
  });

  await expect(() => store.populateUserInfo()).rejects.toThrow(
    "Missing pseudonymizedId for user",
  );
});

test("hydrate supervisors list with current user", async () => {
  vi.spyOn(
    store.insightsStore.rootStore.userStore,
    "userAppMetadata",
    "get",
  ).mockReturnValue({
    externalId: "abc123",
    pseudonymizedId: "hashed-agonzalez123",
    district: "District One",
    stateCode: "us_mi",
    routes: observable({
      insights: true,
      "insights_supervision_supervisors-list": false,
    }),
  });
  await flowResult(store.populateUserInfo());

  expect(store.supervisionOfficerSupervisors).toBeDefined();
  expect(store.supervisionOfficerSupervisors).toMatchInlineSnapshot(`
    [
      {
        "displayName": "Alejandro D Gonzalez",
        "email": "mock-email",
        "externalId": "agonzalez123",
        "fullName": {
          "givenNames": "Alejandro",
          "middleNames": "D",
          "surname": "Gonzalez",
        },
        "hasOutliers": true,
        "pseudonymizedId": "hashed-agonzalez123",
        "supervisionDistrict": "Region D1",
      },
    ]
  `);
});

test("current supervisor user without supervisors list permission does not hydrate via supervisors API", async () => {
  vi.spyOn(
    store.insightsStore.rootStore.userStore,
    "userAppMetadata",
    "get",
  ).mockReturnValue({
    externalId: "abc123",
    pseudonymizedId: "hashed-agonzalez123",
    district: "District One",
    stateCode: "us_mi",
    routes: observable({
      insights: true,
      "insights_supervision_supervisors-list": false,
    }),
  });

  vi.spyOn(store.insightsStore.apiClient, "supervisionOfficerSupervisors");
  await flowResult(store.populateUserInfo());

  await expect(
    flowResult(store.populateSupervisionOfficerSupervisors()),
  ).toResolve();
  expect(
    store.insightsStore.apiClient.supervisionOfficerSupervisors,
  ).not.toHaveBeenCalled();
});

test("current supervisor user with supervisors list permission does hydrate via supervisors API", async () => {
  vi.spyOn(
    store.insightsStore.rootStore.userStore,
    "userAppMetadata",
    "get",
  ).mockReturnValue({
    externalId: "abc123",
    pseudonymizedId: "hashed-agonzalez123",
    district: "District One",
    stateCode: "us_mi",
    routes: observable({
      insights: true,
      "insights_supervision_supervisors-list": true,
    }),
  });

  vi.spyOn(store.insightsStore.apiClient, "supervisionOfficerSupervisors");
  await flowResult(store.populateUserInfo());

  await expect(
    flowResult(store.populateSupervisionOfficerSupervisors()),
  ).toResolve();
  expect(
    store.insightsStore.apiClient.supervisionOfficerSupervisors,
  ).toHaveBeenCalled();
});

test("non-supervisor user without supervisors list permission errors in hydration", async () => {
  vi.spyOn(
    store.insightsStore.rootStore.userStore,
    "userAppMetadata",
    "get",
  ).mockReturnValue({
    pseudonymizedId: "hashed-leadership123",
    stateCode: "us_mi",
    routes: observable({
      insights: true,
      "insights_supervision_supervisors-list": false,
    }),
  });

  vi.spyOn(store.insightsStore.apiClient, "supervisionOfficerSupervisors");
  await flowResult(store.populateUserInfo());

  await expect(
    flowResult(store.populateSupervisionOfficerSupervisors()),
  ).rejects.toThrow(
    "User is not a supervisor but cannot access all supervisors",
  );
  expect(
    store.insightsStore.apiClient.supervisionOfficerSupervisors,
  ).not.toHaveBeenCalled();
});

test("patch user info: set hasSeenOnboarding", async () => {
  vi.spyOn(
    store.insightsStore.rootStore.userStore,
    "userAppMetadata",
    "get",
  ).mockReturnValue({
    externalId: "abc123",
    pseudonymizedId: "hashed-agonzalez123",
    district: "District One",
    stateCode: "us_mi",
    routes: observable({
      insights: true,
      "insights_supervision_supervisors-list": false,
    }),
  });
  await flowResult(store.populateUserInfo());
  expect(store.userInfo?.metadata.hasSeenOnboarding).toBeFalse();

  await flowResult(
    store.patchUserInfoForCurrentUser({ hasSeenOnboarding: true }),
  );
  expect(store.userInfo?.metadata.hasSeenOnboarding).toBeTrue();
});

test("patch user info fails for recidiviz user", async () => {
  vi.spyOn(
    store.insightsStore.rootStore.userStore,
    "userAppMetadata",
    "get",
  ).mockReturnValue({
    stateCode: "recidiviz",
  });
  await flowResult(store.populateUserInfo());
  expect(store.userInfo?.metadata.hasSeenOnboarding).toBeTrue();

  await expect(
    flowResult(store.patchUserInfoForCurrentUser({ hasSeenOnboarding: false })),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `[Error: Cannot update user info for Recidiviz or CSG user]`,
  );
});

test("look up supervisor by ID", async () => {
  vi.spyOn(store, "userCanAccessAllSupervisors", "get").mockReturnValue(true);
  await flowResult(store.populateSupervisionOfficerSupervisors());

  const testSupervisor = supervisionOfficerSupervisorsFixture[0];
  expect(
    store.supervisionOfficerSupervisorByExternalId(testSupervisor.externalId),
  ).toEqual(testSupervisor);
});

test("look up supervisor by pseudonymized ID", async () => {
  vi.spyOn(store, "userCanAccessAllSupervisors", "get").mockReturnValue(true);
  await flowResult(store.populateSupervisionOfficerSupervisors());

  const testSupervisor = supervisionOfficerSupervisorsFixture[0];
  expect(
    store.supervisionOfficerSupervisorByPseudoId(
      testSupervisor.pseudonymizedId,
    ),
  ).toEqual(testSupervisor);
});

test("hydrate supervisionOfficerMetricEvents", async () => {
  const testOfficerPseudoId = supervisionOfficerFixture[1].pseudonymizedId;
  const testMetricId = supervisionOfficerFixture[2].outlierMetrics[0].metricId;

  function getTestEvents() {
    return store.metricEventsByOfficerPseudoIdAndMetricId
      .get(testOfficerPseudoId)
      ?.get(testMetricId);
  }

  expect(getTestEvents()).toBeUndefined();

  await flowResult(
    store.populateMetricEventsForOfficer(testOfficerPseudoId, testMetricId),
  );

  expect(getTestEvents()).toBeDefined();
  expect(getTestEvents()).toMatchSnapshot();
});

test("hydrate latestBenchmarksDate", async () => {
  await expect(flowResult(store.populateMetricConfigs())).toResolve();

  expect(store.latestBenchmarksDate).toEqual(LATEST_END_DATE);
});

test("hydrate clientEvents", async () => {
  const testClientPseudoId =
    supervisionOfficerMetricEventFixture[0].pseudonymizedClientId;
  const outcomeDateString = formatDateToISO(LATEST_END_DATE);
  store.setOutcomeDate(outcomeDateString);

  function getTestEvents() {
    if (!store.outcomeDate) return undefined;

    return store.clientEventsByClientPseudoIdAndOutcomeDate
      .get(testClientPseudoId)
      ?.get(store.outcomeDate.toISOString());
  }

  expect(getTestEvents()).toBeUndefined();

  await flowResult(
    store.populateClientEventsForClient(
      testClientPseudoId,
      parseISO(outcomeDateString),
    ),
  );

  expect(getTestEvents()).toBeDefined();
  expect(getTestEvents()).toMatchSnapshot();
});

test("hydrate clientInfo", async () => {
  const testClientPseudoId =
    supervisionOfficerMetricEventFixture[0].pseudonymizedClientId;

  function getTestInfo() {
    return store.clientInfoByClientPseudoId.get(testClientPseudoId);
  }
  expect(getTestInfo()).toBeUndefined();

  await flowResult(store.populateClientInfoForClient(testClientPseudoId));

  expect(getTestInfo()).toBeDefined();
  expect(getTestInfo()).toMatchSnapshot();
});

test("setOutcomeDate", async () => {
  store.setOutcomeDate("2023-05-14");
  expect(store.outcomeDate?.toISOString()).toEqual("2023-05-14T00:00:00.000Z");
});

test("hydrate actionStrategies", async () => {
  vi.spyOn(
    store.insightsStore.rootStore.userStore,
    "userAppMetadata",
    "get",
  ).mockReturnValue({
    externalId: "abc123",
    pseudonymizedId: "hashed-agonzalez123",
    district: "District One",
    stateCode: "us_mi",
  });
  vi.spyOn(
    store.insightsStore.rootStore.userStore,
    "activeFeatureVariants",
    "get",
  ).mockReturnValue({
    actionStrategies: {},
  });
  await flowResult(store.populateActionStrategies());

  expect(store.actionStrategies).toBeDefined();
  expect(store.actionStrategies).toMatchInlineSnapshot(`
    {
      "hashed-agonzalez123": "ACTION_STRATEGY_60_PERC_OUTLIERS",
      "hashed-rsmith789": "ACTION_STRATEGY_60_PERC_OUTLIERS",
      "hashed-so1": "ACTION_STRATEGY_OUTLIER",
      "hashed-so3": "ACTION_STRATEGY_OUTLIER_ABSCONSION",
      "hashed-so4": "ACTION_STRATEGY_OUTLIER_NEW_OFFICER",
      "hashed-so8": "ACTION_STRATEGY_OUTLIER_3_MONTHS",
    }
  `);
});

test("hydrate actionStrategies requires userPseudoId", async () => {
  vi.spyOn(
    store.insightsStore.rootStore.userStore,
    "userAppMetadata",
    "get",
  ).mockReturnValue({
    district: "District One",
    stateCode: "us_mi",
  });
  vi.spyOn(
    store.insightsStore.rootStore.userStore,
    "activeFeatureVariants",
    "get",
  ).mockReturnValue({
    actionStrategies: {},
  });

  await expect(() => store.populateActionStrategies()).rejects.toThrow(
    "Missing pseudonymizedId for user",
  );
});

test("hydrate actionStrategies without required featureVariant", async () => {
  const pseudoId = "hashed-agonzalez123";
  vi.spyOn(
    store.insightsStore.rootStore.userStore,
    "userAppMetadata",
    "get",
  ).mockReturnValue({
    district: "District One",
    stateCode: "us_mi",
    externalId: "abc123",
    pseudonymizedId: pseudoId,
  });

  await flowResult(store.populateActionStrategies());
  expect(store.actionStrategies).toMatchInlineSnapshot(`{}`);
});

test("isActionStrategiesEnabled is true when all requirements met", async () => {
  const pseudoId = "hashed-agonzalez123";
  vi.spyOn(
    store.insightsStore.rootStore.userStore,
    "userAppMetadata",
    "get",
  ).mockReturnValue({
    district: "District One",
    stateCode: "us_mi",
    externalId: "abc123",
    pseudonymizedId: pseudoId,
  });
  store.supervisorPseudoId = pseudoId;
  vi.spyOn(
    store.insightsStore.rootStore.userStore,
    "activeFeatureVariants",
    "get",
  ).mockReturnValue({
    actionStrategies: {},
  });
  await flowResult(store.populateUserInfo());

  expect(store.isActionStrategiesEnabled).toBeTrue();

  store.disableSurfaceActionStrategies();

  expect(store.isActionStrategiesEnabled).toBeFalse();
});

test("isActionStrategiesEnabled without required featureVariant", async () => {
  vi.spyOn(
    store.insightsStore.rootStore.userStore,
    "userAppMetadata",
    "get",
  ).mockReturnValue({
    district: "District One",
    stateCode: "us_mi",
    externalId: "abc123",
    pseudonymizedId: "hashed-agonzalez123",
  });
  store.supervisorPseudoId = "hashed-agonzalez123";
  await flowResult(store.populateUserInfo());
  expect(store.isActionStrategiesEnabled).toBeFalse();
});

test("setUserHasSeenActionStrategy", async () => {
  vi.spyOn(
    store.insightsStore.rootStore.userStore,
    "userAppMetadata",
    "get",
  ).mockReturnValue({
    externalId: "abc123",
    pseudonymizedId: "hashed-agonzalez123",
    district: "District One",
    stateCode: "us_mi",
    routes: observable({
      insights: true,
      "insights_supervision_supervisors-list": false,
    }),
  });
  vi.spyOn(
    store.insightsStore.rootStore.userStore,
    "activeFeatureVariants",
    "get",
  ).mockReturnValue({
    actionStrategies: {},
  });
  vi.spyOn(InsightsOfflineAPIClient.prototype, "patchActionStrategies");
  await flowResult(store.populateActionStrategies());

  store.setUserHasSeenActionStrategy("hashed-agonzalez123");
  expect(
    store.insightsStore.apiClient.patchActionStrategies,
  ).toHaveBeenCalledWith({
    actionStrategy: "ACTION_STRATEGY_60_PERC_OUTLIERS",
    officerPseudonymizedId: undefined,
    userPseudonymizedId: "hashed-agonzalez123",
  });
});
