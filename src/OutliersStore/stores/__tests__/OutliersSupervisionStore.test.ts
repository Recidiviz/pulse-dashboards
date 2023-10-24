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

import { cloneDeep } from "lodash";
import { configure, flowResult } from "mobx";
import { ValuesType } from "utility-types";

import { RootStore } from "../../../RootStore";
import { isOfflineMode } from "../../../utils/isOfflineMode";
import { OutliersOfflineAPIClient } from "../../api/OutliersOfflineAPIClient";
import { CASELOAD_TYPE_IDS } from "../../models/offlineFixtures/constants";
import { metricBenchmarksFixture } from "../../models/offlineFixtures/MetricBenchmarkFixture";
import { OutliersConfigFixture } from "../../models/offlineFixtures/OutliersConfigFixture";
import { supervisionOfficerFixture } from "../../models/offlineFixtures/SupervisionOfficerFixture";
import { supervisionOfficerSupervisorsFixture } from "../../models/offlineFixtures/SupervisionOfficerSupervisor";
import { OutliersConfig } from "../../models/OutliersConfig";
import { OutliersStore } from "../../OutliersStore";
import { OutliersSupervisionStore } from "../OutliersSupervisionStore";

let store: OutliersSupervisionStore;

beforeEach(() => {
  jest.resetModules();
  configure({ safeDescriptors: false });
  store = new OutliersSupervisionStore(
    new OutliersStore(new RootStore()),
    OutliersConfigFixture
  );
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

  expect(store.metricConfigsById).toBeUndefined();
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

test("adverse metric configs", async () => {
  const additionalConfigsFixture = cloneDeep(OutliersConfigFixture);
  const favorableMetricConfig: ValuesType<OutliersConfig["metrics"]> = {
    name: "transfers_to_liberty",
    bodyDisplayName: "successful discharge rate",
    titleDisplayName: "Successful discharge rate",
    eventName: "successful discharges",
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
  expect(store.supervisionOfficerSupervisors).toBeFalsy();

  await expect(
    flowResult(store.hydrateSupervisionOfficerSupervisors())
  ).resolves.not.toThrow();
  expect(store.supervisionOfficerSupervisors?.length).toBe(
    supervisionOfficerSupervisorsFixture.length
  );
});

test("hydrate supervisionOfficers for supervisor", async () => {
  const testSupervisorId = supervisionOfficerSupervisorsFixture[0].externalId;
  expect(store.officersBySupervisor.has(testSupervisorId)).toBeFalse();

  await expect(
    flowResult(store.hydrateOfficersForSupervisor(testSupervisorId))
  ).resolves.not.toThrow();

  expect(store.officersBySupervisor.get(testSupervisorId)).toEqual(
    expect.arrayContaining(supervisionOfficerFixture.slice(0, 2))
  );
});

test("current user record for supervisor except offline mode", () => {
  jest
    .spyOn(store.outliersStore.rootStore.userStore, "userAppMetadata", "get")
    .mockReturnValue({
      role: "supervision_staff",
      externalId: "abc123",
      district: "District One",
      stateCode: "us_mi",
    });

  if (isOfflineMode()) expect(store.currentSupervisorUser).toBeUndefined();

  expect(store.currentSupervisorUser).toBeDefined();
  expect(store.currentSupervisorUser).toMatchInlineSnapshot(`
    Object {
      "displayName": "",
      "externalId": "abc123",
      "fullName": Object {},
      "supervisionDistrict": "District One",
    }
  `);
});

test("current user record requires external ID", () => {
  jest
    .spyOn(store.outliersStore.rootStore.userStore, "userAppMetadata", "get")
    .mockReturnValue({
      role: "supervision_staff",
      district: "District One",
      stateCode: "us_mi",
    });

  expect(store.currentSupervisorUser).toBeUndefined();
});

test("no current user record for non-supervisor", () => {
  jest
    .spyOn(store.outliersStore.rootStore.userStore, "userAppMetadata", "get")
    .mockReturnValue({
      role: "leadership_role",
      externalId: "abc123",
      stateCode: "us_mi",
    });

  expect(store.currentSupervisorUser).toBeUndefined();
});

test("hydrate supervisors list with current user", () => {
  jest
    .spyOn(store.outliersStore.rootStore.userStore, "userAppMetadata", "get")
    .mockReturnValue({
      role: "supervision_staff",
      externalId: "abc123",
      district: "District One",
      stateCode: "us_mi",
    });

  expect(store.supervisionOfficerSupervisors).toBeDefined();
  expect(store.supervisionOfficerSupervisors).toMatchInlineSnapshot(`
    Array [
      Object {
        "displayName": "",
        "externalId": "abc123",
        "fullName": Object {},
        "supervisionDistrict": "District One",
      },
    ]
  `);
});

test("current supervisor user does not hydrate via API", async () => {
  jest
    .spyOn(store.outliersStore.rootStore.userStore, "userAppMetadata", "get")
    .mockReturnValue({
      role: "supervision_staff",
      externalId: "abc123",
      district: "District One",
      stateCode: "us_mi",
    });

  jest.spyOn(store.outliersStore.apiClient, "supervisionOfficerSupervisors");

  await expect(
    flowResult(store.hydrateSupervisionOfficerSupervisors())
  ).toResolve();
  expect(
    store.outliersStore.apiClient.supervisionOfficerSupervisors
  ).not.toHaveBeenCalled();
});

test("look up supervisor by ID", async () => {
  await flowResult(store.hydrateSupervisionOfficerSupervisors());

  const testSupervisor = supervisionOfficerSupervisorsFixture[0];
  expect(store.supervisionOfficerSupervisor(testSupervisor.externalId)).toEqual(
    testSupervisor
  );
});

test("hydrate supervisionOfficerMetricEvents", async () => {
  const testOfficer = supervisionOfficerFixture[1].externalId;
  const testMetric = supervisionOfficerFixture[2].outlierMetrics[0].metricId;

  function getTestEvents() {
    return store.metricEventsByOfficerAndMetricId
      .get(testOfficer)
      ?.get(testMetric);
  }

  expect(getTestEvents()).toBeUndefined();

  await flowResult(
    store.hydrateMetricEventsForOfficer(testOfficer, testMetric)
  );

  expect(getTestEvents()).toBeDefined();
  expect(getTestEvents()).toMatchSnapshot();
});
