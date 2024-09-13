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

/* eslint-disable class-methods-use-this */

import { differenceInDays, subDays } from "date-fns";

import { isDemoMode, isOfflineMode, isTestEnv } from "~client-env-utils";
import {
  ActionStrategy,
  actionStrategyFixture,
  ClientEvent,
  clientEventFixture,
  ClientInfo,
  clientInfoFixture,
  ExcludedSupervisionOfficer,
  excludedSupervisionOfficerFixture,
  FAVORABLE_METRIC_IDS,
  InsightsConfigFixture,
  LATEST_END_DATE,
  leadershipUserInfoFixture,
  MetricBenchmark,
  metricBenchmarksFixture,
  rawExcludedSupervisionOfficerFactoryConfig,
  rawSupervisionOfficerFactoryConfig,
  rawSupervisionOfficerSupervisorFactoryConfig,
  SupervisionOfficer,
  supervisionOfficerFixture,
  SupervisionOfficerMetricEvent,
  supervisionOfficerMetricEventFixture,
  SupervisionOfficerSupervisor,
  supervisionOfficerSupervisorsFixture,
  UserInfo,
} from "~datatypes";
import { FixtureFactoryMap } from "~fixture-generator";

import type { InsightsStore } from "../InsightsStore";
import {
  ActionStrategySurfacedEvent,
  InsightsAPI,
  PatchUserInfoProps,
} from "./interface";

let insightsOfflineFixtureMap: FixtureFactoryMap | undefined;
// TODO: Remove once we can use the new fixtures in demo mode?

const isOfflineAndNotTest = () => isOfflineMode() && !isTestEnv();
const getInsightsOfflineFixtureMap = (): FixtureFactoryMap =>
  insightsOfflineFixtureMap === undefined
    ? (insightsOfflineFixtureMap = new FixtureFactoryMap())
    : insightsOfflineFixtureMap;

export class InsightsOfflineAPIClient implements InsightsAPI {
  private pseudoIdToEditableUserInfo: Map<
    string,
    { metadata: PatchUserInfoProps }
  > = new Map();

  // eslint-disable-next-line no-useless-constructor
  constructor(public readonly insightsStore: InsightsStore) {}

  async init() {
    return InsightsConfigFixture;
  }

  async actionStrategies(supervisorPseudoId: string): Promise<ActionStrategy> {
    return actionStrategyFixture;
  }

  async patchActionStrategies(
    props: ActionStrategySurfacedEvent,
  ): Promise<ActionStrategySurfacedEvent> {
    return { ...props, timestamp: new Date() };
  }

  async userInfo(userPseudoId: string): Promise<UserInfo> {
    const matchingSupervisor = supervisionOfficerSupervisorsFixture.find(
      (supervisor) => supervisor.pseudonymizedId === userPseudoId,
    );

    if (matchingSupervisor) {
      return {
        role: "supervision_officer_supervisor",
        entity: matchingSupervisor,
        ...(this.pseudoIdToEditableUserInfo.get(userPseudoId) ?? {
          metadata: {
            hasSeenOnboarding: false,
          },
        }),
      };
    }

    return {
      ...leadershipUserInfoFixture,
      ...(this.pseudoIdToEditableUserInfo.get(userPseudoId) ?? {
        metadata: {
          hasSeenOnboarding: false,
        },
      }),
    };
  }

  async patchUserInfo(
    userPseudoId: string,
    props: PatchUserInfoProps,
  ): Promise<UserInfo> {
    this.pseudoIdToEditableUserInfo.set(userPseudoId, { metadata: props });
    return this.userInfo(userPseudoId);
  }

  async metricBenchmarks(): Promise<MetricBenchmark[]> {
    return metricBenchmarksFixture;
  }

  async supervisionOfficerSupervisors(): Promise<
    SupervisionOfficerSupervisor[]
  > {
    if (isOfflineAndNotTest()) {
      const { stateCode } = this.insightsStore.rootStore.userStore;
      const supervisors = getInsightsOfflineFixtureMap().get<
        SupervisionOfficerSupervisor[]
      >(rawSupervisionOfficerSupervisorFactoryConfig, undefined, stateCode);
      return supervisors;
    }
    return supervisionOfficerSupervisorsFixture;
  }

  // TODO(#4625): Add state-specific fixtures, which will remove the need for this logic
  removeCaSpecificDataFromFixture(
    officerData: SupervisionOfficer,
  ): SupervisionOfficer {
    return {
      ...officerData,
      outlierMetrics: officerData.outlierMetrics.filter(
        (metric) =>
          metric.metricId !== FAVORABLE_METRIC_IDS.enum.treatment_starts,
      ),
      topXPctMetrics: [],
    };
  }

