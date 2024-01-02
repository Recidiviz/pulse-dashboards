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

import { parseISO } from "date-fns";
import { cloneDeep } from "lodash";
import { configure, flowResult, observable } from "mobx";
import { ValuesType } from "utility-types";

import { RootStore } from "../../../RootStore";
import { formatDateToISO } from "../../../utils";
import { OutliersOfflineAPIClient } from "../../api/OutliersOfflineAPIClient";
import {
  CASELOAD_TYPE_IDS,
  LATEST_END_DATE,
} from "../../models/offlineFixtures/constants";
import { metricBenchmarksFixture } from "../../models/offlineFixtures/MetricBenchmarkFixture";
import { OutliersConfigFixture } from "../../models/offlineFixtures/OutliersConfigFixture";
import { supervisionOfficerFixture } from "../../models/offlineFixtures/SupervisionOfficerFixture";
import { supervisionOfficerMetricEventFixture } from "../../models/offlineFixtures/SupervisionOfficerMetricEventFixture";
import { supervisionOfficerSupervisorsFixture } from "../../models/offlineFixtures/SupervisionOfficerSupervisor";
import { OutliersConfig } from "../../models/OutliersConfig";
import { OutliersStore } from "../../OutliersStore";
import { SupervisionPresenter } from "../../presenters/SupervisionPresenter";
import { OutliersSupervisionStore } from "../OutliersSupervisionStore";

let store: OutliersSupervisionStore;

beforeEach(async () => {
  jest.resetModules();
  configure({ safeDescriptors: false });
  const outliersStore = new OutliersStore(new RootStore());
  const presenter = new SupervisionPresenter(outliersStore);
  await presenter.hydrate();
  if (outliersStore.supervisionStore) {
    store = outliersStore.supervisionStore;
  }
});

afterEach(() => {
  jest.restoreAllMocks();
  configure({ safeDescriptors: true });
});

test("hydrate benchmarks", async () => {
  await expect(flowResult(store.hydrateMetricConfigs())).toResolve();
});

test("cannot hydrate benchmarks with API error", async () => {
  jest
    .spyOn(OutliersOfflineAPIClient.prototype, "metricBenchmarks")
    .mockRejectedValue(new Error("something went wrong"));

  await expect(flowResult(store.hydrateMetricConfigs())).toReject();

  expect(store.metricConfigsById).toBeUndefined();
});

// The verification for missing metrics happens in the presenter where we
// have a more accurate idea of which metrics are necessary per supervisor/caseload type
test("can hydrate benchmarks with missing metrics", async () => {
  jest
    .spyOn(OutliersOfflineAPIClient.prototype, "metricBenchmarks")
    // this should include only 2 of the 3 expected metric types
    .mockResolvedValue(metricBenchmarksFixture.slice(0, 2));

  await expect(flowResult(store.hydrateMetricConfigs())).toResolve();

  const techsConfig = store.metricConfigsById?.get(
    "incarceration_starts_technical_violation"
  );
  expect(techsConfig).toBeDefined();
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  expect(techsConfig!.metricBenchmarksByCaseloadType).toBeUndefined();
});

test("configs include benchmarks", async () => {
  await flowResult(store.hydrateMetricConfigs());

  store.metricConfigsById?.forEach((mc) => {
    // benchmarks data should be hydrated
    expect(mc.metricBenchmarksByCaseloadType).toBeDefined();
    // both caseload types should be present for all
    expect(Array.from(mc.metricBenchmarksByCaseloadType?.keys() ?? [])).toEqual(
      expect.arrayContaining(CASELOAD_TYPE_IDS.options)
    );
  });

  expect.assertions(OutliersConfigFixture.metrics.length * 2);
});

test("hydrated benchmarks can be missing caseload types", async () => {
  jest
    .spyOn(OutliersOfflineAPIClient.prototype, "metricBenchmarks")
    // this should be missing the SEX_OFFENSE caseload type for all metrics
    .mockResolvedValue(metricBenchmarksFixture.slice(0, 3));

  await expect(flowResult(store.hydrateMetricConfigs())).toResolve();

  expect(store.metricConfigsById).toBeDefined();

  store.metricConfigsById?.forEach((mc) => {
    expect(
      mc.metricBenchmarksByCaseloadType?.get(
        CASELOAD_TYPE_IDS.enum.GENERAL_OR_OTHER
      )
    ).toBeDefined();
    expect(
      mc.metricBenchmarksByCaseloadType?.get(CASELOAD_TYPE_IDS.enum.SEX_OFFENSE)
    ).toBeUndefined();
  });
});

