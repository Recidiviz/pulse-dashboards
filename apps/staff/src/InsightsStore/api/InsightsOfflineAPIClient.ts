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

import { differenceInDays, subDays } from "date-fns";

import { isTestEnv } from "~client-env-utils";
import {
  ActionStrategy,
  actionStrategyFixture,
  ClientEvent,
  clientEventFixture,
  ClientInfo,
  clientInfoFixture,
  getMockConfigsByTenantId,
  InsightsConfig,
  InsightsConfigFixture,
  LATEST_END_DATE,
  leadershipUserInfoFixture,
  MetricBenchmark,
  metricBenchmarksFixture,
  SupervisionOfficer,
  supervisionOfficerFixture,
  SupervisionOfficerMetricEvent,
  supervisionOfficerMetricEventFixture,
  SupervisionOfficerOutcomes,
  supervisionOfficerOutcomesFixture,
  SupervisionOfficerSupervisor,
  supervisionOfficerSupervisorsFixture,
  supervisionOfficerVitalsMetricFixture,
  SupervisionVitalsMetric,
  UserInfo,
} from "~datatypes";

import type { InsightsStore } from "../InsightsStore";
import {
  ActionStrategySurfacedEvent,
  InsightsAPI,
  PatchUserInfoProps,
} from "./interface";

export class InsightsOfflineAPIClient implements InsightsAPI {
  private pseudoIdToEditableUserInfo: Map<
    string,
    { metadata: PatchUserInfoProps }
  > = new Map();

  constructor(public readonly insightsStore: InsightsStore) {}

  async init() {
    const { currentTenantId } = this.insightsStore.rootStore;
    const configsByTenantId = getMockConfigsByTenantId();
    if (isTestEnv() || !currentTenantId) return InsightsConfigFixture;

    return configsByTenantId[currentTenantId];
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
    return supervisionOfficerSupervisorsFixture;
  }

  /**
   * We will adjust the fixture data returned from the outcomes methods based on the current state and current environment.
   * test environment: don't filter at all
   * offline & demo mode: filter outcomes metrics to be only the metric types specified in the state's config
   * States other than US_CA: filter out topXPctMetrics since the "Positive Highlights" are only enabled in CA
   */
  filterForStateAndEnv(
    data: SupervisionOfficerOutcomes,
  ): SupervisionOfficerOutcomes {
    const { currentTenantId } = this.insightsStore.rootStore;

    if (isTestEnv() || !currentTenantId) return data;

    const stateConfig = getMockConfigsByTenantId()[currentTenantId];

    const caseloadCategories =
      stateConfig.caseloadCategories?.map((c) => c.id) ?? [];
    // If there are no specialized caseload categories configured for a state,
    // caseloadCategories will be [], so we push the default "ALL" here
    // to aid in the metrics filtering
    if (caseloadCategories.length === 0) caseloadCategories.push("ALL");

    // Filter out merics to include only metrics for the caseload category enabled for the state,
    // and for the metric ids enabled for the state.
    const returnValue = {
      ...data,
      outlierMetrics: caseloadCategories.includes(data.caseloadCategory)
        ? data.outlierMetrics.filter((metric) =>
            stateConfig.metrics.map((m) => m.name).includes(metric.metricId),
          )
        : [],
      topXPctMetrics:
        currentTenantId.toUpperCase() === "US_CA" ? data.topXPctMetrics : [],
    };
    return returnValue;
  }

  async officersForSupervisor(
    supervisorPseudoId: string,
  ): Promise<Array<SupervisionOfficer>> {
    return supervisionOfficerFixture.filter((o) =>
      o.supervisorExternalIds
        .map((i) => `hashed-${i}`)
        .includes(supervisorPseudoId),
    );
  }

  async outcomesForSupervisor(
    supervisorPseudoId: string,
  ): Promise<Array<SupervisionOfficerOutcomes>> {
    const stateSpecificFixture = supervisionOfficerOutcomesFixture.map(
      (officerOutcomes) => this.filterForStateAndEnv(officerOutcomes),
    );
    // filter for officer outcomes fixtures belonging to this supervisor
    return stateSpecificFixture.filter((officerOutcomes) => {
      const officerFixture = supervisionOfficerFixture.find(
        (o) => o.pseudonymizedId === officerOutcomes.pseudonymizedId,
      );

      if (!officerFixture)
        throw new Error(
          `Officer ${officerOutcomes.pseudonymizedId} not present in fixture data`,
        );

      return officerFixture.supervisorExternalIds
        .map((i) => `hashed-${i}`)
        .includes(supervisorPseudoId);
    });
  }

  async supervisionOfficer(
    officerPseudoId: string,
  ): Promise<SupervisionOfficer> {
    const officerFixture = supervisionOfficerFixture.find(
      (o) => o.pseudonymizedId === officerPseudoId,
    );

    if (!officerFixture)
      throw new Error(`Officer ${officerPseudoId} not present in fixture data`);

    return officerFixture;
  }

  async outcomesForOfficer(
    officerPseudoId: string,
  ): Promise<SupervisionOfficerOutcomes> {
    const outcomesFixture = supervisionOfficerOutcomesFixture.find(
      (o) => o.pseudonymizedId === officerPseudoId,
    );

    if (!outcomesFixture)
      throw new Error(
        `No outcomes fixture data for officer with pseudo id: [${officerPseudoId}]`,
      );

    return this.filterForStateAndEnv(outcomesFixture);
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

  async vitalsForSupervisor(
    supervisorPseudoId: string,
  ): Promise<Array<SupervisionVitalsMetric>> {
    const hasVitalsMetrics = (await this.init()).vitalsMetrics.length > 0;
    if (!hasVitalsMetrics) return [];
    const supervisor = supervisionOfficerSupervisorsFixture.find(
      (s) => s.pseudonymizedId === supervisorPseudoId,
    );
    if (!supervisor) return [];
    return supervisionOfficerVitalsMetricFixture.map((metric) => {
      return {
        ...metric,
        vitalsMetrics: metric.vitalsMetrics.filter((metricForOfficer) => {
          const officersForSupervisor = supervisionOfficerFixture
            .filter((o) =>
              o.supervisorExternalIds.includes(supervisor?.externalId),
            )
            .map((o) => o.pseudonymizedId);
          return officersForSupervisor.includes(
            metricForOfficer.officerPseudonymizedId,
          );
        }),
      };
    });
  }

  async vitalsForOfficer(
    officerPseudoId: string,
  ): Promise<Array<SupervisionVitalsMetric>> {
    const hasVitalsMetrics = (await this.init()).vitalsMetrics.length > 0;
    if (!hasVitalsMetrics) return [];
    return supervisionOfficerVitalsMetricFixture.map((metric) => {
      return {
        ...metric,
        vitalsMetrics: metric.vitalsMetrics.filter(
          (metricForOfficer) =>
            officerPseudoId === metricForOfficer.officerPseudonymizedId,
        ),
      };
    });
  }

  /**
   * Not for use in Offline or Demo mode.
   */
  async downloadStateConfiguration(stateCode: string): Promise<InsightsConfig> {
    throw new Error(
      "Insights configurations cannot be downloaded in Offline/Demo mode",
    );
  }
}
