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

import { callNewMetricsApi } from "../../api/metrics/metricsClient";
import { ClientInfo } from "../models/ClientInfo";
import {
  MetricBenchmark,
  metricBenchmarkSchema,
} from "../models/MetricBenchmark";
import { outliersConfigSchema } from "../models/OutliersConfig";
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
import type { OutliersStore } from "../OutliersStore";
import { OutliersAPI } from "./interface";

export class OutliersAPIClient implements OutliersAPI {
  // eslint-disable-next-line no-useless-constructor
  constructor(public readonly outliersStore: OutliersStore) {}

  tenantId(): string {
    const { currentTenantId } = this.outliersStore.rootStore;
    if (!currentTenantId) {
      throw new Error(`Attempted to fetch data with undefined tenantId`);
    }
    return currentTenantId;
  }

  init() {
    const endpoint = `outliers/${this.tenantId()}/configuration`.toLowerCase();
    return callNewMetricsApi(
      endpoint,
      this.outliersStore.rootStore.getTokenSilently
    ).then((fetchedData) => {
      return outliersConfigSchema.parse(fetchedData.config);
    });
  }

  metricBenchmarks(): Promise<MetricBenchmark[]> {
    const endpoint = `outliers/${this.tenantId()}/benchmarks`.toLowerCase();
    return callNewMetricsApi(
      endpoint,
      this.outliersStore.rootStore.getTokenSilently
    ).then((fetchedData) => {
      const benchmarkData = fetchedData.metrics as Array<unknown>;
      return benchmarkData.map((d) => {
        return metricBenchmarkSchema.parse(d);
      });
    });
  }

  supervisionOfficerSupervisors(): Promise<SupervisionOfficerSupervisor[]> {
    const endpoint = `outliers/${this.tenantId()}/supervisors`.toLowerCase();
    return callNewMetricsApi(
      endpoint,
      this.outliersStore.rootStore.getTokenSilently
    ).then((fetchedData) => {
      const supervisorData = fetchedData.supervisors as Array<unknown>;
      return supervisorData.map((b) =>
        supervisionOfficerSupervisorSchema.parse(b)
      );
    });
  }

  async officersForSupervisor(
    supervisorPseudoId: string
  ): Promise<Array<SupervisionOfficer>> {
    const endpoint = `outliers/${this.tenantId()}/supervisor/${supervisorPseudoId}/officers`;
    return callNewMetricsApi(
      endpoint,
      this.outliersStore.rootStore.getTokenSilently
    ).then((fetchedData) => {
      const officerData = fetchedData.officers as Array<unknown>;
      return officerData.map((b) => supervisionOfficerSchema.parse(b));
    });
  }

  supervisionOfficer(officerPseudoId: string): Promise<SupervisionOfficer> {
    const endpoint = `outliers/${this.tenantId()}/officer/${officerPseudoId}`;
    return callNewMetricsApi(
      endpoint,
      this.outliersStore.rootStore.getTokenSilently
    ).then((fetchedData) => {
      const officerData = fetchedData.officer as unknown;
      return supervisionOfficerSchema.parse(officerData);
    });
  }

  supervisionOfficerMetricEvents(
    officerPseudoId: string,
    metricId: string
  ): Promise<SupervisionOfficerMetricEvent[]> {
    const endpoint = `outliers/${this.tenantId()}/officer/${officerPseudoId}/events?metric_id=${metricId}`;
    return callNewMetricsApi(
      endpoint,
      this.outliersStore.rootStore.getTokenSilently
    ).then((fetchedData) => {
      const eventsData = fetchedData.events as Array<unknown>;
      return eventsData.map((b) =>
        supervisionOfficerMetricEventSchema.parse(b)
      );
    });
  }

  // TODO(#4307): Fetch real data from backend
  // eslint-disable-next-line class-methods-use-this
  async clientInfo(clientPseudoId: string): Promise<ClientInfo> {
    const { clientInfoFixture } = await import(
      "../models/offlineFixtures/ClientInfoFixture"
    );

    const clientInfo = clientInfoFixture[clientPseudoId];

    if (!clientInfo) {
      throw new Error(`Client ${clientPseudoId} not present in fixture data`);
    }

    return clientInfo;
  }
}