test("caseload typebreakdowns enabled", async () => {
  expect(store.areCaseloadTypeBreakdownsEnabled).toBeFalse();

  await flowResult(store.hydrateMetricConfigs());
  expect(store.areCaseloadTypeBreakdownsEnabled).toBeTrue();
});

test("caseload typebreakdowns not enabled", async () => {
  expect(store.areCaseloadTypeBreakdownsEnabled).toBeFalse();

  jest
    .spyOn(OutliersOfflineAPIClient.prototype, "metricBenchmarks")
    // this should be missing the SEX_OFFENSE caseload type for all metrics
    .mockResolvedValue(metricBenchmarksFixture.slice(0, 3));

  await flowResult(store.hydrateMetricConfigs());

  expect(store.areCaseloadTypeBreakdownsEnabled).toBeFalse();
});

test("adverse metric configs", async () => {
  const additionalConfigsFixture = cloneDeep(OutliersConfigFixture);
  const favorableMetricConfig: ValuesType<OutliersConfig["metrics"]> = {
    name: "transfers_to_liberty",
    bodyDisplayName: "successful discharge rate",
    titleDisplayName: "Successful discharge rate",
    eventName: "successful discharges",
    eventNameSingular: "successful discharge",
    outcomeType: "FAVORABLE",
  };
  additionalConfigsFixture.metrics.push(favorableMetricConfig);

  store = new OutliersSupervisionStore(
    new OutliersStore(new RootStore()),
    additionalConfigsFixture
  );

  expect(store.adverseMetricConfigsById).toBeUndefined();

  // also need to hydrate benchmark data.
  // This is not realistic for this metric but it doesn't really matter for this test
  const additionalMetricBenchmark = cloneDeep(metricBenchmarksFixture[0]);
  additionalMetricBenchmark.metricId = favorableMetricConfig.name;
  jest
    .spyOn(OutliersOfflineAPIClient.prototype, "metricBenchmarks")
    .mockResolvedValue([...metricBenchmarksFixture, additionalMetricBenchmark]);

  await flowResult(store.hydrateMetricConfigs());

  // base config mapping should have all metrics
  additionalConfigsFixture.metrics.forEach((m) => {
    expect(store.metricConfigsById?.get(m.name)).toBeDefined();
  });

  // adverse config mapping should not include the additional one we injected
  OutliersConfigFixture.metrics.forEach((m) => {
    expect(store.adverseMetricConfigsById?.get(m.name)).toBeDefined();
  });
  expect(
    store.adverseMetricConfigsById?.get(favorableMetricConfig.name)
  ).toBeUndefined();
});

test("hydrate supervisionOfficerSupervisors", async () => {
  jest.spyOn(store, "userCanAccessAllSupervisors", "get").mockReturnValue(true);
  expect(store.supervisionOfficerSupervisors).toBeFalsy();

  await expect(
    flowResult(store.hydrateSupervisionOfficerSupervisors())
  ).resolves.not.toThrow();
  expect(store.supervisionOfficerSupervisors?.length).toBe(
    supervisionOfficerSupervisorsFixture.length
  );
});

test("hydrate supervisionOfficers for supervisor", async () => {
  const testSupervisorPseudoId =
    supervisionOfficerSupervisorsFixture[0].pseudonymizedId;
  expect(
    store.officersBySupervisorPseudoId.has(testSupervisorPseudoId)
  ).toBeFalse();

  await expect(
    flowResult(store.hydrateOfficersForSupervisor(testSupervisorPseudoId))
  ).resolves.not.toThrow();

  expect(
    store.officersBySupervisorPseudoId.get(testSupervisorPseudoId)
  ).toEqual(expect.arrayContaining(supervisionOfficerFixture.slice(0, 2)));
});

test("userCanAccessAllSupervisors with missing route", () => {
  jest
    .spyOn(store.outliersStore.rootStore.userStore, "userAppMetadata", "get")
    .mockReturnValue({
      pseudonymizedId: "hashed-abc123",
      routes: observable({ insights: true }),
      stateCode: "us_mi",
    });

  expect(store.userCanAccessAllSupervisors).toBeFalse();
});

