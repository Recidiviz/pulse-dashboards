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

import { formatDateToISO } from "../../utils";
import type { InsightsStore } from "../InsightsStore";
import { ClientEvent, clientEventSchema } from "../models/ClientEvent";
import { ClientInfo, clientInfoSchema } from "../models/ClientInfo";
import { insightsConfigSchema } from "../models/InsightsConfig";
import {
  MetricBenchmark,
  metricBenchmarkSchema,
} from "../models/MetricBenchmark";
import {
  SupervisionOfficer,
  supervisionOfficerSchema,
} from "../models/SupervisionOfficer";
import {
  SupervisionOfficerMetricEvent,
  supervisionOfficerMetricEventSchema,
} from "../models/SupervisionOfficerMetricEvent";
import {
  SupervisionOfficerSupervisor,
  supervisionOfficerSupervisorSchema,
} from "../models/SupervisionOfficerSupervisor";
import { UserInfo, userInfoSchema } from "../models/UserInfo";
import { InsightsAPI, PatchUserInfoProps } from "./interface";

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

  async supervisionOfficer(
    officerPseudoId: string,
  ): Promise<SupervisionOfficer> {
    const endpoint = `${this.baseUrl}/officer/${officerPseudoId}`;
    const fetchedData = await this.apiStore.get(endpoint);
    const officerData = fetchedData.officer as unknown;
    return supervisionOfficerSchema.parse(officerData);
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
}