  async officersForSupervisor(
    supervisorPseudoId: string,
  ): Promise<Array<SupervisionOfficer>> {
    if (isOfflineAndNotTest()) {
      const { stateCode } = this.insightsStore.rootStore.userStore;
      const supervisors = getInsightsOfflineFixtureMap().get<
        SupervisionOfficerSupervisor[]
      >(rawSupervisionOfficerSupervisorFactoryConfig, undefined, stateCode);

      const officers = getInsightsOfflineFixtureMap().get<SupervisionOfficer[]>(
        rawSupervisionOfficerFactoryConfig,
        undefined,
        supervisors,
        stateCode,
      );

      const supervisor = supervisors.find(
        (s) => s.pseudonymizedId === supervisorPseudoId,
      );

      const officersWithSupervisorPseudoId = supervisor
        ? officers.filter((o) =>
            o.supervisorExternalIds.includes(supervisor.externalId),
          )
        : [];

      return officersWithSupervisorPseudoId;
    }

    const transformedFixture = isDemoMode()
      ? supervisionOfficerFixture.map((officer) =>
          this.removeCaSpecificDataFromFixture(officer),
        )
      : supervisionOfficerFixture;

    return transformedFixture.filter((o) =>
      o.supervisorExternalIds
        .map((i) => `hashed-${i}`)
        .includes(supervisorPseudoId),
    );
  }

  async excludedOfficersForSupervisor(
    supervisorPseudoId: string,
  ): Promise<Array<ExcludedSupervisionOfficer>> {
    if (isOfflineAndNotTest()) {
      const { stateCode } = this.insightsStore.rootStore.userStore;
      const supervisors = getInsightsOfflineFixtureMap().get<
        SupervisionOfficerSupervisor[]
      >(rawSupervisionOfficerSupervisorFactoryConfig, undefined, stateCode);

      const officers = getInsightsOfflineFixtureMap().get<
        ExcludedSupervisionOfficer[]
      >(
        rawExcludedSupervisionOfficerFactoryConfig,
        undefined,
        supervisors,
        stateCode,
      );

      const supervisor = supervisors.find(
        (s) => s.pseudonymizedId === supervisorPseudoId,
      );

      const excludedOfficersWithSupervisorPseudoId = supervisor
        ? officers.filter((o) =>
            o.supervisorExternalIds.includes(supervisor.externalId),
          )
        : [];

      return excludedOfficersWithSupervisorPseudoId;
    }

    return excludedSupervisionOfficerFixture.filter((o) =>
      o.supervisorExternalIds
        .map((i) => `hashed-${i}`)
        .includes(supervisorPseudoId),
    );
  }

  async supervisionOfficer(
    officerPseudoId: string,
  ): Promise<SupervisionOfficer> {
    let supervisionOfficers: SupervisionOfficer[];
    if (isOfflineAndNotTest()) {
      const { stateCode } = this.insightsStore.rootStore.userStore;
      const supervisors = getInsightsOfflineFixtureMap().get<
        SupervisionOfficerSupervisor[]
      >(rawSupervisionOfficerSupervisorFactoryConfig, undefined, stateCode);

      supervisionOfficers = getInsightsOfflineFixtureMap().get<
        SupervisionOfficer[]
      >(rawSupervisionOfficerFactoryConfig, undefined, supervisors, stateCode);
    } else supervisionOfficers = supervisionOfficerFixture;

    const officerFixture = supervisionOfficers.find(
      (o) => o.pseudonymizedId === officerPseudoId,
    );

    if (!officerFixture)
      throw new Error(`Officer ${officerPseudoId} not present in fixture data`);

    return isDemoMode()
      ? this.removeCaSpecificDataFromFixture(officerFixture)
      : officerFixture;
  }

  async excludedSupervisionOfficer(
    officerPseudoId: string,
  ): Promise<ExcludedSupervisionOfficer> {
    let excludedOfficers: ExcludedSupervisionOfficer[];

    if (isOfflineAndNotTest()) {
      const { stateCode } = this.insightsStore.rootStore.userStore;

      const supervisors = getInsightsOfflineFixtureMap().get<
        SupervisionOfficerSupervisor[]
      >(rawSupervisionOfficerSupervisorFactoryConfig, undefined, stateCode);

      excludedOfficers = getInsightsOfflineFixtureMap().get<
        ExcludedSupervisionOfficer[]
      >(
        rawExcludedSupervisionOfficerFactoryConfig,
        undefined,
        supervisors,
        stateCode,
      );
    } else excludedOfficers = excludedSupervisionOfficerFixture;

    const officerFixture = excludedOfficers.find(
      (o) => o.pseudonymizedId === officerPseudoId,
    );

    if (!officerFixture)
      throw new Error(`Officer ${officerPseudoId} not present in fixture data`);

    return officerFixture;
  }

  async supervisionOfficerMetricEvents(
    officerPseudoId: string,
    metricId: string,
  ): Promise<SupervisionOfficerMetricEvent[]> {
    return supervisionOfficerMetricEventFixture.filter(
      (e) => e.metricId === metricId,
    );
  }

  async clientInfo(clientPseudoId: string): Promise<ClientInfo> {
    const clientInfo = clientInfoFixture[clientPseudoId];

    if (!clientInfo) {
      throw new Error(`Client ${clientPseudoId} not present in fixture data`);
    }

    return clientInfo;
  }

  async clientEvents(
    clientPseudoId: string,
    endDate: Date,
  ): Promise<Array<ClientEvent>> {
    // adjust fixture dates relative to the input
    const dateOffsetInDays = differenceInDays(LATEST_END_DATE, endDate);

    return clientEventFixture.map((event) => ({
      ...event,
      eventDate: subDays(event.eventDate, dateOffsetInDays),
    }));
  }
}