test("userCanAccessAllSupervisors with false route", () => {
  jest
    .spyOn(store.outliersStore.rootStore.userStore, "userAppMetadata", "get")
    .mockReturnValue({
      pseudonymizedId: "hashed-abc123",
      routes: observable({ "insights_supervision_supervisors-list": false }),
      stateCode: "us_mi",
    });

  expect(store.userCanAccessAllSupervisors).toBeFalse();
});

test("userCanAccessAllSupervisors with true route", () => {
  jest
    .spyOn(store.outliersStore.rootStore.userStore, "userAppMetadata", "get")
    .mockReturnValue({
      pseudonymizedId: "hashed-abc123",
      routes: observable({ "insights_supervision_supervisors-list": true }),
      stateCode: "us_mi",
    });

  expect(store.userCanAccessAllSupervisors).toBeTrue();
});

test("userCanAccessAllSupervisors with missing route", () => {
  jest
    .spyOn(store.outliersStore.rootStore.userStore, "userAppMetadata", "get")
    .mockReturnValue({
      pseudonymizedId: "hashed-abc123",
      routes: observable({ insights: true }),
      stateCode: "us_mi",
    });

  expect(store.userCanAccessAllSupervisors).toBeFalse();
});

test("userCanAccessAllSupervisors with false route", () => {
  jest
    .spyOn(store.outliersStore.rootStore.userStore, "userAppMetadata", "get")
    .mockReturnValue({
      pseudonymizedId: "hashed-abc123",
      routes: observable({ "insights_supervision_supervisors-list": false }),
      stateCode: "us_mi",
    });

  expect(store.userCanAccessAllSupervisors).toBeFalse();
});

test("userCanAccessAllSupervisors with true route", () => {
  jest
    .spyOn(store.outliersStore.rootStore.userStore, "userAppMetadata", "get")
    .mockReturnValue({
      pseudonymizedId: "hashed-abc123",
      routes: observable({ "insights_supervision_supervisors-list": true }),
      stateCode: "us_mi",
    });

  expect(store.userCanAccessAllSupervisors).toBeTrue();
});

test("current user record for supervisor", async () => {
  jest
    .spyOn(store.outliersStore.rootStore.userStore, "userAppMetadata", "get")
    .mockReturnValue({
      externalId: "abc123",
      pseudonymizedId: "hashed-mdavis123",
      district: "District One",
      stateCode: "us_mi",
    });
  await flowResult(store.hydrateUserInfo());

  expect(store.currentSupervisorUser).toBeDefined();
  expect(store.currentSupervisorUser).toMatchInlineSnapshot(`
    Object {
      "displayName": "Miles D Davis",
      "externalId": "mdavis123",
      "fullName": Object {
        "givenNames": "Miles",
        "middleNames": "D",
        "surname": "Davis",
      },
      "hasOutliers": true,
      "pseudonymizedId": "hashed-mdavis123",
      "supervisionDistrict": "Region D1",
    }
  `);
});

test("hydrateUserInfo requires pseudo ID", async () => {
  jest
    .spyOn(store.outliersStore.rootStore.userStore, "userAppMetadata", "get")
    .mockReturnValue({
      district: "District One",
      stateCode: "us_mi",
    });

  await expect(() => store.hydrateUserInfo()).rejects.toThrow(
    "Missing pseudonymizedId for user"
  );
});

test("hydrate supervisors list with current user", async () => {
  jest
    .spyOn(store.outliersStore.rootStore.userStore, "userAppMetadata", "get")
    .mockReturnValue({
      externalId: "abc123",
      pseudonymizedId: "hashed-mdavis123",
      district: "District One",
      stateCode: "us_mi",
      routes: observable({
        insights: true,
        "insights_supervision_supervisors-list": false,
      }),
    });
  await flowResult(store.hydrateUserInfo());

  expect(store.supervisionOfficerSupervisors).toBeDefined();
  expect(store.supervisionOfficerSupervisors).toMatchInlineSnapshot(`
    Array [
      Object {
        "displayName": "Miles D Davis",
        "externalId": "mdavis123",
        "fullName": Object {
          "givenNames": "Miles",
          "middleNames": "D",
          "surname": "Davis",
        },
        "hasOutliers": true,
        "pseudonymizedId": "hashed-mdavis123",
        "supervisionDistrict": "Region D1",
      },
    ]
  `);
});

