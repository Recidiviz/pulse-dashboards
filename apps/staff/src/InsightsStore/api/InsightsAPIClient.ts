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

import { mapKeys, snakeCase } from "lodash";

import {
  ActionStrategy,
  actionStrategySchema,
  ClientEvent,
  clientEventSchema,
  ClientInfo,
  clientInfoSchema,
  InsightsConfig,
  insightsConfigSchema,
  MetricBenchmark,
  metricBenchmarkSchema,
  RosterChangeRequest,
  RosterChangeRequestResponse,
  rosterChangeRequestResponseSchema,
  SupervisionOfficer,
  SupervisionOfficerMetricEvent,
  supervisionOfficerMetricEventSchema,
  SupervisionOfficerOutcomes,
  supervisionOfficerOutcomesSchema,
  supervisionOfficerSchema,
  SupervisionOfficerSupervisor,
  supervisionOfficerSupervisorSchema,
  SupervisionVitalsMetric,
  supervisionVitalsMetricSchema,
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
    const { data } = await this.apiStore.client.get(endpoint);
    return insightsConfigSchema.parse(data.config);
  }

  async actionStrategies(supervisorPseudoId: string): Promise<ActionStrategy> {
    const endpoint = `${this.baseUrl}/action_strategies/${supervisorPseudoId}`;
    const { data } = await this.apiStore.client.get(endpoint);
    return actionStrategySchema.parse(data);
  }

  async patchActionStrategies(
    props: ActionStrategySurfacedEvent,
  ): Promise<ActionStrategySurfacedEvent> {
    const endpoint = `${this.baseUrl}/action_strategies/${props.userPseudonymizedId}`;
    const { data } = await this.apiStore.client.patch(endpoint, props);
    const {
      userPseudonymizedId,
      officerPseudonymizedId,
      actionStrategy,
      timestamp,
    } = data;
    return {
      userPseudonymizedId,
      officerPseudonymizedId,
      actionStrategy,
      timestamp,
    };
  }

  async userInfo(userPseudoId: string): Promise<UserInfo> {
    const endpoint = `${this.baseUrl}/user-info/${userPseudoId}`;
    const { data } = await this.apiStore.client.get(endpoint);
    return userInfoSchema.parse(data);
  }

  async patchUserInfo(
    userPseudoId: string,
    props: PatchUserInfoProps,
  ): Promise<UserInfo> {
    const endpoint = `${this.baseUrl}/user-info/${userPseudoId}`;
    const { data } = await this.apiStore.client.patch(endpoint, props);
    return userInfoSchema.parse(data);
  }

  async metricBenchmarks(): Promise<MetricBenchmark[]> {
    const endpoint = `${this.baseUrl}/benchmarks`;
    const { data } = await this.apiStore.client.get(endpoint);
    const benchmarkData = data.metrics as Array<unknown>;
    return benchmarkData.map((d) => {
      return metricBenchmarkSchema.parse(d);
    });
  }

  async supervisionOfficerSupervisors(): Promise<
    SupervisionOfficerSupervisor[]
  > {
    const endpoint = `${this.baseUrl}/supervisors`;
    const { data } = await this.apiStore.client.get(endpoint);
    const supervisorData = data.supervisors as Array<unknown>;
    return supervisorData.map((b) =>
      supervisionOfficerSupervisorSchema.parse(b),
    );
  }

  async officersForSupervisor(
    supervisorPseudoId: string,
  ): Promise<Array<SupervisionOfficer>> {
    const endpoint = `${this.baseUrl}/supervisor/${supervisorPseudoId}/officers`;
    const { data } = await this.apiStore.client.get(endpoint);
    const officerData = data.officers as Array<unknown>;
    return officerData.map((b) => supervisionOfficerSchema.parse(b));
  }

  async outcomesForSupervisor(
    supervisorPseudoId: string,
  ): Promise<Array<SupervisionOfficerOutcomes>> {
    const endpoint = `${this.baseUrl}/supervisor/${supervisorPseudoId}/outcomes`;
    const { data } = await this.apiStore.client.get(endpoint);
    const outcomesData = data.outcomes as Array<unknown>;
    return outcomesData.map((b) => supervisionOfficerOutcomesSchema.parse(b));
  }

  async allSupervisionOfficers(): Promise<Array<SupervisionOfficer>> {
    const endpoint = `${this.baseUrl}/officers`;
    const { data } = await this.apiStore.client.get(endpoint);
    const officerData = data.officers as Array<unknown>;
    return officerData.map((b) => supervisionOfficerSchema.parse(b));
  }

  async supervisionOfficer(
    officerPseudoId: string,
  ): Promise<SupervisionOfficer> {
    const endpoint = `${this.baseUrl}/officer/${officerPseudoId}`;
    const { data } = await this.apiStore.client.get(endpoint);
    const officerData = data.officer as unknown;
    return supervisionOfficerSchema.parse(officerData);
  }

  async outcomesForOfficer(
    officerPseudoId: string,
  ): Promise<SupervisionOfficerOutcomes> {
    const endpoint = `${this.baseUrl}/officer/${officerPseudoId}/outcomes`;
    const { data } = await this.apiStore.client.get(endpoint);
    const outcomesData = data.outcomes as unknown;
    return supervisionOfficerOutcomesSchema.parse(outcomesData);
  }

  async supervisionOfficerMetricEvents(
    officerPseudoId: string,
    metricId: string,
  ): Promise<SupervisionOfficerMetricEvent[]> {
    const endpoint = `${this.baseUrl}/officer/${officerPseudoId}/events?metric_id=${metricId}`;
    const { data } = await this.apiStore.client.get(endpoint);
    const eventsData = data.events as Array<unknown>;
    return eventsData.map((b) => supervisionOfficerMetricEventSchema.parse(b));
  }

  async clientInfo(clientPseudoId: string): Promise<ClientInfo> {
    const endpoint = `${this.baseUrl}/client/${clientPseudoId}`;
    const { data } = await this.apiStore.client.get(endpoint);
    const clientData = data.client as unknown;
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
    const { data } = await this.apiStore.client.get(endpoint);
    const eventsData = data.events as Array<unknown>;
    return eventsData.map((b) => clientEventSchema.parse(b));
  }

  async vitalsForSupervisor(
    supervisorPseudoId: string,
  ): Promise<Array<SupervisionVitalsMetric>> {
    const endpoint = `${this.baseUrl}/supervisor/${supervisorPseudoId}/vitals`;
    const { data } = await this.apiStore.client.get(endpoint);
    return (data as Array<unknown>).map((b) =>
      supervisionVitalsMetricSchema.parse(b),
    );
  }

  async vitalsForOfficer(
    officerPseudoId: string,
  ): Promise<Array<SupervisionVitalsMetric>> {
    const endpoint = `${this.baseUrl}/officer/${officerPseudoId}/vitals`;
    const { data } = await this.apiStore.client.get(endpoint);
    return (data as Array<unknown>).map((b) =>
      supervisionVitalsMetricSchema.parse(b),
    );
  }

  async submitRosterChangeRequestIntercomTicket(
    supervisorPseudoId: string,
    props: RosterChangeRequest,
  ): Promise<RosterChangeRequestResponse> {
    const endpoint = `${this.baseUrl}/supervisor/${supervisorPseudoId}/roster_change_request`;
    const { data } = await this.apiStore.client.post(
      endpoint,
      // TODO (#7866): Remove `mapKeys` `snakeCase` once the backend has implemented this
      mapKeys(props, (_, k) => snakeCase(k)),
    );
    return rosterChangeRequestResponseSchema.parse(data);
  }

  /**
   * This method is for internal use only.
   * @internal
   */
  async downloadStateConfiguration(stateCode: string): Promise<InsightsConfig> {
    const endpoint = `${import.meta.env.VITE_NEW_BACKEND_API_URL}/outliers/${stateCode}/configuration`;

    const { data } = await this.apiStore.client.get(endpoint);

    return insightsConfigSchema.parse(data.config);
  }
}
