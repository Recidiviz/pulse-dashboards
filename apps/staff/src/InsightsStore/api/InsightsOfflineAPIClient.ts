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

import { isDemoMode } from "~client-env-utils";
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
  SupervisionOfficer,
  supervisionOfficerFixture,
  SupervisionOfficerMetricEvent,
  supervisionOfficerMetricEventFixture,
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
    return excludedSupervisionOfficerFixture.filter((o) =>
      o.supervisorExternalIds
        .map((i) => `hashed-${i}`)
        .includes(supervisorPseudoId),
    );
  }

  async supervisionOfficer(
    officerPseudoId: string,
  ): Promise<SupervisionOfficer> {
    const officerFixture = supervisionOfficerFixture.find(
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
    const officerFixture = excludedSupervisionOfficerFixture.find(
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

  async vitalsForSupervisor(
    supervisorPseudoId: string,
  ): Promise<Array<SupervisionVitalsMetric>> {
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
}
