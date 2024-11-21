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

import {
  ActionStrategy,
  actionStrategySchema,
  ClientEvent,
  clientEventSchema,
  ClientInfo,
  clientInfoSchema,
  ExcludedSupervisionOfficer,
  excludedSupervisionOfficerSchema,
  insightsConfigSchema,
  MetricBenchmark,
  metricBenchmarkSchema,
  SupervisionOfficer,
  supervisionOfficerFixture,
  SupervisionOfficerMetricEvent,
  supervisionOfficerMetricEventSchema,
  supervisionOfficerSchema,
  SupervisionOfficerSupervisor,
  supervisionOfficerSupervisorSchema,
  supervisionOfficerSupervisorsFixture,
  supervisionOfficerVitalsMetricFixture,
  SupervisionVitalsMetric,
  UserInfo,
  userInfoSchema,
} from "~datatypes";

import { formatDateToISO } from "../../utils";
import type { InsightsStore } from "../InsightsStore";
import {
  ActionStrategySurfacedEvent,
  InsightsAPI,
  PatchUserInfoProps,
} from "./interface";

export class InsightsAPIClient implements InsightsAPI {
  // eslint-disable-next-line no-useless-constructor
  constructor(public readonly insightsStore: InsightsStore) {}

  private get apiStore() {
    return this.insightsStore.rootStore.apiStore;
  }

  private get baseUrl() {
    return `${import.meta.env.VITE_NEW_BACKEND_API_URL}/outliers/${this.tenantId}`;
  }

  get tenantId(): string {
    const { currentTenantId } = this.insightsStore.rootStore;
    if (!currentTenantId) {
      throw new Error(`Attempted to fetch data with undefined tenantId`);
    }
    return currentTenantId;
  }

  async init() {
    const endpoint = `${this.baseUrl}/configuration`;
    const fetchedData = await this.apiStore.get(endpoint);
    return insightsConfigSchema.parse(fetchedData.config);
  }

  async actionStrategies(supervisorPseudoId: string): Promise<ActionStrategy> {
    const endpoint = `${this.baseUrl}/action_strategies/${supervisorPseudoId}`;
    const fetchedData = await this.apiStore.get(endpoint);
    return actionStrategySchema.parse(fetchedData);
  }

  async patchActionStrategies(
    props: ActionStrategySurfacedEvent,
  ): Promise<ActionStrategySurfacedEvent> {
    const endpoint = `${this.baseUrl}/action_strategies/${props.userPseudonymizedId}`;
    const fetchedData = await this.apiStore.patch(endpoint, props);
    const {
      userPseudonymizedId,
      officerPseudonymizedId,
      actionStrategy,
      timestamp,
    } = fetchedData;
    return {
      userPseudonymizedId,
      officerPseudonymizedId,
      actionStrategy,
      timestamp,
    };
  }

  async userInfo(userPseudoId: string): Promise<UserInfo> {
    const endpoint = `${this.baseUrl}/user-info/${userPseudoId}`;
    const fetchedData = await this.apiStore.get(endpoint);
    return userInfoSchema.parse(fetchedData);
  }

  async patchUserInfo(
    userPseudoId: string,
    props: PatchUserInfoProps,
  ): Promise<UserInfo> {
    const endpoint = `${this.baseUrl}/user-info/${userPseudoId}`;
    const fetchedData = await this.apiStore.patch(endpoint, props);
    return userInfoSchema.parse(fetchedData);
  }

  async metricBenchmarks(): Promise<MetricBenchmark[]> {
    const endpoint = `${this.baseUrl}/benchmarks`;
    const fetchedData = await this.apiStore.get(endpoint);
    const benchmarkData = fetchedData.metrics as Array<unknown>;
    return benchmarkData.map((d) => {
      return metricBenchmarkSchema.parse(d);
    });
  }

  async supervisionOfficerSupervisors(): Promise<
    SupervisionOfficerSupervisor[]
  > {
    const endpoint = `${this.baseUrl}/supervisors`;
    const fetchedData = await this.apiStore.get(endpoint);
    const supervisorData = fetchedData.supervisors as Array<unknown>;
    return supervisorData.map((b) =>
      supervisionOfficerSupervisorSchema.parse(b),
    );
  }

  async officersForSupervisor(
    supervisorPseudoId: string,
  ): Promise<Array<SupervisionOfficer>> {
    const endpoint = `${this.baseUrl}/supervisor/${supervisorPseudoId}/officers`;
    const fetchedData = await this.apiStore.get(endpoint);
    const officerData = fetchedData.officers as Array<unknown>;
    return officerData.map((b) => supervisionOfficerSchema.parse(b));
  }

  async excludedOfficersForSupervisor(
    supervisorPseudoId: string,
  ): Promise<Array<ExcludedSupervisionOfficer>> {
    const endpoint = `${this.baseUrl}/supervisor/${supervisorPseudoId}/excluded_officers`;
    const fetchedData = await this.apiStore.get(endpoint);
    const officerData = fetchedData.officers as Array<unknown>;
    return officerData.map((b) => excludedSupervisionOfficerSchema.parse(b));
  }

  async supervisionOfficer(
    officerPseudoId: string,
  ): Promise<SupervisionOfficer> {
    const endpoint = `${this.baseUrl}/officer/${officerPseudoId}`;
    const fetchedData = await this.apiStore.get(endpoint);
    const officerData = fetchedData.officer as unknown;
    return supervisionOfficerSchema.parse(officerData);
  }

  async excludedSupervisionOfficer(
    officerPseudoId: string,
  ): Promise<ExcludedSupervisionOfficer> {
    // TODO: (#6044) Convert "/excluded_officer/" to "/officer/" once all officers are served from the same endpoint.
    const endpoint = `${this.baseUrl}/excluded_officer/${officerPseudoId}`;
    const fetchedData = await this.apiStore.get(endpoint);
    const officerData = fetchedData.officer as unknown;
    return excludedSupervisionOfficerSchema.parse(officerData);
  }

  async supervisionOfficerMetricEvents(
    officerPseudoId: string,
    metricId: string,
  ): Promise<SupervisionOfficerMetricEvent[]> {
    const endpoint = `${this.baseUrl}/officer/${officerPseudoId}/events?metric_id=${metricId}`;
    const fetchedData = await this.apiStore.get(endpoint);
    const eventsData = fetchedData.events as Array<unknown>;
    return eventsData.map((b) => supervisionOfficerMetricEventSchema.parse(b));
  }

  async clientInfo(clientPseudoId: string): Promise<ClientInfo> {
    const endpoint = `${this.baseUrl}/client/${clientPseudoId}`;
    const fetchedData = await this.apiStore.get(endpoint);
    const clientData = fetchedData.client as unknown;
    return clientInfoSchema.parse(clientData);
  }

  async clientEvents(
    clientPseudoId: string,
    endDate: Date,
  ): Promise<Array<ClientEvent>> {
    const endpoint = `${
      this.baseUrl
    }/client/${clientPseudoId}/events?period_end_date=${formatDateToISO(
      endDate,
    )}`;
    const fetchedData = await this.apiStore.get(endpoint);
    const eventsData = fetchedData.events as Array<unknown>;
    return eventsData.map((b) => clientEventSchema.parse(b));
  }

  // TODO #6671 - Instead of using fixture data, make request to endpoint once it is deployed
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

  async vitalsForOfficer(
    officerPseudoId: string,
  ): Promise<Array<SupervisionVitalsMetric>> {
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
}