test("current supervisor user without supervisors list permission does not hydrate via supervisors API", async () => {
  jest
    .spyOn(store.outliersStore.rootStore.userStore, "userAppMetadata", "get")
    .mockReturnValue({
      externalId: "abc123",
      pseudonymizedId: "hashed-mdavis123",
      district: "District One",
      stateCode: "us_mi",
      routes: observable({
        insights: true,
        "insights_supervision_supervisors-list": false,
      }),
    });

  jest.spyOn(store.outliersStore.apiClient, "supervisionOfficerSupervisors");
  await flowResult(store.hydrateUserInfo());

  await expect(
    flowResult(store.hydrateSupervisionOfficerSupervisors())
  ).toResolve();
  expect(
    store.outliersStore.apiClient.supervisionOfficerSupervisors
  ).not.toHaveBeenCalled();
});

test("current supervisor user with supervisors list permission does hydrate via supervisors API", async () => {
  jest
    .spyOn(store.outliersStore.rootStore.userStore, "userAppMetadata", "get")
    .mockReturnValue({
      externalId: "abc123",
      pseudonymizedId: "hashed-mdavis123",
      district: "District One",
      stateCode: "us_mi",
      routes: observable({
        insights: true,
        "insights_supervision_supervisors-list": true,
      }),
    });

  jest.spyOn(store.outliersStore.apiClient, "supervisionOfficerSupervisors");
  await flowResult(store.hydrateUserInfo());

  await expect(
    flowResult(store.hydrateSupervisionOfficerSupervisors())
  ).toResolve();
  expect(
    store.outliersStore.apiClient.supervisionOfficerSupervisors
  ).toHaveBeenCalled();
});

test("non-supervisor user without supervisors list permission errors in hydration", async () => {
  jest
    .spyOn(store.outliersStore.rootStore.userStore, "userAppMetadata", "get")
    .mockReturnValue({
      pseudonymizedId: "hashed-leadership123",
      stateCode: "us_mi",
      routes: observable({
        insights: true,
        "insights_supervision_supervisors-list": false,
      }),
    });

  jest.spyOn(store.outliersStore.apiClient, "supervisionOfficerSupervisors");
  await flowResult(store.hydrateUserInfo());

  await expect(
    flowResult(store.hydrateSupervisionOfficerSupervisors())
  ).rejects.toThrow(
    "User is not a supervisor but cannot access all supervisors"
  );
  expect(
    store.outliersStore.apiClient.supervisionOfficerSupervisors
  ).not.toHaveBeenCalled();
});

test("look up supervisor by ID", async () => {
  jest.spyOn(store, "userCanAccessAllSupervisors", "get").mockReturnValue(true);
  await flowResult(store.hydrateSupervisionOfficerSupervisors());

  const testSupervisor = supervisionOfficerSupervisorsFixture[0];
  expect(
    store.supervisionOfficerSupervisorByExternalId(testSupervisor.externalId)
  ).toEqual(testSupervisor);
});

test("look up supervisor by pseudonymized ID", async () => {
  jest.spyOn(store, "userCanAccessAllSupervisors", "get").mockReturnValue(true);
  await flowResult(store.hydrateSupervisionOfficerSupervisors());

  const testSupervisor = supervisionOfficerSupervisorsFixture[0];
  expect(
    store.supervisionOfficerSupervisorByPseudoId(testSupervisor.pseudonymizedId)
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
    store.hydrateMetricEventsForOfficer(testOfficerPseudoId, testMetricId)
  );

  expect(getTestEvents()).toBeDefined();
  expect(getTestEvents()).toMatchSnapshot();
});

test("hydrate latestBenchmarksDate", async () => {
  await expect(flowResult(store.hydrateMetricConfigs())).toResolve();

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
    store.hydrateClientEventsForClient(
      testClientPseudoId,
      parseISO(outcomeDateString)
    )
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

  await flowResult(store.hydrateClientInfoForClient(testClientPseudoId));

  expect(getTestInfo()).toBeDefined();
  expect(getTestInfo()).toMatchSnapshot();
});

test("setOutcomeDate", async () => {
  store.setOutcomeDate("2023-05-14");
  expect(store.outcomeDate?.toISOString()).toEqual("2023-05-14T00:00:00.000Z");
});
